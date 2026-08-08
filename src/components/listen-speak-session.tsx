"use client";

import {
  ArrowRight,
  Check,
  CircleAlert,
  LoaderCircle,
  Mic,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DanishAudioButton } from "@/components/danish-audio-button";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { listenSpeakItems } from "@/lib/learning/course";
import type { ListenSpeakItem } from "@/lib/learning/course";
import type {
  Concept,
  LearnerConceptState,
  PronunciationWordDetail,
} from "@/types/learning";

type Phase = "listen" | "repeat" | "result" | "complete";
type RecordingStatus = "idle" | "starting" | "listening" | "stopping";

type ActiveSpeechRecognizer = {
  close: () => void;
  stopContinuousRecognitionAsync: (
    onStopped?: () => void,
    onError?: (error: string) => void,
  ) => void;
};

type SpeakingResult = {
  recognizedText: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  wordDetails: PronunciationWordDetail[];
  successful: boolean;
};

type SpeechTokenResponse = {
  token?: string;
  region?: string;
  error?: string;
};

const listenSpeakRoundStorageKey = "sapling.listen-speak.round.v1";

function toUnitScore(score: number | null | undefined) {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return 0;
  }
  return Math.max(0, Math.min(1, score / 100));
}

function getNextRound() {
  try {
    const stored = Number.parseInt(
      window.localStorage.getItem(listenSpeakRoundStorageKey) ?? "0",
      10,
    );
    const round = Number.isFinite(stored) && stored >= 0 ? stored : 0;
    window.localStorage.setItem(
      listenSpeakRoundStorageKey,
      String(round + 1),
    );
    return round;
  } catch {
    return 0;
  }
}

function buildSession(
  concepts: Concept[],
  states: LearnerConceptState[],
  round: number,
) {
  const conceptBySlug = new Map(
    concepts.map((concept) => [concept.slug, concept]),
  );
  const stateByConcept = new Map(
    states.map((state) => [state.conceptId, state]),
  );
  const variantsByConcept = new Map<string, ListenSpeakItem[]>();

  for (const item of listenSpeakItems) {
    const variants = variantsByConcept.get(item.conceptSlug) ?? [];
    variants.push(item);
    variantsByConcept.set(item.conceptSlug, variants);
  }

  return [...variantsByConcept.entries()]
    .map(([conceptSlug, variants]) => {
      const concept = conceptBySlug.get(conceptSlug);
      const state = concept ? stateByConcept.get(concept.id) : undefined;
      const scores = [
        state?.recognitionAudio,
        state?.production,
        state?.pronunciation,
      ].filter((score): score is number => typeof score === "number");
      const strength =
        scores.length > 0
          ? scores.reduce((total, score) => total + score, 0) / scores.length
          : 0;
      const completedRounds = Math.floor((state?.exposureCount ?? 0) / 2);
      const variant = variants[(completedRounds + round) % variants.length];

      return {
        item: variant,
        sortOrder: concept?.sortOrder ?? Number.MAX_SAFE_INTEGER,
        strength,
      };
    })
    .sort(
      (left, right) =>
        left.strength - right.strength || left.sortOrder - right.sortOrder,
    )
    .map(({ item }) => item);
}

export function ListenSpeakSession() {
  const {
    concepts,
    states,
    isLoading,
    error: modelError,
    recordListeningAttempt,
    recordSpeakingAttempt,
  } = useLearningModel();
  const [itemIndex, setItemIndex] = useState(0);
  const [sessionItems, setSessionItems] = useState<ListenSpeakItem[]>([]);
  const [phase, setPhase] = useState<Phase>("listen");
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [playbackCount, setPlaybackCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speakingResult, setSpeakingResult] = useState<SpeakingResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const listeningStartedAt = useRef<number | null>(null);
  const activeRecognizer = useRef<ActiveSpeechRecognizer | null>(null);
  const activeAudioConfig = useRef<{ close: () => void } | null>(null);
  const stopActiveRecognition = useRef<(() => void) | null>(null);
  const recognitionRunId = useRef(0);
  const didPrepareSession = useRef(false);

  const prepareSession = useCallback(
    () => buildSession(concepts, states, getNextRound()),
    [concepts, states],
  );

  useEffect(() => {
    if (isLoading || didPrepareSession.current) {
      return;
    }

    didPrepareSession.current = true;
    setSessionItems(prepareSession());
  }, [isLoading, prepareSession]);

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

  const isRecording = recordingStatus !== "idle";

  const item = sessionItems[itemIndex];
  const concept = concepts.find(
    (candidate) => candidate.slug === item?.conceptSlug,
  );

  function notePlayback() {
    listeningStartedAt.current ??= performance.now();
    setPlaybackCount((current) => current + 1);
  }

  async function chooseMeaning(option: string, eventTimestamp: number) {
    if (!item || !concept || playbackCount === 0 || isSaving) {
      return;
    }

    const successful = option === item.meaning;
    const latencyMs = Math.max(
      0,
      Math.round(eventTimestamp - (listeningStartedAt.current ?? eventTimestamp)),
    );
    setSelectedMeaning(option);
    setIsSaving(true);
    setActionError(null);

    try {
      await recordListeningAttempt({
        conceptId: concept.id,
        successful,
        score: successful ? 1 : 0,
        latencyMs,
        speakerId: item.voice,
        playbackCount,
        context: {
          itemId: item.id,
          selectedMeaning: option,
          source: "listen-speak",
        },
      });
      setPhase("repeat");
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : "This listening attempt could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function startSpeaking() {
    if (!item || !concept || recordingStatus !== "idle") {
      return;
    }

    const runId = recognitionRunId.current + 1;
    recognitionRunId.current = runId;
    setActionError(null);
    setSpeakingResult(null);
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
        item.text,
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        false,
      );
      assessmentConfig.phonemeAlphabet = "IPA";
      assessmentConfig.applyTo(recognizer);

      const scored = await new Promise<SpeakingResult>((resolve, reject) => {
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
                    ? "I heard you, but couldn’t finish the transcript. Please try once more."
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
            const assessmentWords = assessment.detailResult?.Words ?? [];
            const wordDetails = assessmentWords.map((word) => ({
              word: word.Word,
              accuracyScore: toUnitScore(
                word.PronunciationAssessment?.AccuracyScore ?? 0,
              ),
              errorType:
                word.PronunciationAssessment?.ErrorType ?? "Unknown",
            }));
            const result: SpeakingResult = {
              recognizedText: event.result.text.trim(),
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
                    ? "I heard you, but couldn’t produce a final transcript. Please try again."
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

      if (recognitionRunId.current !== runId) {
        return;
      }

      setSpeakingResult(scored);
      setPhase("result");
      void recordSpeakingAttempt({
        conceptId: concept.id,
        referenceText: item.text,
        ...scored,
        context: {
          itemId: item.id,
          provider: "azure-speech",
          locale: "da-DK",
          audioRetained: false,
          source: "listen-speak",
        },
      }).catch((saveError: unknown) => {
        if (recognitionRunId.current === runId) {
          setActionError(
            saveError instanceof Error
              ? saveError.message
              : "Your score could not be saved.",
          );
        }
      });
    } catch (speechError) {
      if (recognitionRunId.current === runId) {
        setActionError(
          speechError instanceof Error
            ? speechError.message
            : "Speaking practice is temporarily unavailable.",
        );
      }
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
  }

  function stopSpeaking() {
    stopActiveRecognition.current?.();
  }

  function retrySpeaking() {
    setSpeakingResult(null);
    setLiveTranscript("");
    setActionError(null);
    setPhase("repeat");
  }

  function moveForward() {
    if (itemIndex === sessionItems.length - 1) {
      setPhase("complete");
      return;
    }

    setItemIndex((current) => current + 1);
    setPhase("listen");
    setSelectedMeaning(null);
    setPlaybackCount(0);
    setSpeakingResult(null);
    setLiveTranscript("");
    setActionError(null);
    listeningStartedAt.current = null;
  }

  function restart() {
    setSessionItems(prepareSession());
    setItemIndex(0);
    setPhase("listen");
    setSelectedMeaning(null);
    setPlaybackCount(0);
    setSpeakingResult(null);
    setLiveTranscript("");
    setActionError(null);
    listeningStartedAt.current = null;
  }

  if (isLoading || sessionItems.length === 0) {
    return (
      <div className="paper-panel grid min-h-[500px] animate-pulse place-items-center rounded-[30px] text-sm text-forest-900/50">
        Tuning your listening practice…
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="paper-panel soft-enter rounded-[30px] p-7 sm:p-10">
        <div className="grid size-14 place-items-center rounded-2xl bg-moss-400/20 text-forest-800">
          <Sparkles aria-hidden="true" size={25} />
        </div>
        <h2 className="mt-8 max-w-2xl font-display text-4xl leading-[1.06] text-forest-950 sm:text-5xl">
          Round complete.
        </h2>
        <button
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-800"
          onClick={restart}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={17} />
          Practice again
        </button>
      </div>
    );
  }

  if (!item || !concept) {
    return (
      <div className="paper-panel rounded-[30px] p-8">
        <CircleAlert className="text-clay-400" size={24} />
        <h2 className="mt-4 font-display text-3xl">Speaking practice is updating.</h2>
        <p className="mt-2 text-sm text-forest-900/60">
          Apply Sapling’s latest concept migration to unlock this practice set.
        </p>
      </div>
    );
  }

  const progress =
    ((itemIndex + (phase === "listen" ? 0 : 0.6)) / sessionItems.length) * 100;
  const meaningWasCorrect = selectedMeaning === item.meaning;

  return (
    <div className="paper-panel soft-enter overflow-hidden rounded-[30px]">
      <div className="border-b border-forest-900/8 px-6 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.16em] text-forest-700/55">
          <span>{phase === "listen" ? "Listen" : "Speak"}</span>
          <span>
            {itemIndex + 1} of {sessionItems.length}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest-900/8">
          <div
            className="h-full rounded-full bg-moss-500 transition-[width] duration-500"
            style={{ width: `${Math.max(4, progress)}%` }}
          />
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        {phase === "listen" ? (
          <div>
            <div className="grid size-14 place-items-center rounded-2xl bg-moss-400/18 text-forest-800">
              <Volume2 aria-hidden="true" size={25} />
            </div>
            <h2 className="mt-7 max-w-2xl font-display text-4xl leading-tight text-forest-950">
              What does it mean?
            </h2>
            <div className="mt-6">
              <DanishAudioButton
                clipId={item.audioId}
                label="Play sentence"
                onPlay={notePlayback}
              />
            </div>
            <div className="mt-8 grid gap-3">
              {item.options.map((option) => (
                <button
                  className="rounded-[20px] border border-forest-900/10 bg-white/60 px-5 py-4 text-left text-sm font-semibold text-forest-950 transition enabled:hover:border-moss-500/40 enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={playbackCount === 0 || isSaving}
                  key={option}
                  onClick={(event) => chooseMeaning(option, event.timeStamp)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {phase === "repeat" ? (
          <div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                meaningWasCorrect
                  ? "bg-moss-400/18 text-forest-800"
                  : "bg-amber-400/16 text-amber-500"
              }`}
            >
              {meaningWasCorrect ? (
                <Check aria-hidden="true" size={15} />
              ) : (
                <RotateCcw aria-hidden="true" size={15} />
              )}
              {meaningWasCorrect ? "You heard it" : "Here’s the meaning"}
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-forest-700/55">
              {item.meaning}
            </p>
            <h2 className="mt-2 font-display text-4xl leading-tight text-forest-950 sm:text-5xl">
              {item.text}
            </h2>
            <div className="mt-6">
              <DanishAudioButton
                clipId={item.audioId}
                label="Hear it again"
                onPlay={notePlayback}
                showSlowControl
              />
            </div>
            <div className="mt-7 rounded-[22px] border border-forest-900/10 bg-white/55 p-5">
              <div className="flex items-center gap-3 text-sm font-semibold text-forest-900/62">
                <ShieldCheck className="shrink-0 text-moss-500" size={19} />
                <p>Audio is scored, then discarded.</p>
              </div>
              <button
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition enabled:hover:bg-forest-800 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
                disabled={
                  recordingStatus === "starting" ||
                  recordingStatus === "stopping"
                }
                onClick={
                  recordingStatus === "listening"
                    ? stopSpeaking
                    : startSpeaking
                }
                type="button"
              >
                {recordingStatus === "starting" ||
                recordingStatus === "stopping" ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />
                ) : recordingStatus === "listening" ? (
                  <Square aria-hidden="true" fill="currentColor" size={16} />
                ) : (
                  <Mic aria-hidden="true" size={18} />
                )}
                {recordingStatus === "starting"
                  ? "Preparing microphone…"
                  : recordingStatus === "listening"
                    ? "Stop & score"
                    : recordingStatus === "stopping"
                      ? "Finishing transcript…"
                      : "Start speaking"}
              </button>
              {isRecording ? (
                <div
                  aria-live="polite"
                  className="mt-4 rounded-2xl border border-moss-500/20 bg-moss-400/10 p-4"
                  role="status"
                >
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-forest-700/55">
                    <span className="size-2 animate-pulse rounded-full bg-clay-400" />
                    {recordingStatus === "starting"
                      ? "Opening your microphone"
                      : recordingStatus === "stopping"
                        ? "Finishing your score"
                        : liveTranscript
                          ? "Sapling is hearing"
                          : "Listening for Danish"}
                  </p>
                  <p
                    className="mt-2 min-h-7 text-lg font-semibold text-forest-950"
                    lang="da"
                  >
                    {liveTranscript || "Sig sætningen…"}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {phase === "result" && speakingResult ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-forest-700/55">
              {speakingResult.successful ? (
                <Check aria-hidden="true" size={16} />
              ) : (
                <Sparkles aria-hidden="true" size={16} />
              )}
              {speakingResult.successful ? "Clear and complete" : "Good evidence collected"}
            </div>
            <h2 className="mt-3 font-display text-4xl leading-tight text-forest-950">
              {item.text}
            </h2>
            <p className="mt-4 text-sm text-forest-900/55">
              Azure heard: <span className="font-semibold text-forest-950">{speakingResult.recognizedText || "—"}</span>
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Pronunciation", speakingResult.pronunciationScore],
                ["Accuracy", speakingResult.accuracyScore],
                ["Complete", speakingResult.completenessScore],
                ["Fluency", speakingResult.fluencyScore],
              ].map(([label, score]) => (
                <div className="rounded-2xl bg-white/60 p-4" key={label as string}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-forest-700/48">
                    {label as string}
                  </p>
                  <p className="mt-1 font-display text-3xl text-forest-950">
                    {Math.round((score as number) * 100)}
                  </p>
                </div>
              ))}
            </div>

            {speakingResult.wordDetails.length > 0 ? (
              <div className="mt-6 rounded-[22px] bg-forest-900/[0.045] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/52">
                  Word feedback
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {speakingResult.wordDetails.map((word, index) => (
                    <span
                      className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                        word.accuracyScore >= 0.7 && word.errorType === "None"
                          ? "bg-moss-400/15 text-forest-900"
                          : "bg-amber-400/16 text-amber-500"
                      }`}
                      key={`${word.word}-${index}`}
                      title={`${Math.round(word.accuracyScore * 100)} · ${word.errorType}`}
                    >
                      {word.word} {Math.round(word.accuracyScore * 100)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-7 grid gap-3 sm:flex">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-forest-900/12 bg-white/70 px-5 py-3.5 text-sm font-bold text-forest-900 transition hover:bg-white"
                onClick={retrySpeaking}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={17} />
                Try speaking again
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-forest-800"
                onClick={moveForward}
                type="button"
              >
                Continue
                <ArrowRight aria-hidden="true" size={17} />
              </button>
            </div>
          </div>
        ) : null}

        {actionError || modelError ? (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-clay-400/10 p-3 text-sm text-forest-900">
            <CircleAlert className="mt-0.5 shrink-0 text-clay-400" size={16} />
            {actionError ?? modelError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
