"use client";

import { PracticeSession } from "@/components/practice-session";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { SwedishPracticeWorld } from "@/components/swedish-practice-world";

export function PracticeHome() {
  const { isLoading, targetLanguage } = useLearningModel();

  if (isLoading) {
    return <div className="min-h-[70dvh] animate-pulse bg-moss-300/10" />;
  }

  if (targetLanguage.code === "sv") {
    return <SwedishPracticeWorld />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
      <div className="mb-5 sm:mb-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/65">
          Practice
        </p>
        <h1 className="font-display text-4xl leading-[1.03] text-forest-950 sm:text-5xl">
          Use what you know.
        </h1>
      </div>
      <PracticeSession />
    </div>
  );
}
