import type { IslandMeta } from "@/content/meta";

// Postcard illustrations of each island for the hub: plain SVG, so the hub
// stays light and never needs WebGL.

function Sea({ deep, shallow, sky, horizon }: { deep: string; shallow: string; sky: string; horizon: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`sky${sky.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky} />
          <stop offset="1" stopColor={horizon} />
        </linearGradient>
        <linearGradient id={`sea${deep.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shallow} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#sky${sky.slice(1)})`} />
      <rect y="112" width="320" height="88" fill={`url(#sea${deep.slice(1)})`} />
      <path d="M20 150h40M230 170h50M120 185h36" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function Cottage({ x, y, wall, s = 1 }: { x: number; y: number; wall: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-12" y="-14" width="24" height="16" fill={wall} />
      <path d="M-15 -13L0 -26L15 -13z" fill="#3a3d45" />
      <rect x="-12" y="-14" width="2" height="16" fill="#fff" />
      <rect x="10" y="-14" width="2" height="16" fill="#fff" />
      <rect x="-3" y="-7" width="6" height="9" fill="#6e4a2f" />
      <rect x="-9" y="-10" width="4" height="4" fill="#ffe3a3" stroke="#fff" strokeWidth="1" />
    </g>
  );
}

function Fir({ x, y, s = 1, shade = "#1f5a3a" }: { x: number; y: number; s?: number; shade?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.5" y="-4" width="3" height="6" fill="#5a3b24" />
      <path d="M0 -34L-10 -12H10z" fill={shade} />
      <path d="M0 -26L-12 -4H12z" fill={shade} />
      <path d="M0 -40L-7 -24H7z" fill={shade} />
    </g>
  );
}

function Timbered({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <rect x="-14" y="-20" width="28" height="22" fill="#f6efe2" />
      <path d="M-14 -20L14 2M14 -20L-14 2M-14 -9H14" stroke="#6b3f24" strokeWidth="2" />
      <rect x="-14" y="-20" width="28" height="22" fill="none" stroke="#6b3f24" strokeWidth="2.4" />
      <path d="M-19 -18L0 -40L19 -18z" fill="#4a3226" />
      <rect x="4" y="-8" width="6" height="10" fill="#6b3f24" />
      <rect x="-10" y="-16" width="6" height="5" fill="#ffe3a3" />
      <rect x="-11" y="-11" width="8" height="2.5" fill="#e0584f" />
    </g>
  );
}

function LillaO() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      <Sea deep="#1f6fa8" shallow="#56b7d3" sky="#8fc6ea" horizon="#e8f3f4" />
      <path d="M40 132c20-34 70-52 130-50 60 2 104 22 118 50 6 12-30 26-126 26S28 150 40 132z" fill="#79b457" />
      <path d="M40 132c-4 10 20 22 124 22s130-10 126-22c-4 8-40 16-126 16S46 142 40 132z" fill="#efdcaa" />
      <path d="M104 96c14-18 48-24 70-12" fill="none" stroke="#9cc766" strokeWidth="10" strokeLinecap="round" />
      <g transform="translate(62 128)">
        <path d="M-5 0l2-30h6l2 30z" fill="#ffffff" />
        <path d="M-3.9 -16l0.7-8h6.4l0.7 8z" fill="#c0392b" />
        <rect x="-3.5" y="-35" width="7" height="5" fill="#fff4c2" />
        <path d="M-4.5 -35l4.5-5 4.5 5z" fill="#c0392b" />
      </g>
      <Cottage x={96} y={126} wall="#a8322d" />
      <Cottage x={132} y={118} wall="#e3b448" s={0.85} />
      <Cottage x={214} y={124} wall="#a8322d" s={0.95} />
      <g transform="translate(172 118)">
        <rect x="-1.2" y="-38" width="2.4" height="38" fill="#4f8f3a" />
        <rect x="-10" y="-30" width="20" height="2" fill="#4f8f3a" />
        <circle cx="-8" cy="-24" r="4" fill="none" stroke="#4f8f3a" strokeWidth="2" />
        <circle cx="8" cy="-24" r="4" fill="none" stroke="#4f8f3a" strokeWidth="2" />
      </g>
      {[248, 262].map((x) => (
        <g key={x} transform={`translate(${x} 122)`}>
          <rect x="-1" y="-22" width="2" height="22" fill="#efeee8" />
          <ellipse cx="0" cy="-26" rx="7" ry="10" fill="#86bf5b" />
        </g>
      ))}
      <rect x="152" y="140" width="6" height="34" fill="#b98b5e" />
      <g transform="translate(176 170)">
        <rect x="-16" y="-6" width="32" height="8" rx="2" fill="#f4f1ea" />
        <rect x="-16" y="0" width="32" height="3" fill="#1f4e79" />
        <rect x="-8" y="-12" width="14" height="7" fill="#fff" />
        <rect x="-3" y="-17" width="4" height="6" fill="#c0392b" />
      </g>
      <g transform="translate(268 36)">
        <circle r="12" fill="#fff4c2" />
      </g>
    </svg>
  );
}

function Tannenau() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      <Sea deep="#1b5b63" shallow="#3f9a8f" sky="#9ccbe3" horizon="#eef1e6" />
      <path d="M0 116l40-38 30 22 44-46 40 34 36-26 50 40 38-30 42 44z" fill="#6f8f9c" opacity="0.55" />
      <path d="M0 118l52-26 36 16 48-30 44 28 44-18 50 24 46-14v20z" fill="#35684d" opacity="0.7" />
      <path d="M36 134c18-30 74-48 128-46 58 2 106 22 120 48 6 12-32 24-124 24S26 152 36 134z" fill="#5f9c47" />
      <path d="M36 134c-4 10 22 20 124 20s128-8 124-20c-4 8-40 14-124 14S42 144 36 134z" fill="#d9c79b" />
      <Fir x={58} y={132} s={0.9} />
      <Fir x={74} y={128} s={1.1} shade="#24613f" />
      <Fir x={250} y={130} s={1.05} />
      <Fir x={268} y={134} s={0.85} shade="#24613f" />
      <Fir x={236} y={124} s={0.8} />
      <Timbered x={112} y={128} />
      <Timbered x={206} y={126} s={0.9} flip />
      <g transform="translate(160 122)">
        <rect x="-8" y="-40" width="16" height="42" fill="#f6efe2" stroke="#6b3f24" strokeWidth="2" />
        <circle cy="-28" r="5" fill="#fff" stroke="#2c2a3d" strokeWidth="1.6" />
        <path d="M0 -28v-3M0 -28h2.5" stroke="#2c2a3d" strokeWidth="1.2" />
        <path d="M-9 -40c0-10 18-10 18 0z" fill="#3f6f4a" />
        <path d="M0 -50c-5 0-6-4 0-9 6 5 5 9 0 9z" fill="#3f6f4a" />
        <rect x="-0.6" y="-62" width="1.2" height="5" fill="#d9a53a" />
      </g>
      <rect x="150" y="140" width="6" height="30" fill="#8a6a44" />
      <g transform="translate(176 168)">
        <path d="M-18 -4h36l-5 7h-26z" fill="#8a5a36" />
        <rect x="-2" y="-18" width="2" height="14" fill="#6e4a2f" />
        <path d="M0 -18l10 10H0z" fill="#fffaf0" />
      </g>
      <g transform="translate(270 34)">
        <circle r="11" fill="#fff4c2" />
      </g>
    </svg>
  );
}

function Soon() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      <Sea deep="#51708a" shallow="#88a7bb" sky="#c9d6de" horizon="#eef1f3" />
      <path d="M70 134c16-24 60-38 100-36 44 2 76 16 86 36 4 10-22 20-94 20S60 148 70 134z" fill="#9db38e" opacity="0.8" />
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="110" cy="112" rx="46" ry="12" />
        <ellipse cx="200" cy="118" rx="54" ry="13" />
        <ellipse cx="160" cy="100" rx="34" ry="9" />
      </g>
    </svg>
  );
}

export function IslandArt({ art }: { art: IslandMeta["art"] }) {
  return art === "lilla-o" ? <LillaO /> : art === "tannenau" ? <Tannenau /> : <Soon />;
}
