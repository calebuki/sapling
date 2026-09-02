"use client";

import { useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

import styles from "./login-scene.module.css";

export function LoginScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [isEvening, setIsEvening] = useState(false);

  function moveScene(event: React.PointerEvent<HTMLDivElement>) {
    const scene = sceneRef.current;
    if (!scene || event.pointerType === "touch") return;

    const bounds = scene.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    scene.style.setProperty("--scene-x", x.toFixed(3));
    scene.style.setProperty("--scene-y", y.toFixed(3));
  }

  function resetScene() {
    sceneRef.current?.style.setProperty("--scene-x", "0");
    sceneRef.current?.style.setProperty("--scene-y", "0");
  }

  return (
    <div
      className={`${styles.scene} ${isEvening ? styles.evening : ""}`}
      onPointerLeave={resetScene}
      onPointerMove={moveScene}
      ref={sceneRef}
    >
      <div className={styles.sceneCopy}>
        <h2>Find your place in the language.</h2>
      </div>

      <button
        aria-label={isEvening ? "Show the village in daylight" : "Turn on the village lights"}
        aria-pressed={isEvening}
        className={styles.lightSwitch}
        onClick={() => setIsEvening((current) => !current)}
        type="button"
      >
        {isEvening ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
        <span>{isEvening ? "Daylight" : "Evening"}</span>
      </button>

      <svg
        aria-hidden="true"
        className={styles.artwork}
        viewBox="0 0 900 760"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sapling-sky" x1="0" x2="0" y1="0" y2="1">
            <stop className={styles.skyTop} offset="0" />
            <stop className={styles.skyBottom} offset="1" />
          </linearGradient>
          <linearGradient id="sapling-water" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#a8c9c2" />
            <stop offset="1" stopColor="#709a94" />
          </linearGradient>
          <filter id="sapling-shadow" height="180%" width="180%" x="-40%" y="-40%">
            <feGaussianBlur stdDeviation="13" />
          </filter>
        </defs>

        <rect className={styles.sky} fill="url(#sapling-sky)" height="760" width="900" />
        <circle className={styles.sun} cx="722" cy="143" r="43" />
        <g className={`${styles.cloud} ${styles.cloudOne}`}>
          <ellipse cx="118" cy="155" rx="53" ry="16" />
          <circle cx="91" cy="143" r="21" />
          <circle cx="127" cy="134" r="29" />
          <circle cx="158" cy="148" r="19" />
        </g>
        <g className={`${styles.cloud} ${styles.cloudTwo}`}>
          <ellipse cx="690" cy="245" rx="43" ry="13" />
          <circle cx="668" cy="236" r="17" />
          <circle cx="696" cy="230" r="23" />
          <circle cx="720" cy="240" r="14" />
        </g>

        <g className={styles.farLayer}>
          <path className={styles.farHill} d="M0 350 118 251l93 77 94-117 101 110 122-94 131 101 111-77 150 105v131H0Z" />
          <path className={styles.nearHill} d="M0 405 122 337l112 43 118-83 118 72 115-57 120 68 105-39 110 68v107H0Z" />
          <g className={styles.turbine} transform="translate(770 281)">
            <path d="M-6 130 0 19l6 111Z" fill="#f3efe2" />
            <g className={styles.turbineBlades}>
              <circle cx="0" cy="17" fill="#ebe6d8" r="8" />
              <path d="m2 13 13-70 10 2-18 70Z" fill="#f8f5ec" />
              <path d="m5 20 65 23-4 9L1 26Z" fill="#f8f5ec" />
              <path d="m-6 20-49 52-7-7 50-51Z" fill="#f8f5ec" />
            </g>
          </g>
        </g>

        <g className={styles.waterLayer}>
          <path d="M0 445 900 405v355H0Z" fill="url(#sapling-water)" />
          <path d="m42 528 176-8M645 491l177-11M497 563l118-7M86 652l189-11" className={styles.waterLines} />
          <g className={styles.ferry}>
            <path d="m-80 610 135-5-23 29H-59Z" fill="#f6f0df" />
            <path d="m-58 585 74-3 25 24-99 4Z" fill="#d8715e" />
            <path d="m-43 574 42-2 17 12-59 2Z" fill="#f6f0df" />
            <rect fill="#244a45" height="6" rx="2" width="24" x="-36" y="577" />
            <path d="M57 621q43 5 78-3" className={styles.wake} />
          </g>
        </g>

        <ellipse className={styles.landShadow} cx="448" cy="621" filter="url(#sapling-shadow)" rx="316" ry="64" />
        <g className={styles.villageLayer}>
          <path d="m110 502 335-184 354 208-346 202Z" fill="#819a65" />
          <path d="m110 502 343 198 346-199v25L453 728 110 530Z" fill="#607a52" />
          <path d="m185 497 261-143 276 161-269 155Z" fill="#aabd83" />
          <path d="m259 550 202-114 181 104-204 117Z" fill="#d8d0b7" />
          <path d="m296 561 165-93 147 84-166 95Z" fill="#c1b89f" />

          <g transform="translate(201 427)">
            <g className={styles.pine}>
              <path d="M-5 78h10V36H-5Z" fill="#654b35" />
              <path d="M0 0-37 55H37Z" fill="#264b3a" />
              <path d="m0 21-43 56h86Z" fill="#315d48" />
            </g>
          </g>
          <g transform="translate(667 455) scale(.86)">
            <g className={`${styles.pine} ${styles.pineSlow}`}>
              <path d="M-5 78h10V36H-5Z" fill="#654b35" />
              <path d="M0 0-37 55H37Z" fill="#264b3a" />
              <path d="m0 21-43 56h86Z" fill="#315d48" />
            </g>
          </g>
          <g transform="translate(690 491) scale(.65)">
            <g className={styles.pine}>
              <path d="M-5 78h10V36H-5Z" fill="#654b35" />
              <path d="M0 0-37 55H37Z" fill="#264b3a" />
              <path d="m0 21-43 56h86Z" fill="#315d48" />
            </g>
          </g>

          <g className={styles.redHouse}>
            <path d="m219 479 98-56 77 45-98 56Z" fill="#8e463e" />
            <path d="m229 478 67 39v91l-67-39Z" fill="#b95749" />
            <path d="m296 517 89-51v92l-89 50Z" fill="#d76b59" />
            <path d="m219 479 76 44 99-56-78-45Z" fill="#713b36" />
            <path d="m243 516 25 14v33l-25-14Z" className={styles.window} />
            <path d="m324 516 28-16v38l-28 16Z" fill="#583c32" />
            <path d="m328 465 14-8v-37l-14 8Z" fill="#6b4537" />
            <g className={styles.smoke}>
              <circle cx="341" cy="404" r="10" />
              <circle cx="352" cy="385" r="14" />
              <circle cx="366" cy="361" r="17" />
            </g>
          </g>

          <g className={styles.yellowHouse}>
            <path d="m376 427 113-64 105 61-113 65Z" fill="#92563e" />
            <path d="m392 424 89 51v128l-89-51Z" fill="#d4a344" />
            <path d="m481 475 101-58v128l-101 58Z" fill="#e8bd5d" />
            <path d="m376 427 104 60 114-65-105-61Z" fill="#29443b" />
            <path d="m407 471 27 16v34l-27-16Zm0 55 27 16v34l-27-16Zm103-20 28-16v36l-28 16Zm0-54 28-16v36l-28 16" className={styles.window} />
            <path d="m550 519 22-13v44l-22 13Z" fill="#4b4035" />
            <path d="m450 384 17-10v-42l-17 10Z" fill="#263d35" />
            <path className={styles.flag} d="m530 366 0-38 44 9-44 15Z" fill="#b84b43" />
            <path d="M530 420v-94" stroke="#f0eadb" strokeWidth="4" />
          </g>

          <g className={styles.blueHouse}>
            <path d="m545 476 82-47 78 45-82 47Z" fill="#33484a" />
            <path d="m554 475 69 40v87l-69-40Z" fill="#627f7d" />
            <path d="m623 515 73-42v88l-73 41Z" fill="#7fa09b" />
            <path d="m545 476 78 45 82-47-78-45Z" fill="#263c3c" />
            <path d="m569 513 24 14v31l-24-14Zm77 17 24-14v32l-24 14" className={styles.window} />
            <path d="m610 470 12-7v-32l-12 7Z" fill="#263c3c" />
          </g>

          <g className={styles.bike} transform="translate(438 626)">
            <circle cx="-21" cy="9" fill="none" r="13" />
            <circle cx="23" cy="9" fill="none" r="13" />
            <path d="m-21 9 14-24 12 24H-21Zm26 0 12-26 6 26M-12-14h13m13-4h10" />
          </g>

          <g transform="translate(597 607)">
            <g className={styles.person}>
              <circle cx="0" cy="-20" fill="#d29972" r="7" />
              <path d="m-8-11 15-2 5 27-18 2Z" fill="#cb765b" />
              <path d="m-3 15-4 25m14-27 8 23" stroke="#293e37" strokeLinecap="round" strokeWidth="5" />
            </g>
          </g>
        </g>

        <g className={styles.birds}>
          <path d="M152 248q10-11 20 0 10-11 20 0M224 201q8-8 16 0 8-8 16 0" />
        </g>
      </svg>
    </div>
  );
}
