"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Headphones,
  Leaf,
  RotateCcw,
  Sparkles,
  Sprout,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useUiSounds } from "@/components/providers/ui-sound-provider";
import styles from "./welcome-home.module.css";

const words = {
  sv: [
    {
      word: "hej",
      meaning: "hello",
      choices: ["thank you", "hello", "goodbye"],
    },
    {
      word: "tack",
      meaning: "thank you",
      choices: ["thank you", "please", "yes"],
    },
    { word: "skog", meaning: "forest", choices: ["house", "water", "forest"] },
  ],
  da: [
    {
      word: "hej",
      meaning: "hello",
      choices: ["thank you", "hello", "goodbye"],
    },
    {
      word: "tak",
      meaning: "thank you",
      choices: ["thank you", "please", "yes"],
    },
    { word: "skov", meaning: "forest", choices: ["house", "water", "forest"] },
  ],
};

export function WelcomeHome() {
  const [language, setLanguage] = useState<"sv" | "da">("sv");
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [grown, setGrown] = useState(0);
  const [night, setNight] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const { playSound, isMuted, toggleMuted } = useUiSounds();
  const root = useRef<HTMLDivElement>(null);
  const current = words[language][step];
  const correct = answer === current.meaning;
  const finished = grown === 3;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    root.current
      ?.querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function sound(kind: "tap" | "correct" | "complete" | "advance") {
    if (soundOn) playSound(kind);
  }

  function reset(nextLanguage = language) {
    setLanguage(nextLanguage);
    setStep(0);
    setAnswer(null);
    setGrown(0);
    sound("advance");
  }

  return (
    <div className={styles.page} ref={root}>
      <a className={styles.skip} href="#welcome-content" data-sound="none">
        Skip to content
      </a>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand} data-sound="none">
          <Sprout aria-hidden="true" />
          sapling<span>®</span>
        </Link>
        <nav aria-label="Main navigation">
          <a
            className={styles.aboutLink}
            href="#how-it-grows"
            data-sound="none"
          >
            A little about us
          </a>
          <button
            className={styles.sound}
            data-sound="none"
            aria-pressed={soundOn && !isMuted}
            onClick={() => {
              if (!soundOn || isMuted) {
                if (isMuted) toggleMuted();
                setSoundOn(true);
              } else setSoundOn(false);
            }}
          >
            {soundOn && !isMuted ? (
              <Volume2 size={17} />
            ) : (
              <VolumeX size={17} />
            )}
            <span>Sound {soundOn && !isMuted ? "on" : "off"}</span>
          </button>
          <Link className={styles.signin} href="/login" data-sound="none">
            Sign in <ArrowRight size={15} />
          </Link>
        </nav>
      </header>

      <main id="welcome-content">
        <section className={styles.hero} aria-labelledby="welcome-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span /> A SMALL START. A WHOLE NEW WORLD.
            </p>
            <h1 id="welcome-title">
              Languages
              <br />
              that take{" "}
              <span className={styles.rootWord}>
                root.
                <svg viewBox="0 0 350 26" aria-hidden="true">
                  <path d="M5 17 Q140 -4 344 11 M55 24 Q180 8 295 18" />
                </svg>
              </span>
            </h1>
            <p className={styles.intro}>
              A little curiosity goes a long way. Grow your Swedish or Danish
              with words you remember, conversations you can use, and a world to
              explore.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login" className={styles.primary} data-sound="none">
                Start growing <ArrowRight size={19} />
              </Link>
              <a href="#try-it" className={styles.tryLink} data-sound="none">
                Try a little first <ArrowDown size={17} />
              </a>
            </div>
            <div className={styles.languages}>
              <span>
                <i className={styles.swedishFlag} />
                Swedish
              </span>
              <span>
                <i className={styles.danishFlag} />
                Danish
              </span>
              <span className={styles.yourPace}>
                Your pace. Your little world.
              </span>
            </div>
          </div>

          <div className={`${styles.garden} ${night ? styles.night : ""}`}>
            <div className={styles.gardenTop}>
              <span>
                <span className={styles.liveDot} /> A LITTLE WORLD OF
                POSSIBILITY
              </span>
              <button
                data-sound="none"
                onClick={() => {
                  setNight(!night);
                  sound("advance");
                }}
                aria-label={
                  night
                    ? "Switch garden to daytime"
                    : "Switch garden to nighttime"
                }
              >
                {night ? "Moonlit" : "Sunlit"}{" "}
                <span aria-hidden="true">{night ? "☾" : "☀"}</span>
              </button>
            </div>
            <div className={styles.scene} aria-hidden="true">
              <div className={styles.sun} />
              <div className={styles.cloud} />
              <div className={`${styles.cloud} ${styles.cloudTwo}`} />
              <div className={styles.hillBack} />
              <div className={styles.hillFront} />
              <div className={styles.river} />
              <div className={styles.house}>
                <div className={styles.roof} />
                <div className={styles.window} />
                <div className={styles.door} />
              </div>
              {[0, 1, 2, 3, 4].map((tree) => (
                <div
                  key={tree}
                  className={`${styles.tree} ${styles[`tree${tree}`]}`}
                >
                  <i />
                  <i />
                  <b />
                </div>
              ))}
              <div className={styles.path} />
              <div
                className={styles.sproutSpot}
                style={{ "--growth": 1 + grown * 0.23 } as CSSProperties}
              >
                <div className={styles.plant}>
                  <i />
                  <i />
                  <b />
                </div>
              </div>
              <div className={styles.pebble} />
              <div className={styles.flowers}>✳</div>
            </div>
            <div className={styles.helloTag}>
              <span>
                {language === "sv" ? "HEJ, VÄRLDEN!" : "HEJ, VERDEN!"}
              </span>
              <span>
                Hello, world. <span aria-hidden="true">↗</span>
              </span>
            </div>
            <a href="#try-it" data-sound="none" className={styles.gardenNote}>
              <Sprout size={18} />
              <span>
                A few words.
                <br />
                <strong>Something starts to grow.</strong>
              </span>
              <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroFoot}>
            <span>LESS MEMORIZING. MORE MAKING IT YOURS.</span>
            <a href="#how-it-grows" data-sound="none">
              Keep wandering <ArrowDown size={14} />
            </a>
          </div>
        </section>

        <section id="how-it-grows" className={styles.about} data-reveal>
          <p className={styles.eyebrow}>01 / A DIFFERENT KIND OF GROWTH</p>
          <div className={styles.aboutHeading}>
            <h2>
              Small moments.
              <br />
              <span>Lasting roots.</span>
            </h2>
            <p>
              Sapling is a personal language-learning space. Meet useful words,
              bring them back from memory, and put them to work. Little by
              little, unfamiliar becomes familiar.
            </p>
          </div>
          <div className={styles.features}>
            <article>
              <div className={styles.featureArt}>
                <span className={styles.wordTile}>
                  hej<span>hello</span>
                </span>
                <span className={styles.wordTileSmall}>
                  a little every day ↗
                </span>
              </div>
              <span className={styles.number}>01</span>
              <h3>Make it stick.</h3>
              <p>
                Practice recalling a word, not just recognizing it. Revisit what
                needs another little nudge.
              </p>
            </article>
            <article>
              <div className={`${styles.featureArt} ${styles.listening}`}>
                <Headphones size={36} strokeWidth={1.4} />
                <div className={styles.wave}>
                  {[18, 32, 48, 25, 38, 58, 31, 44, 20].map((height, index) => (
                    <i
                      key={index}
                      style={
                        {
                          height,
                          "--delay": `${index * 0.12}s`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              </div>
              <span className={styles.number}>02</span>
              <h3>Find your rhythm.</h3>
              <p>
                Listen closely. Try everyday phrases. Build a feel for how your
                new language sounds.
              </p>
            </article>
            <article>
              <div className={`${styles.featureArt} ${styles.exploring}`}>
                <span className={styles.orbit} />
                <Sprout size={60} strokeWidth={1.3} />
                <span className={styles.exploreLabel}>curiosity welcome</span>
              </div>
              <span className={styles.number}>03</span>
              <h3>Go a little further.</h3>
              <p>
                Explore a playful Swedish island, or settle into Danish
                practice. Make room for discovery.
              </p>
            </article>
          </div>
        </section>

        <section id="try-it" className={styles.demo} data-reveal>
          <div className={styles.demoCopy}>
            <p className={styles.eyebrow}>02 / YOUR FIRST LITTLE ROOTS</p>
            <h2>
              It starts
              <br />
              with <em>hello.</em>
            </h2>
            <p>
              Three words. One tiny garden.
              <br />
              Give it a go — no account needed.
            </p>
            <div className={styles.languageSwitch} aria-label="Demo language">
              {(["sv", "da"] as const).map((code) => (
                <button
                  key={code}
                  data-sound="none"
                  aria-pressed={language === code}
                  onClick={() => reset(code)}
                >
                  <i
                    className={
                      code === "sv" ? styles.swedishFlag : styles.danishFlag
                    }
                  />
                  {code === "sv" ? "Swedish" : "Danish"}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.quiz}>
            <div className={styles.quizTop}>
              <span>
                <Sprout size={17} /> THE LITTLE WORD GARDEN
              </span>
              <span>{grown} / 3 rooted</span>
            </div>
            <div className={styles.growthTrack} aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className={index < grown ? styles.rooted : ""}
                >
                  {index < grown ? <Sprout /> : <span>·</span>}
                </span>
              ))}
            </div>
            {finished ? (
              <div className={styles.completion}>
                <Sparkles size={32} />
                <h3>Look at you grow.</h3>
                <p>Three new words. A lovely place to start.</p>
                <Link
                  href="/login"
                  className={styles.primary}
                  data-sound="none"
                >
                  Keep growing <ArrowRight size={18} />
                </Link>
                <button
                  className={styles.replay}
                  onClick={() => reset()}
                  data-sound="none"
                >
                  <RotateCcw size={14} /> Play again
                </button>
              </div>
            ) : (
              <>
                <p className={styles.prompt}>
                  What does this {language === "sv" ? "Swedish" : "Danish"} word
                  mean?
                </p>
                <h3 className={styles.quizWord} lang={language}>
                  {current.word}
                  <span>✳</span>
                </h3>
                <div className={styles.answers}>
                  {current.choices.map((choice) => (
                    <button
                      key={choice}
                      data-sound="none"
                      disabled={correct}
                      className={
                        answer === choice
                          ? correct
                            ? styles.correct
                            : styles.retry
                          : ""
                      }
                      onClick={() => {
                        setAnswer(choice);
                        if (choice === current.meaning) {
                          setGrown(step + 1);
                          sound(step === 2 ? "complete" : "correct");
                        } else sound("tap");
                      }}
                    >
                      {choice}
                      {answer === choice && correct && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className={styles.feedback} aria-live="polite">
              {finished ? (
                "Your little garden is planted."
              ) : correct ? (
                <>
                  <span>That’s it. A new word takes root.</span>
                  <button
                    data-sound="none"
                    onClick={() => {
                      setStep(step + 1);
                      setAnswer(null);
                      sound("advance");
                    }}
                  >
                    Next word <ArrowRight size={15} />
                  </button>
                </>
              ) : answer ? (
                `Not quite — ${current.word} means “${current.meaning}”. Try that one.`
              ) : (
                "Pick a meaning. See what grows."
              )}
            </div>
          </div>
        </section>

        <section className={styles.closing} data-reveal>
          <Leaf aria-hidden="true" size={32} />
          <p>EVERY LANGUAGE BEGINS SOMEWHERE.</p>
          <h2>
            Let’s see what
            <br />
            <em>grows.</em>
          </h2>
          <Link href="/login" className={styles.primary} data-sound="none">
            Find your first words <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className={styles.footer}>
        <Link href="/" className={styles.brand} data-sound="none">
          <Sprout />
          sapling
        </Link>
        <span>Made for curious minds. Grown at your pace.</span>
        <a href="#welcome-content" data-sound="none">
          Back to the top ↑
        </a>
      </footer>
    </div>
  );
}
