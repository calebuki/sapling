"use client";

import { useEffect, useRef } from "react";

import { startIslandReel } from "./island-reel";

// The live half of the login screen. The reel adds its own canvas and word
// tags; React only provides the stage and the overlays it drives.
export default function IslandStage() {
  const stage = useRef<HTMLElement>(null);
  const words = useRef<HTMLDivElement>(null);
  const fade = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!stage.current || !words.current || !fade.current || !progress.current) return;
    const stop = startIslandReel({ stage: stage.current, words: words.current, fade: fade.current, progress: progress.current });
    return () => stop?.();
  }, []);

  return (
    <section aria-label="Scenes from the islands" className="login-stage" ref={stage}>
      <div className="login-stage-fade" ref={fade} />
      <div aria-hidden="true" className="login-stage-progress">
        <i ref={progress} />
      </div>
      <div aria-hidden="true" className="login-stage-words" ref={words} />
    </section>
  );
}
