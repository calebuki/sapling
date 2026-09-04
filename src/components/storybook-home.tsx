"use client";

import { ArrowDown, ArrowRight, Leaf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import storybookImage from "@/assets/home/lindbacken-storybook.png";
import { SwedishPracticeWorld } from "@/components/swedish-practice-world";
import styles from "@/components/storybook-home.module.css";

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function StorybookHome() {
  const sequenceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sequence = sequenceRef.current;
    if (!sequence) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame: number | null = null;

    function renderFrame() {
      animationFrame = null;
      if (reducedMotion.matches) {
        return;
      }

      const currentSequence = sequenceRef.current;
      if (!currentSequence) {
        return;
      }

      const scrollRange = Math.max(
        currentSequence.offsetHeight - window.innerHeight,
        1,
      );
      const progress = clamp(
        -currentSequence.getBoundingClientRect().top / scrollRange,
      );
      const introOpacity = clamp(1 - progress * 2.1);
      const arrivalOpacity = clamp((progress - 0.38) * 2.15);
      const glowOpacity = Math.sin(progress * Math.PI) * 0.82;

      currentSequence.style.setProperty(
        "--scene-scale",
        (1.02 + progress * 0.11).toFixed(4),
      );
      currentSequence.style.setProperty(
        "--scene-shift",
        `${(-progress * 2.2).toFixed(3)}%`,
      );
      currentSequence.style.setProperty("--intro-opacity", introOpacity.toFixed(4));
      currentSequence.style.setProperty(
        "--intro-shift",
        `${(-progress * 2.5).toFixed(3)}rem`,
      );
      currentSequence.style.setProperty(
        "--arrival-opacity",
        arrivalOpacity.toFixed(4),
      );
      currentSequence.style.setProperty(
        "--arrival-shift",
        `${((1 - arrivalOpacity) * 2.4).toFixed(3)}rem`,
      );
      currentSequence.style.setProperty("--glow-opacity", glowOpacity.toFixed(4));
      currentSequence.style.setProperty(
        "--glow-scale",
        (0.72 + progress * 1.05).toFixed(4),
      );
      currentSequence.style.setProperty(
        "--scroll-opacity",
        clamp(1 - progress * 3).toFixed(4),
      );
    }

    function scheduleFrame() {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    }

    renderFrame();
    window.addEventListener("scroll", scheduleFrame, { passive: true });
    window.addEventListener("resize", scheduleFrame);
    reducedMotion.addEventListener("change", scheduleFrame);

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("scroll", scheduleFrame);
      window.removeEventListener("resize", scheduleFrame);
      reducedMotion.removeEventListener("change", scheduleFrame);
    };
  }, []);

  return (
    <div className={styles.storybookHome}>
      <section className={styles.sequence} ref={sequenceRef}>
        <div className={styles.stage}>
          <div aria-hidden="true" className={styles.artwork}>
            <Image
              alt=""
              className={styles.storyImage}
              placeholder="blur"
              priority
              sizes="100vw"
              src={storybookImage}
            />
          </div>
          <div aria-hidden="true" className={styles.wash} />
          <div aria-hidden="true" className={styles.paper} />
          <div aria-hidden="true" className={styles.grid} />
          <div aria-hidden="true" className={styles.vignette} />

          <div aria-hidden="true" className={styles.seedGlow}>
            <Leaf size={36} strokeWidth={1.5} />
          </div>

          <div className={styles.intro}>
            <div className={styles.introInner}>
              <div className={styles.introMark}>
                <p className={styles.eyebrow}>Sapling · Svenska</p>
                <h1 className={styles.introTitle}>
                  Language <em>takes root</em> here.
                </h1>
              </div>
            </div>
          </div>

          <div className={styles.arrival}>
            <div className={styles.arrivalInner}>
              <p className={styles.eyebrow}>Your Swedish world</p>
              <h2 className={styles.arrivalTitle}>Lindbacken</h2>
              <p className={styles.arrivalCopy}>
                Learn what comes next. Use it around town.
              </p>
              <a className={styles.arrivalLink} href="#lindbacken-world">
                Enter the town
                <ArrowDown aria-hidden="true" size={15} />
              </a>
            </div>
          </div>

          <nav aria-label="Choose a learning path" className={styles.modeNav}>
            <Link className={styles.modeLink} href="/learn">
              <span className={styles.modeNumber}>01</span>
              <span>Learn</span>
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
            <Link className={styles.modeLink} href="/practice">
              <span className={styles.modeNumber}>02</span>
              <span>Practice</span>
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </nav>

          <div aria-hidden="true" className={styles.scrollCue}>
            Scroll into Lindbacken
            <ArrowDown size={14} />
          </div>
        </div>
      </section>

      <section className={styles.town} id="lindbacken-world">
        <SwedishPracticeWorld embedded />
      </section>
    </div>
  );
}
