"use client";

import { useEffect, useRef, useState } from "react";
import type { Line } from "@/lib/game/line";
import { sound } from "../audio/sfx";
import { Glossed } from "./glossed";

// Types a line out with the speaker's voice blips; a click finishes it early.
export function Typewriter({ line, pitch, onDone, done, english = false }: { line: Line; pitch: number; onDone: () => void; done: boolean; english?: boolean }) {
  const [shown, setShown] = useState(0);
  const skipped = useRef(done);
  useEffect(() => {
    skipped.current = done;
  }, [done]);
  // The parent remounts this per line, so counting always starts from zero.
  useEffect(() => {
    let i = 0;
    const timer = window.setInterval(() => {
      i++;
      setShown(i);
      if (skipped.current || i >= line.t.length) {
        window.clearInterval(timer);
        onDone();
        return;
      }
      if (i % 2 === 0 && /\p{L}/u.test(line.t[i] ?? "")) sound.blip(pitch);
    }, 26);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);
  const text = done ? line.t : line.t.slice(0, shown);
  return (
    <p className="typewriter">
      <Glossed text={text} en={line.en} />
      <span className="typewriter-ghost" aria-hidden="true">
        {done ? "" : line.t.slice(shown)}
      </span>
      {english ? <span className={`typewriter-en ${done ? "is-shown" : ""}`}>{line.en}</span> : null}
    </p>
  );
}
