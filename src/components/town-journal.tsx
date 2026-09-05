"use client";

import {
  ArrowRight,
  Check,
  Coffee,
  Flower2,
  Leaf,
  MessageCircle,
  Sprout,
  TrainFront,
  Trees,
} from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { growthLabel, townQuests } from "@/lib/worlds/quests";

const potKey = "sapling.garden-pot.v1";
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("sapling-pot", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("sapling-pot", onChange);
  };
}
function readPot() {
  try {
    return window.localStorage.getItem(potKey) ?? "clay";
  } catch {
    return "clay";
  }
}
const icons = {
  hello: MessageCircle,
  coffee: Coffee,
  train: TrainFront,
  park: Trees,
};

export function SaplingGarden({
  stamps,
  compact = false,
}: {
  stamps: number;
  compact?: boolean;
}) {
  const pot = useSyncExternalStore(subscribe, readPot, () => "clay");
  function choosePot(color: string) {
    try {
      window.localStorage.setItem(potKey, color);
      window.dispatchEvent(new Event("sapling-pot"));
    } catch {
      /* Cosmetic preferences are optional. */
    }
  }
  const Plant = stamps >= 4 ? Trees : stamps >= 2 ? Flower2 : Sprout;
  return (
    <section
      className={`life-garden ${compact ? "is-compact" : ""}`}
      aria-label="Your sapling"
    >
      <div
        className={`life-plant pot-${["clay", "moss", "cream"].includes(pot) ? pot : "clay"} growth-${Math.min(4, stamps)}`}
        aria-hidden="true"
      >
        <span className="life-plant-halo" />
        <Plant className="life-plant-leaves" strokeWidth={1.25} />
        <span className="life-plant-pot" />
        <span className="life-plant-shadow" />
      </div>
      <div className="life-garden-copy">
        <p className="life-eyebrow">Your sapling</p>
        <h3>{growthLabel(stamps)}</h3>
        {compact ? (
          <Link className="life-text-link" href="/progress">
            Visit your journal
            <ArrowRight size={14} />
          </Link>
        ) : (
          <>
            <p>Every new journal stamp brings a little more growth.</p>
            <div className="life-pot-options" aria-label="Choose a pot color">
              {["clay", "moss", "cream"].map((color) => (
                <button
                  type="button"
                  key={color}
                  className={`pot-${color}`}
                  aria-label={`${color} pot`}
                  aria-pressed={pot === color}
                  onClick={() => choosePot(color)}
                >
                  {pot === color ? <Check size={15} /> : null}
                </button>
              ))}
            </div>
            <small>Pot color is saved on this device.</small>
          </>
        )}
      </div>
    </section>
  );
}

export function TownJournal() {
  const { practiceSnapshot, isLoading } = useLearningModel();
  const completed = new Set(practiceSnapshot.completedScenarioIds);
  const stamps = townQuests.filter((quest) => completed.has(quest.id)).length;
  if (isLoading) return <p className="life-loading">Opening your journal…</p>;
  return (
    <section className="life-journal" aria-label="Lindbacken journal">
      <div className="life-page-heading">
        <div>
          <p className="life-eyebrow">Your Lindbacken journal</p>
          <h1>
            Little moments.
            <br />
            Lasting memories.
          </h1>
        </div>
        <Link className="life-button life-button-outline" href="/practice">
          Back to town
          <ArrowRight size={17} />
        </Link>
      </div>
      <SaplingGarden stamps={stamps} />
      <div className="life-section-heading">
        <h2>Made in Swedish.</h2>
        <span>{stamps} / 4 collected</span>
      </div>
      <div className="life-stamp-grid">
        {townQuests.map((quest) => {
          const Icon = icons[quest.icon];
          const earned = completed.has(quest.id);
          return (
            <Link
              className={`life-stamp-card ${earned ? "is-earned" : ""}`}
              key={quest.id}
              href={`/practice?scene=${quest.id}`}
            >
              <div className="life-stamp">
                <Icon size={34} strokeWidth={1.4} />
                <span>Lindbacken</span>
                {earned ? <Check size={14} /> : <Leaf size={14} />}
              </div>
              <h3>{quest.stamp}</h3>
              <p>{earned ? "Collected · Visit again" : quest.description}</p>
              <span className="life-text-link">
                {earned ? "Make another memory" : "Start this adventure"}
                <ArrowRight size={15} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
