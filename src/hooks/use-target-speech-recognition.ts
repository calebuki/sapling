"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { TargetSpeechResult } from "@/types/lesson-evaluation";

export type RecordingStatus = "idle" | "starting" | "listening" | "stopping";

export type TargetRecognitionOptions =
  | { mode: "open" }
  | { mode: "scripted"; referenceText: string };

type ActiveSpeechRecognizer = {
  close: () => void;
  stopContinuousRecognitionAsync: (
    onStopped?: () => void,
    onError?: (error: string) => void,
  ) => void;
};

type SpeechTokenResponse = {
  token?: string;
  region?: string;
  error?: string;
};

function toUnitScore(score: number | null | undefined) {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return 0;
  }
  return Math.max(0, Math.min(1, score / 100));
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function recognitionAlternatives(resultJson: string | undefined) {
  if (!resultJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(resultJson) as {
      NBest?: Array<{ Display?: string; Lexical?: string }>;
    };
    return (parsed.NBest ?? [])
      .flatMap((candidate) => candidate.Display ?? candidate.Lexical ?? [])
      .map((candidate) => candidate.trim())
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
}

export function useTargetSpeechRecognition(locale: "da-DK" | "sv-SE") {
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const activeRecognizer = useRef<ActiveSpeechRecognizer | null>(null);
  const activeAudioConfig = useRef<{ close: () => void } | null>(null);
  const stopActiveRecognition = useRef<(() => void) | null>(null);
  const recognitionRunId = useRef(0);

  useEffect(() => {
    return () => {
      recognitionRunId.current += 1;
      activeRecognizer.current?.stopContinuousRecognitionAsync();
      activeRecognizer.current?.close();
      activeAudioConfig.current?.close();
      activeRecognizer.current = null;
      activeAudioConfig.current = null;
      stopActiveRecognition.current = null;
    };
  }, []);

  const resetTranscript = useCallback(() => setLiveTranscript(""), []);

  const stop = useCallback(() => {
    stopActiveRecognition.current?.();
  }, []);

  const start = useCallback(async (options: TargetRecognitionOptions) => {
    if (activeRecognizer.current) {
      throw new Error("The microphone is already listening.");
    }

    const runId = recognitionRunId.current + 1;
    const attemptStartedAt = performance.now();
    recognitionRunId.current = runId;
    setLiveTranscript("");
    setRecordingStatus("starting");

    let recognizerToClose: ActiveSpeechRecognizer | null = null;
    let audioConfigToClose: { close: () => void } | null = null;

    try {
      const tokenResponse = await fetch("/api/speech/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const credentials = (await tokenResponse.json()) as SpeechTokenResponse;

      if (!tokenResponse.ok || !credentials.token || !credentials.region) {
        throw new Error(
          credentials.error ?? "Speaking practice is temporarily unavailable.",
        );
      }

      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
        credentials.token,
        credentials.region,
      );
      const isOpenResponse = options.mode === "open";
      const silenceBeforeStopMs = isOpenResponse ? 3_200 : 1_600;
      const maximumDurationMs = isOpenResponse ? 45_000 : 15_000;

      speechConfig.speechRecognitionLanguage = locale;
      speechConfig.outputFormat = sdk.OutputFormat.Detailed;
      speechConfig.setProperty(
        sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
        isOpenResponse ? "1800" : "900",
      );
      speechConfig.setProperty(
        sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
        "10000",
      );

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      recognizerToClose = recognizer;
      audioConfigToClose = audioConfig;
      activeRecognizer.current = recognizer;
      activeAudioConfig.current = audioConfig;

      if (options.mode === "scripted") {
        const assessmentConfig = new sdk.PronunciationAssessmentConfig(
          options.referenceText,
          sdk.PronunciationAssessmentGradingSystem.HundredMark,
          sdk.PronunciationAssessmentGranularity.Phoneme,
          false,
        );
        assessmentConfig.phonemeAlphabet = "IPA";
        assessmentConfig.applyTo(recognizer);
      }

      return await new Promise<TargetSpeechResult>((resolve, reject) => {
        let settled = false;
        let stopRequested = false;
        let heardSpeech = false;
        let firstSpeechStartedAt: number | null = null;
        let silenceTimer: ReturnType<typeof setTimeout> | null = null;
        let initialSilenceTimer: ReturnType<typeof setTimeout> | null = null;
        let maximumDurationTimer: ReturnType<typeof setTimeout> | null = null;
        let finalResultTimer: ReturnType<typeof setTimeout> | null = null;
        const finalSegments: TargetSpeechResult[] = [];
        const alternativeTexts = new Set<string>();

        function clearTimer(timer: ReturnType<typeof setTimeout> | null) {
          if (timer) {
            clearTimeout(timer);
          }
        }

        function clearRecognitionTimers() {
          clearTimer(silenceTimer);
          clearTimer(initialSilenceTimer);
          clearTimer(maximumDurationTimer);
          clearTimer(finalResultTimer);
        }

        function fail(error: Error) {
          if (settled || recognitionRunId.current !== runId) {
            return;
          }
          settled = true;
          clearRecognitionTimers();
          reject(error);
        }

        function combinedTranscript(partial = "") {
          return [...finalSegments.map((segment) => segment.recognizedText), partial]
            .map((text) => text.trim())
            .filter(Boolean)
            .join(" ");
        }

        function finish() {
          if (settled || recognitionRunId.current !== runId) {
            return;
          }

          if (finalSegments.length === 0) {
            fail(
              new Error(
                heardSpeech
                  ? "I heard you, but couldn’t finish the transcript. Try once more."
                  : "I couldn’t hear speech. Check your microphone and try again.",
              ),
            );
            return;
          }

          settled = true;
          clearRecognitionTimers();
          const recognizedText = combinedTranscript();
          const pronunciationScore = average(
            finalSegments.map((segment) => segment.pronunciationScore),
          );
          const completenessScore = average(
            finalSegments.map((segment) => segment.completenessScore),
          );
          const result: TargetSpeechResult = {
            recognizedText,
            responseStartLatencyMs: Math.max(
              0,
              Math.round((firstSpeechStartedAt ?? attemptStartedAt) - attemptStartedAt),
            ),
            durationMs: finalSegments.reduce(
              (total, segment) => total + segment.durationMs,
              0,
            ),
            accuracyScore: average(
              finalSegments.map((segment) => segment.accuracyScore),
            ),
            fluencyScore: average(
              finalSegments.map((segment) => segment.fluencyScore),
            ),
            completenessScore,
            pronunciationScore,
            wordDetails: finalSegments.flatMap((segment) => segment.wordDetails),
            alternatives: [...alternativeTexts]
              .filter((alternative) => alternative !== recognizedText)
              .slice(0, 6),
            successful:
              pronunciationScore >= 0.7 &&
              (isOpenResponse || completenessScore >= 0.7),
          };
          setLiveTranscript(recognizedText);
          resolve(result);
        }

        function requestStop() {
          if (stopRequested || recognitionRunId.current !== runId) {
            return;
          }
          stopRequested = true;
          setRecordingStatus("stopping");
          clearTimer(silenceTimer);
          clearTimer(initialSilenceTimer);
          clearTimer(maximumDurationTimer);

          finalResultTimer = setTimeout(() => {
            finish();
          }, 4_000);

          recognizer.stopContinuousRecognitionAsync(
            finish,
            (recognitionError) => fail(new Error(recognitionError)),
          );
        }

        function noteSpeech(partial: string) {
          const transcript = partial.trim();
          if (!transcript || recognitionRunId.current !== runId) {
            return;
          }

          heardSpeech = true;
          firstSpeechStartedAt ??= performance.now();
          clearTimer(initialSilenceTimer);
          clearTimer(silenceTimer);
          setLiveTranscript(combinedTranscript(transcript));
          silenceTimer = setTimeout(requestStop, silenceBeforeStopMs);
        }

        stopActiveRecognition.current = requestStop;

        recognizer.recognizing = (_sender, event) => {
          noteSpeech(event.result.text);
        };

        recognizer.recognized = (_sender, event) => {
          if (
            settled ||
            recognitionRunId.current !== runId ||
            event.result.reason !== sdk.ResultReason.RecognizedSpeech ||
            !event.result.text.trim()
          ) {
            return;
          }

          heardSpeech = true;
          firstSpeechStartedAt ??= performance.now();
          const recognizedText = event.result.text.trim();
          for (const alternative of recognitionAlternatives(event.result.json)) {
            alternativeTexts.add(alternative);
          }

          let accuracyScore = 0;
          let fluencyScore = 0;
          let completenessScore = isOpenResponse ? 1 : 0;
          let pronunciationScore = 0;
          let wordDetails: TargetSpeechResult["wordDetails"] = [];

          if (!isOpenResponse) {
            try {
              const assessment =
                sdk.PronunciationAssessmentResult.fromResult(event.result);
              accuracyScore = toUnitScore(assessment.accuracyScore);
              fluencyScore = toUnitScore(assessment.fluencyScore);
              completenessScore = toUnitScore(assessment.completenessScore);
              pronunciationScore = toUnitScore(assessment.pronunciationScore);
              wordDetails = (assessment.detailResult?.Words ?? []).map(
                (word) => ({
                  word: word.Word,
                  accuracyScore: toUnitScore(
                    word.PronunciationAssessment?.AccuracyScore ?? 0,
                  ),
                  errorType:
                    word.PronunciationAssessment?.ErrorType ?? "Unknown",
                }),
              );
            } catch {
              // The transcript is still useful if assessment metadata is absent.
            }
          }

          finalSegments.push({
            recognizedText,
            responseStartLatencyMs: Math.max(
              0,
              Math.round((firstSpeechStartedAt ?? attemptStartedAt) - attemptStartedAt),
            ),
            durationMs: Math.round(event.result.duration / 10_000),
            accuracyScore,
            fluencyScore,
            completenessScore,
            pronunciationScore,
            wordDetails,
            alternatives: [],
            successful: false,
          });
          setLiveTranscript(combinedTranscript());
          clearTimer(silenceTimer);

          if (isOpenResponse) {
            silenceTimer = setTimeout(requestStop, silenceBeforeStopMs);
          } else {
            requestStop();
          }
        };

        recognizer.canceled = (_sender, event) => {
          if (event.reason === sdk.CancellationReason.Error) {
            fail(
              new Error(
                event.errorDetails || "Azure stopped speech recognition.",
              ),
            );
          }
        };

        recognizer.sessionStopped = () => {
          if (!settled) {
            finish();
          }
        };

        recognizer.startContinuousRecognitionAsync(
          () => {
            if (recognitionRunId.current !== runId) {
              recognizer.stopContinuousRecognitionAsync();
              return;
            }
            setRecordingStatus("listening");
            initialSilenceTimer = setTimeout(requestStop, 10_000);
            maximumDurationTimer = setTimeout(requestStop, maximumDurationMs);
          },
          (recognitionError) => fail(new Error(recognitionError)),
        );
      });
    } finally {
      if (activeRecognizer.current === recognizerToClose) {
        recognizerToClose?.close();
        audioConfigToClose?.close();
        activeRecognizer.current = null;
        activeAudioConfig.current = null;
      }
      if (recognitionRunId.current === runId) {
        stopActiveRecognition.current = null;
        setRecordingStatus("idle");
      }
    }
  }, [locale]);

  return {
    isRecording: recordingStatus !== "idle",
    liveTranscript,
    recordingStatus,
    resetTranscript,
    start,
    stop,
  };
}
