"use client";

import { useEffect, useRef, useState } from "react";

import type { Sapling3d } from "./sapling-3d";

// The Sapling mascot for the hub, with a hello in the language you were last
// learning. He is drawn in 3D once it loads; until then, or without WebGL, a
// flat sprite painted pixel by pixel stands in, bobbing, blinking and waving.

const W = 36;
const H = 40;

type Frame = { wave: boolean; blink: boolean };

const C = {
  body: "#7cc97a",
  bodyLight: "#9bdb8f",
  bodyShade: "#5fae63",
  belly: "#b9e6a6",
  arm: "#6bb869",
  armShade: "#56a35a",
  feet: "#2f7d4f",
  stem: "#26794c",
  leafL: "#3aa56b",
  leafR: "#4fbf7d",
  rib: "#2f8a58",
  eye: "#2b2233",
  mouth: "#7a3030",
  tongue: "#e0707a",
  blush: "#f39a9a",
  shadow: "rgba(38, 60, 50, 0.18)",
};

const inRoundRect = (x: number, y: number, x0: number, y0: number, x1: number, y1: number, r: number) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number, angle = 0) => {
  const dx = x - cx, dy = y - cy, c = Math.cos(angle), s = Math.sin(angle);
  const u = dx * c + dy * s, v = -dx * s + dy * c;
  return (u / rx) ** 2 + (v / ry) ** 2 <= 1;
};

// Every pixel takes the colour of the topmost shape that covers its centre.
function colourAt(px: number, py: number, { wave }: Frame): string | null {
  const x = px + 0.5, y = py + 0.5;
  // right arm, raised to wave
  if (wave && inRoundRect(x, y, 29, 9, 33, 21, 2)) return x > 31.5 ? C.armShade : C.arm;
  // leaves and stem
  if (inEllipse(x, y, 11.5, 7, 6.5, 2.6, -0.35)) return Math.abs(y - (7 + (x - 11.5) * -0.36)) < 0.5 && x > 7 ? C.rib : C.leafL;
  if (inEllipse(x, y, 24.5, 6, 6.5, 2.6, 0.35)) return Math.abs(y - (6 + (x - 24.5) * 0.36)) < 0.5 && x < 29 ? C.rib : C.leafR;
  if (x >= 17 && x <= 19 && y >= 7 && y <= 13) return C.stem;
  // body with toon bands: light top-left, shade down the right side
  if (inRoundRect(x, y, 6, 12, 30, 35, 6)) {
    if (inRoundRect(x, y, 11, 26, 25, 33, 3)) return C.belly;
    if (x > 26.5) return C.bodyShade;
    if (x < 11 && y < 20) return C.bodyLight;
    return C.body;
  }
  // arms at rest
  if (inRoundRect(x, y, 3, 21, 7, 30, 2)) return x < 4.5 ? C.armShade : C.arm;
  if (!wave && inRoundRect(x, y, 29, 21, 33, 30, 2)) return x > 31.5 ? C.armShade : C.arm;
  // feet and shadow
  if (inRoundRect(x, y, 11, 34, 16, 37.5, 1.5) || inRoundRect(x, y, 20, 34, 25, 37.5, 1.5)) return C.feet;
  if (inEllipse(x, y, 18, 38, 12, 1.8)) return C.shadow;
  return null;
}

function paint(ctx: CanvasRenderingContext2D, frame: Frame) {
  ctx.clearRect(0, 0, W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = colourAt(x, y, frame);
      if (c) {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const px = (x: number, y: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
  };
  // the villagers' pixel face: two eyes with a glint, blush and a smile
  for (const ex of [12, 22]) {
    if (frame.blink) [ex - 1, ex, ex + 1, ex + 2].forEach((x) => px(x, 21, C.eye));
    else {
      for (let y = 19; y <= 21; y++) {
        px(ex, y, C.eye);
        px(ex + 1, y, C.eye);
      }
      px(ex + 1, 19, "#ffffff");
    }
  }
  for (const bx of [9, 10, 25, 26]) px(bx, 23, C.blush);
  if (frame.wave) {
    [16, 17, 18, 19].forEach((x) => px(x, 23, C.mouth));
    [17, 18].forEach((x) => px(x, 24, C.tongue));
  } else {
    px(16, 23, C.mouth);
    px(19, 23, C.mouth);
    [17, 18].forEach((x) => px(x, 24, C.mouth));
  }
}

export function SaplingMascot({ greeting, lang }: { greeting: string; lang: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const live = useRef<Sapling3d | null>(null);
  const [is3d, setIs3d] = useState(false);
  const [waving, setWaving] = useState(false);
  const [blink, setBlink] = useState(false);

  // The 3D sprout loads after the page, and takes over from the flat sprite once it draws.
  useEffect(() => {
    let cancelled = false;
    import("./sapling-3d").then(({ startSapling3d }) => {
      if (cancelled || !stage.current) return;
      live.current = startSapling3d(stage.current, () => setWaving(true));
      setIs3d(Boolean(live.current));
    });
    return () => {
      cancelled = true;
      live.current?.stop();
      live.current = null;
    };
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) paint(ctx, { wave: waving && !is3d, blink });
  }, [waving, blink, is3d]);

  // The flat sprite blinks and waves on its own; the 3D one runs its own timing.
  useEffect(() => {
    if (is3d || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const blinkLoop = () => later(2600 + Math.random() * 2400, () => { setBlink(true); later(140, () => { setBlink(false); blinkLoop(); }); });
    const waveLoop = (first: number) => later(first, () => { setWaving(true); waveLoop(9000 + Math.random() * 4000); });
    blinkLoop();
    waveLoop(900);
    return () => timers.forEach(clearTimeout);
  }, [is3d]);

  return (
    <button
      aria-label="The Sapling mascot waves hello"
      className={`sapling-mascot${waving ? " is-waving" : ""}${is3d ? " is-3d" : ""}`}
      onClick={() => (live.current ? live.current.wave() : setWaving(true))}
      type="button"
    >
      <span
        className="sapling-mascot-bubble"
        lang={lang}
        onAnimationEnd={() => setWaving(false)}
      >
        {greeting}
      </span>
      <div className="sapling-mascot-stage" ref={stage}>
        <canvas ref={canvas} className="sapling-mascot-sprite" width={W} height={H} aria-hidden="true" />
      </div>
    </button>
  );
}
