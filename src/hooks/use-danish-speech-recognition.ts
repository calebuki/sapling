"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { DanishSpeechResult } from "@/types/lesson-evaluation";

export type RecordingStatus = "idle" | "starting" | "listening" | "stopping";

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

export function useDanishSpeechRecognition() {
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

  const start = useCallback(async (referenceText: string) => {
    if (activeRecognizer.current) {
      throw new Error("The microphone is already listening.");
    }

    const runId = recognitionRunId.current + 1;
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
      speechConfig.speechRecognitionLanguage = "da-DK";
      speechConfig.outputFormat = sdk.OutputFormat.Detailed;
      speechConfig.setProperty(
        sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
        "900",
      );
      speechConfig.setProperty(
        sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
        "8000",
      );

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      recognizerToClose = recognizer;
      audioConfigToClose = audioConfig;
      activeRecognizer.current = recognizer;
      activeAudioConfig.current = audioConfig;

      const assessmentConfig = new sdk.PronunciationAssessmentConfig(
        referenceText,
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        false,
      );
      assessmentConfig.phonemeAlphabet = "IPA";
      assessmentConfig.applyTo(recognizer);

      return await new Promise<DanishSpeechResult>((resolve, reject) => {
        let settled = false;
        let stopRequested = false;
        let heardSpeech = false;
        let silenceTimer: ReturnType<typeof setTimeout> | null = null;
        let initialSilenceTimer: ReturnType<typeof setTimeout> | null = null;
        let maximumDurationTimer: ReturnType<typeof setTimeout> | null = null;
        let finalResultTimer: ReturnType<typeof setTimeout> | null = null;

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

        function requestStop() {
          if (stopRequested || recognitionRunId.current !== runId) {
            return;
          }
          stopRequested = true;
          setRecordingStatus("stopping");
          clearTimer(silenceTimer);
          clearTimer(initialSilenceTimer);
          clearTimer(maximumDurationTimer);

          if (!settled) {
            finalResultTimer = setTimeout(() => {
              fail(
                new Error(
                  heardSpeech
                    ? "I heard you, but couldn’t finish the transcript. Try once more."
                    : "I couldn’t hear speech. Check your microphone and try again.",
                ),
              );
            }, 4000);
          }

          recognizer.stopContinuousRecognitionAsync(
            undefined,
            (recognitionError) => fail(new Error(recognitionError)),
          );
        }

        function noteRecognizedSpeech(text: string) {
          const transcript = text.trim();
          if (!transcript || recognitionRunId.current !== runId) {
            return;
          }

          heardSpeech = true;
          setLiveTranscript(transcript);
          clearTimer(initialSilenceTimer);
          clearTimer(silenceTimer);
          silenceTimer = setTimeout(requestStop, 1600);
        }

        stopActiveRecognition.current = requestStop;

        recognizer.recognizing = (_sender, event) => {
          noteRecognizedSpeech(event.result.text);
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

          try {
            const assessment =
              sdk.PronunciationAssessmentResult.fromResult(event.result);
            const wordDetails = (assessment.detailResult?.Words ?? []).map(
              (word) => ({
                word: word.Word,
                accuracyScore: toUnitScore(
                  word.PronunciationAssessment?.AccuracyScore ?? 0,
                ),
                errorType:
                  word.PronunciationAssessment?.ErrorType ?? "Unknown",
              }),
            );
            const result: DanishSpeechResult = {
              recognizedText: event.result.text.trim(),
              durationMs: Math.round(event.result.duration / 10_000),
              accuracyScore: toUnitScore(assessment.accuracyScore),
              fluencyScore: toUnitScore(assessment.fluencyScore),
              completenessScore: toUnitScore(assessment.completenessScore),
              pronunciationScore: toUnitScore(assessment.pronunciationScore),
              wordDetails,
              successful:
                assessment.pronunciationScore >= 65 &&
                assessment.completenessScore >= 70,
            };

            settled = true;
            clearRecognitionTimers();
            setLiveTranscript(result.recognizedText);
            if (!stopRequested) {
              stopRequested = true;
              recognizer.stopContinuousRecognitionAsync();
            }
            resolve(result);
          } catch (assessmentError) {
            fail(
              assessmentError instanceof Error
                ? assessmentError
                : new Error("Sapling could not score this recording."),
            );
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
            clearTimer(finalResultTimer);
            finalResultTimer = setTimeout(() => {
              fail(
                new Error(
                  heardSpeech
                    ? "I heard you, but couldn’t produce a final transcript. Try again."
                    : "I couldn’t hear speech. Check your microphone and try again.",
                ),
              );
            }, 350);
          }
        };

        recognizer.startContinuousRecognitionAsync(
          () => {
            if (recognitionRunId.current !== runId) {
              recognizer.stopContinuousRecognitionAsync();
              return;
            }
            setRecordingStatus("listening");
            initialSilenceTimer = setTimeout(requestStop, 8000);
            maximumDurationTimer = setTimeout(requestStop, 15000);
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
  }, []);

  return {
    isRecording: recordingStatus !== "idle",
    liveTranscript,
    recordingStatus,
    resetTranscript,
    start,
    stop,
  };
}
