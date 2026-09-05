"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  Coffee,
  GraduationCap,
  MapPin,
  MessageCircle,
  Sparkles,
  TrainFront,
  Trees,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import townImage from "@/assets/home/lindbacken-storybook.png";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { SaplingGarden } from "@/components/town-journal";
import { choosePracticeScenario } from "@/lib/practice/planner";
import { townQuests } from "@/lib/worlds/quests";

const places = [
  {
    name: "Språkskolan",
    label: "Learn a little",
    href: "/learn",
    icon: GraduationCap,
    x: 28.5,
    y: 63,
  },
  {
    name: "Kafé Linden",
    label: "Time for fika",
    href: "/practice?scene=fika-order",
    icon: Coffee,
    x: 72,
    y: 76,
  },
  {
    name: "Centralstationen",
    label: "Go somewhere",
    href: "/practice?scene=centralstation-change",
    icon: TrainFront,
    x: 35.5,
    y: 79,
  },
  {
    name: "Stadsparken",
    label: "Make a plan",
    href: "/practice?scene=make-weekend-plans",
    icon: Trees,
    x: 51,
    y: 78.5,
  },
];
export const questIcons = {
  hello: MessageCircle,
  coffee: Coffee,
  train: TrainFront,
  park: Trees,
};

export function TownHome() {
  const { concepts, states, practiceSnapshot, targetLanguage, isLoading } =
    useLearningModel();
  const recommendation = useMemo(
    () =>
      choosePracticeScenario({
        languageCode: targetLanguage.code,
        concepts,
        states,
        snapshot: practiceSnapshot,
      }),
    [concepts, states, practiceSnapshot, targetLanguage.code],
  );
  const suggested =
    townQuests.find((quest) => quest.id === recommendation.scenario.id) ??
    townQuests[0];
  const completed = new Set(practiceSnapshot.completedScenarioIds);
  const stampCount = townQuests.filter((quest) =>
    completed.has(quest.id),
  ).length;
  const isReturning = practiceSnapshot.continuity.some(
    (character) => character.encounterCount > 0,
  );
  const SuggestedIcon = questIcons[suggested.icon];

  if (isLoading)
    return (
      <div className="life-loading" role="status">
        Opening your town…
      </div>
    );
  return (
    <div className="life-page life-town-page">
      <div className="life-page-heading">
        <div>
          <p className="life-eyebrow">Your Swedish world</p>
          <h1>
            {isReturning ? "Good to have you back." : "Make yourself at home."}
          </h1>
        </div>
        <Link className="life-text-link" href="/progress">
          <BookOpen size={17} />
          {stampCount} / 4 stamps
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="life-town-layout">
        <section className="life-town-map" aria-label="Explore Lindbacken">
          <Image
            src={townImage}
            alt="The wooded hills, colorful houses, café and station of Lindbacken"
            fill
            priority
            placeholder="blur"
            sizes="(max-width: 850px) 100vw, 75vw"
          />
          <div className="life-map-shade" />
          <div className="life-map-title">
            <span>
              <MapPin size={13} />
              Sverige
            </span>
            <h2>Lindbacken</h2>
            <p>A little Swedish. A whole new world.</p>
          </div>
          {places.map(({ name, href, icon: Icon, x, y }) => (
            <Link
              key={name}
              href={href}
              className="life-map-pin"
              aria-label={`Visit ${name}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <Icon size={21} />
              <span>{name}</span>
            </Link>
          ))}
          <div className="life-map-caption">
            <span className="life-map-dot" />
            Your next little adventure is waiting.
          </div>
        </section>
        <aside className="life-town-aside">
          <section className="life-next-quest">
            <span className="life-eyebrow">
              <Sparkles size={14} />A little adventure
            </span>
            <div className="life-quest-emblem">
              <SuggestedIcon size={31} strokeWidth={1.6} />
            </div>
            <span className="life-small-label">{suggested.subtitle}</span>
            <h2>
              {completed.has(suggested.id) ? suggested.next : suggested.title}
            </h2>
            <p>{suggested.description}</p>
            <Link
              className="life-button life-button-light"
              href={`/practice?scene=${suggested.id}`}
            >
              {completed.has(suggested.id) ? "Visit again" : "Let’s go"}
              <ArrowRight size={18} />
            </Link>
            {recommendation.scaffolded ? (
              <span className="life-quest-support">
                A little help whenever you need it.
              </span>
            ) : null}
          </section>
          <SaplingGarden compact stamps={stampCount} />
        </aside>
      </div>
      <nav className="life-places" aria-label="Places around town">
        {places.map(({ name, label, href, icon: Icon }) => (
          <Link key={name} href={href}>
            <span className="life-place-icon">
              <Icon size={23} />
            </span>
            <span>
              <strong>{name}</strong>
              <small>{label}</small>
            </span>
            <ArrowRight size={17} />
          </Link>
        ))}
      </nav>
      <section className="life-chapter" aria-labelledby="life-chapter-heading">
        <div className="life-section-heading">
          <div>
            <p className="life-eyebrow">Chapter one</p>
            <h2 id="life-chapter-heading">Settling in.</h2>
          </div>
          <span>{stampCount} of 4 memories made</span>
        </div>
        <div className="life-quest-grid">
          {townQuests.map((quest, index) => {
            const Icon = questIcons[quest.icon];
            const earned = completed.has(quest.id);
            return (
              <Link
                className={`life-quest-card ${earned ? "is-earned" : ""}`}
                key={quest.id}
                href={`/practice?scene=${quest.id}`}
              >
                <div className="life-quest-card-top">
                  <span className="life-quest-number">0{index + 1}</span>
                  <span className="life-quest-card-icon">
                    {earned ? <Check size={20} /> : <Icon size={20} />}
                  </span>
                </div>
                <h3>{earned ? quest.next : quest.title}</h3>
                <p>{quest.description}</p>
                <span className="life-quest-card-bottom">
                  {earned ? "Stamp collected · Visit again" : quest.subtitle}
                  <ArrowRight size={16} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
