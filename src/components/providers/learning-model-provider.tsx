"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createLearningRepository } from "@/lib/repositories";
import {
  getTargetLanguage,
  type TargetLanguage,
  type TargetLanguageCode,
} from "@/lib/learning/languages";
import type {
  Concept,
  LearningSessionPlan,
  LearningSessionPlanInput,
  LearnerConceptState,
  ListeningAttemptInput,
  ReadingAttemptInput,
  RepairInput,
  RetrievalAttemptInput,
  SpeakingAttemptInput,
} from "@/types/learning";

type LearningModelContextValue = {
  concepts: Concept[];
  states: LearnerConceptState[];
  targetLanguage: TargetLanguage;
  mode: "local" | "supabase";
  isLoading: boolean;
  isSwitchingLanguage: boolean;
  error: string | null;
  selectTargetLanguage: (languageCode: TargetLanguageCode) => Promise<void>;
  startSession: (input: LearningSessionPlanInput) => Promise<LearningSessionPlan>;
  completeSession: (sessionId: string | null) => Promise<void>;
  recordRetrievalAttempt: (
    input: RetrievalAttemptInput,
  ) => Promise<LearnerConceptState>;
  recordRepair: (input: RepairInput) => Promise<LearnerConceptState>;
  recordListeningAttempt: (
    input: ListeningAttemptInput,
  ) => Promise<LearnerConceptState>;
  recordReadingAttempt: (
    input: ReadingAttemptInput,
  ) => Promise<LearnerConceptState>;
  recordSpeakingAttempt: (
    input: SpeakingAttemptInput,
  ) => Promise<LearnerConceptState>;
};

const LearningModelContext = createContext<LearningModelContextValue | null>(
  null,
);

export function LearningModelProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const repository = useMemo(() => createLearningRepository(), []);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [states, setStates] = useState<LearnerConceptState[]>([]);
  const [targetLanguageCode, setTargetLanguageCode] =
    useState<TargetLanguageCode>("da");
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    repository
      .getTargetLanguage()
      .then(async (languageCode) => ({
        languageCode,
        snapshot: await repository.loadSnapshot(languageCode),
      }))
      .then(({ languageCode, snapshot }) => {
        if (cancelled) {
          return;
        }
        setTargetLanguageCode(languageCode);
        setConcepts(snapshot.concepts);
        setStates(snapshot.states);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Sapling could not load the learning model.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repository]);

  const selectTargetLanguage = useCallback(
    async (languageCode: TargetLanguageCode) => {
      if (languageCode === targetLanguageCode || isSwitchingLanguage) {
        return;
      }

      setError(null);
      setIsSwitchingLanguage(true);
      try {
        await repository.setTargetLanguage(languageCode);
        const snapshot = await repository.loadSnapshot(languageCode);
        setTargetLanguageCode(languageCode);
        setConcepts(snapshot.concepts);
        setStates(snapshot.states);
      } catch (languageError) {
        const message =
          languageError instanceof Error
            ? languageError.message
            : "Sapling could not switch languages.";
        setError(message);
        throw languageError;
      } finally {
        setIsSwitchingLanguage(false);
      }
    },
    [isSwitchingLanguage, repository, targetLanguageCode],
  );

  const upsertState = useCallback((updated: LearnerConceptState) => {
    setStates((current) => {
      const exists = current.some(
        (state) => state.conceptId === updated.conceptId,
      );
      return exists
        ? current.map((state) =>
            state.conceptId === updated.conceptId ? updated : state,
          )
        : [...current, updated];
    });
    return updated;
  }, []);

  const recordRetrievalAttempt = useCallback(
    async (input: RetrievalAttemptInput) => {
      setError(null);
      try {
        return upsertState(await repository.recordRetrievalAttempt(input));
      } catch (recordError) {
        const message =
          recordError instanceof Error
            ? recordError.message
            : "Sapling could not save this attempt.";
        setError(message);
        throw recordError;
      }
    },
    [repository, upsertState],
  );

  const startSession = useCallback(
    async (input: LearningSessionPlanInput) => {
      setError(null);
      try {
        return await repository.startSession(input);
      } catch (sessionError) {
        const message =
          sessionError instanceof Error
            ? sessionError.message
            : "Sapling could not start this session.";
        setError(message);
        throw sessionError;
      }
    },
    [repository],
  );

  const completeSession = useCallback(
    async (sessionId: string | null) => {
      setError(null);
      try {
        await repository.completeSession(sessionId);
      } catch (sessionError) {
        const message =
          sessionError instanceof Error
            ? sessionError.message
            : "Sapling could not finish this session.";
        setError(message);
        throw sessionError;
      }
    },
    [repository],
  );

  const recordRepair = useCallback(
    async (input: RepairInput) => {
      setError(null);
      try {
        return upsertState(await repository.recordRepair(input));
      } catch (recordError) {
        const message =
          recordError instanceof Error
            ? recordError.message
            : "Sapling could not save this repair.";
        setError(message);
        throw recordError;
      }
    },
    [repository, upsertState],
  );

  const recordListeningAttempt = useCallback(
    async (input: ListeningAttemptInput) => {
      setError(null);
      try {
        return upsertState(await repository.recordListeningAttempt(input));
      } catch (recordError) {
        const message =
          recordError instanceof Error
            ? recordError.message
            : "Sapling could not save this listening attempt.";
        setError(message);
        throw recordError;
      }
    },
    [repository, upsertState],
  );

  const recordReadingAttempt = useCallback(
    async (input: ReadingAttemptInput) => {
      setError(null);
      try {
        return upsertState(await repository.recordReadingAttempt(input));
      } catch (recordError) {
        const message =
          recordError instanceof Error
            ? recordError.message
            : "Sapling could not save this reading attempt.";
        setError(message);
        throw recordError;
      }
    },
    [repository, upsertState],
  );

  const recordSpeakingAttempt = useCallback(
    async (input: SpeakingAttemptInput) => {
      setError(null);
      try {
        return upsertState(await repository.recordSpeakingAttempt(input));
      } catch (recordError) {
        const message =
          recordError instanceof Error
            ? recordError.message
            : "Sapling could not save this speaking attempt.";
        setError(message);
        throw recordError;
      }
    },
    [repository, upsertState],
  );

  return (
    <LearningModelContext.Provider
      value={{
        concepts,
        states,
        targetLanguage: getTargetLanguage(targetLanguageCode),
        mode: repository.mode,
        isLoading,
        isSwitchingLanguage,
        error,
        selectTargetLanguage,
        startSession,
        completeSession,
        recordRetrievalAttempt,
        recordRepair,
        recordListeningAttempt,
        recordReadingAttempt,
        recordSpeakingAttempt,
      }}
    >
      {children}
    </LearningModelContext.Provider>
  );
}

export function useLearningModel() {
  const value = useContext(LearningModelContext);
  if (!value) {
    throw new Error("useLearningModel must be used inside LearningModelProvider.");
  }
  return value;
}
