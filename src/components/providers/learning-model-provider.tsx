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
import type {
  Concept,
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
  mode: "local" | "supabase";
  isLoading: boolean;
  error: string | null;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    repository
      .loadSnapshot()
      .then((snapshot) => {
        if (cancelled) {
          return;
        }
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
        mode: repository.mode,
        isLoading,
        error,
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
