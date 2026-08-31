"use client";

import {
  ArrowRight,
  Check,
  Coffee,
  LockKeyhole,
  TrainFront,
  Utensils,
} from "lucide-react";

import { useLearningModel } from "@/components/providers/learning-model-provider";
import type { TargetLanguageCode } from "@/lib/learning/languages";

const worlds = {
  da: {
    guide: "Emil",
    description:
      "Patient, dryly funny, and always suggesting a different bakery. Emil remembers what happened yesterday—even when you need the same Danish again today.",
    moments: [
      { icon: Coffee, label: "Mød Emil", detail: "A first coffee in Nørrebro" },
      { icon: TrainFront, label: "På vej", detail: "A plan changes at the station" },
      { icon: Utensils, label: "I køkkenet", detail: "Dinner and a small misunderstanding" },
    ],
  },
  sv: {
    guide: "Elin",
    description:
      "Warm, quick-witted, and always aware of the best fika nearby. Elin remembers your last conversation—even when you need the same Swedish again today.",
    moments: [
      { icon: Coffee, label: "Möt Elin", detail: "A first fika in Södermalm" },
      { icon: TrainFront, label: "På väg", detail: "A plan changes at Centralstationen" },
      { icon: Utensils, label: "I köket", detail: "Dinner and a small misunderstanding" },
    ],
  },
} satisfies Record<TargetLanguageCode, object>;

export function WorldView() {
  const { targetLanguage } = useLearningModel();
  const world = worlds[targetLanguage.code];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
      <div className="mb-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/65">
          {targetLanguage.name} world
        </p>
        <h1 className="max-w-3xl font-display text-4xl leading-[1.03] text-forest-950 sm:text-5xl">
          Language, somewhere to return to.
        </h1>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[.88fr_1.12fr]">
        <section>
          <div className="relative overflow-hidden rounded-[24px] bg-forest-950 p-6 text-cream-50 shadow-2xl shadow-forest-950/14 sm:p-8">
            <div className="absolute -right-12 -top-16 size-56 rounded-full border border-cream-100/8" />
            <div className="absolute -right-2 -top-8 size-36 rounded-full border border-cream-100/8" />
            <div className="flex items-start justify-between gap-5">
              <div className="grid size-13 place-items-center rounded-[16px] bg-cream-100/10 text-xl font-extrabold">
                {world.guide[0]}
              </div>
              <span className="rounded-full bg-cream-100/10 px-3 py-1 text-[10px] font-bold tracking-[0.08em] text-cream-100/72">
                Your guide
              </span>
            </div>
            <h2 className="mt-9 text-3xl font-extrabold tracking-[-0.04em]">
              Meet {world.guide}
            </h2>
            <p className="mt-3 max-w-md text-sm font-medium leading-6 text-cream-100/68">
              {world.description}
            </p>
          </div>
        </section>

        <section className="paper-panel rounded-[24px] p-4 sm:p-5">
          <div className="space-y-3">
            {world.moments.map(({ icon: Icon, label, detail }, index) => {
              const current = index === 0;
              return (
                <div
                  className={`relative flex items-center gap-4 rounded-[18px] border p-4 sm:p-5 ${
                    current
                      ? "border-moss-500/24 bg-moss-300/18"
                      : "border-forest-950/7 bg-white/50"
                  }`}
                  key={label}
                >
                  <span
                    className={`z-10 grid size-10 shrink-0 place-items-center rounded-[13px] ${
                      current
                        ? "bg-forest-950 text-cream-50"
                        : "bg-forest-950/6 text-forest-800/48"
                    }`}
                  >
                    <Icon aria-hidden="true" size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold tracking-[0.1em] text-forest-700/56">
                        Encounter {index + 1}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-700/58">
                        {current ? (
                          <Check aria-hidden="true" size={12} />
                        ) : (
                          <LockKeyhole aria-hidden="true" size={12} />
                        )}
                        {current ? "Current" : "Locked"}
                      </span>
                    </div>
                    <h3 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-forest-950">
                      {label}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-forest-900/56">
                      {detail}
                    </p>
                  </div>
                  {current ? (
                    <ArrowRight
                      aria-hidden="true"
                      className="shrink-0 text-forest-800"
                      size={18}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
