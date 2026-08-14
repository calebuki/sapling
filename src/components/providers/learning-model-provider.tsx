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
  LearnerConceptState,
  ListeningAttemptInput,
  RepairInput,
  RetrievalAttemptInput,
  SpeakingAttemptInput,
} from "@/types/learning";
import type {
  CompletePracticeSessionInput,
  PracticeSnapshot,
  RecordPracticeTurnInput,
  StartPracticeSessionInput,
} from "@/types/practice";

const emptyPracticeSnapshot: PracticeSnapshot = {
  memories: [],
  continuity: [],
  recentScenarioIds: [],
};

type LearningModelContextValue = {
  concepts: Concept[];
  states: LearnerConceptState[];
  practiceSnapshot: PracticeSnapshot;
  targetLanguage: TargetLanguage;
  mode: "local" | "supabase";
  isLoading: boolean;
  isSwitchingLanguage: boolean;
  error: string | null;
  selectTargetLanguage: (languageCode: TargetLanguageCode) => Promise<void>;
  recordRetrievalAttempt: (
    input: RetrievalAttemptInput,
  ) => Promise<LearnerConceptState>;
  recordRepair: (input: RepairInput) => Promise<LearnerConceptState>;
  recordListeningAttempt: (
    input: ListeningAttemptInput,
  ) => Promise<LearnerConceptState>;
  recordSpeakingAttempt: (
    input: SpeakingAttemptInput,
  ) => Promise<LearnerConceptState>;
  startPracticeSession: (input: StartPracticeSessionInput) => Promise<string>;
  recordPracticeTurn: (input: RecordPracticeTurnInput) => Promise<void>;
  completePracticeSession: (
    input: CompletePracticeSessionInput,
  ) => Promise<void>;
  deleteLearnerMemory: (memoryId: string) => Promise<void>;
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
  const [practiceSnapshot, setPracticeSnapshot] = useState<PracticeSnapshot>(
    emptyPracticeSnapshot,
  );
  const [targetLanguageCode, setTargetLanguageCode] =
    useState<TargetLanguageCode>("da");
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    repository
      .getTargetLanguage()
      .then(async (languageCode) => {
        const [snapshot, loadedPracticeSnapshot] = await Promise.all([
          repository.loadSnapshot(languageCode),
          repository.loadPracticeSnapshot(languageCode),
        ]);
        return { languageCode, snapshot, loadedPracticeSnapshot };
      })
      .then(({ languageCode, snapshot, loadedPracticeSnapshot }) => {
        if (cancelled) {
          return;
        }
        setTargetLanguageCode(languageCode);
        setConcepts(snapshot.concepts);
        setStates(snapshot.states);
        setPracticeSnapshot(loadedPracticeSnapshot);
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
        const [snapshot, loadedPracticeSnapshot] = await Promise.all([
          repository.loadSnapshot(languageCode),
          repository.loadPracticeSnapshot(languageCode),
        ]);
        setTargetLanguageCode(languageCode);
        setConcepts(snapshot.concepts);
        setStates(snapshot.states);
        setPracticeSnapshot(loadedPracticeSnapshot);
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

  const startPracticeSession = useCallback(
    async (input: StartPracticeSessionInput) => {
      setError(null);
      try {
        return await repository.startPracticeSession(input);
      } catch (recordError) {
        const message =
          recordError instanceof Error
            ? recordError.message
            : "Sapling could not start this conversation.";
        setError(message);
        throw recordError;
      }
    },
    [repository],
  );

  const recordPracticeTurn = useCallback(
    async (input: RecordPracticeTurnInput) => {
      setError(null);
      try {
        const updatedStates = await repository.recordPracticeTurn(input);
        for (const updated of updatedStates) {
          upsertState(updated);
        }
        setPracticeSnapshot(
          await repository.loadPracticeSnapshot(input.languageCode),
        );
      } catch (recordError) {
        const message =
          recordError instanceof Error
            ? recordError.message
            : "Sapling could not save this conversation turn.";
        setError(message);
        throw recordError;
      }
    },
    [repository, upsertState],
  );

  const completePracticeSession = useCallback(
    async (input: CompletePracticeSessionInput) => {
      setError(null);
      try {
        setPracticeSnapshot(await repository.completePracticeSession(input));
      } catch (recordError) {
        const message =
          recordError instanceof Error
            ? recordError.message
            : "Sapling could not finish this conversation.";
        setError(message);
        throw recordError;
      }
    },
    [repository],
  );

  const deleteLearnerMemory = useCallback(
    async (memoryId: string) => {
      setError(null);
      try {
        setPracticeSnapshot(
          await repository.deleteLearnerMemory(targetLanguageCode, memoryId),
        );
      } catch (recordError) {
        const message =
          recordError instanceof Error
            ? recordError.message
            : "Sapling could not forget that detail.";
        setError(message);
        throw recordError;
      }
    },
    [repository, targetLanguageCode],
  );

  return (
    <LearningModelContext.Provider
      value={{
        concepts,
        states,
        practiceSnapshot,
        targetLanguage: getTargetLanguage(targetLanguageCode),
        mode: repository.mode,
        isLoading,
        isSwitchingLanguage,
        error,
        selectTargetLanguage,
        recordRetrievalAttempt,
        recordRepair,
        recordListeningAttempt,
        recordSpeakingAttempt,
        startPracticeSession,
        recordPracticeTurn,
        completePracticeSession,
        deleteLearnerMemory,
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
