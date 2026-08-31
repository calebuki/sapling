function speechWords(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

type WordScore = { accuracyScore: number };

export function calculateBeginnerPronunciationScore({
  accuracyScore,
  wordDetails,
}: {
  accuracyScore: number;
  wordDetails: WordScore[];
}) {
  const wordScores = wordDetails
    .map((word) => clamp(word.accuracyScore))
    .filter(Number.isFinite)
    .toSorted((left, right) => left - right);

  if (wordScores.length === 0) {
    return Math.sqrt(clamp(accuracyScore));
  }

  const average =
    wordScores.reduce((total, score) => total + score, 0) / wordScores.length;
  const middle = Math.floor(wordScores.length / 2);
  const median =
    wordScores.length % 2 === 0
      ? (wordScores[middle - 1] + wordScores[middle]) / 2
      : wordScores[middle];

  return Math.sqrt(clamp(average * 0.75 + median * 0.25));
}

export function pronunciationBand(score: number) {
  if (score >= 0.8) {
    return "Good";
  }
  if (score >= 0.65) {
    return "Almost there";
  }
  return "Keep practicing";
}

export function pronunciationAttemptQuality(result: {
  pronunciationScore: number;
  completenessScore: number;
  accuracyScore: number;
}) {
  return (
    clamp(result.completenessScore) * 0.5 +
    clamp(result.pronunciationScore) * 0.35 +
    clamp(result.accuracyScore) * 0.15
  );
}

export function calculatePhraseCoverage(
  referenceText: string,
  recognizedText: string,
) {
  const reference = speechWords(referenceText);
  const recognized = speechWords(recognizedText);

  if (reference.length === 0 || recognized.length === 0) {
    return 0;
  }

  const previous = new Array<number>(recognized.length + 1).fill(0);

  for (const referenceWord of reference) {
    const current = new Array<number>(recognized.length + 1).fill(0);
    for (let index = 1; index <= recognized.length; index += 1) {
      current[index] =
        referenceWord === recognized[index - 1]
          ? previous[index - 1] + 1
          : Math.max(previous[index], current[index - 1]);
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[recognized.length] / reference.length;
}
