"use client";

import { useLearningModel } from "@/components/providers/learning-model-provider";
import { ProgressView } from "@/components/progress-view";

export function ProgressPageContent() {
  const { targetLanguage } = useLearningModel();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
      <div className="mb-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/65">
          My {targetLanguage.name}
        </p>
        <h1 className="font-display max-w-3xl text-4xl leading-[1.03] text-forest-950 sm:text-5xl">
          Your {targetLanguage.name} is taking shape.
        </h1>
      </div>
      <ProgressView />
    </div>
  );
}
