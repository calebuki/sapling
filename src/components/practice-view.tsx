"use client";

import { AudioLines, BookOpenText, ChartNoAxesColumnIncreasing } from "lucide-react";
import { useState } from "react";

import { ListenSpeakSession } from "@/components/listen-speak-session";
import { ProgressView } from "@/components/progress-view";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { ReadWriteSession } from "@/components/read-write-session";

type PracticeMode = "review" | "listening" | "text";

export function PracticeView({ initialMode = "review" }: { initialMode?: PracticeMode }) {
  const { targetLanguage } = useLearningModel();
  const [mode, setMode] = useState<PracticeMode>(initialMode);
  const activeMode = mode === "text" && targetLanguage.code !== "da"
    ? "listening"
    : mode;
  const modes = [
    { id: "review" as const, label: "Progress", Icon: ChartNoAxesColumnIncreasing },
    { id: "listening" as const, label: "Listen & speak", Icon: AudioLines },
    ...(targetLanguage.code === "da"
      ? [{ id: "text" as const, label: "Read & write", Icon: BookOpenText }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="scrollbar-hidden flex gap-2 overflow-x-auto" role="tablist" aria-label="Practice mode">
        {modes.map(({ id, label, Icon }) => (
          <button
            aria-selected={activeMode === id}
            className={`inline-flex shrink-0 items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-bold transition ${
              activeMode === id
                ? "bg-forest-950 text-cream-50"
                : "border border-forest-900/10 bg-white/58 text-forest-900"
            }`}
            key={id}
            onClick={() => setMode(id)}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" size={17} />
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeMode === "review" ? <ProgressView /> : null}
        {activeMode === "listening" ? <ListenSpeakSession /> : null}
        {activeMode === "text" ? <ReadWriteSession /> : null}
      </div>
    </div>
  );
}
