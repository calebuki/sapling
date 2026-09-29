import * as THREE from "three";

// The island keeps the player's own clock: dawn around half past six, a
// golden evening, dusk around half past seven and a moonlit night that is
// still bright enough to play in. Everything between the keyframes blends.
// `?hour=21.5` in the address bar pins the clock, for trying out the night.

type Rgb = readonly [number, number, number];

type Key = {
  hour: number;
  // The main light: the sun by day, the moon by night.
  key: string;
  keyIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  ambient: string;
  ambientIntensity: number;
  rim: string;
  rimIntensity: number;
  // How far the fog moves from the island's own colour towards this one.
  fog: string;
  fogBlend: number;
  // Sky gradient, in linear colour like the sky shader works in.
  horizon: Rgb;
  mid: Rgb;
  zenith: Rgb;
  sunDisc: number;
  stars: number;
  // The sea's colour is multiplied by this; glints scale with `glint`.
  water: Rgb;
  glint: number;
  cloud: string;
  cloudGlow: string;
  // Lit windows and lamps grow brighter as it gets dark.
  glowBoost: number;
};

const night: Omit<Key, "hour"> = {
  key: "#a9bcff", keyIntensity: 0.75,
  hemiSky: "#5a6fa8", hemiGround: "#1f2a33", hemiIntensity: 0.8,
  ambient: "#8fa0d8", ambientIntensity: 0.4,
  rim: "#7f93d6", rimIntensity: 0.25,
  fog: "#26324d", fogBlend: 0.9,
  horizon: [0.06, 0.08, 0.16], mid: [0.028, 0.04, 0.1], zenith: [0.01, 0.016, 0.05],
  sunDisc: 0, stars: 1,
  water: [0.1, 0.14, 0.24], glint: 0.3,
  cloud: "#5a6688", cloudGlow: "#151c33",
  glowBoost: 1.8,
};

const dawn: Omit<Key, "hour"> = {
  key: "#ffb08a", keyIntensity: 1.3,
  hemiSky: "#f5c9bd", hemiGround: "#5f6b48", hemiIntensity: 1.0,
  ambient: "#ffd9c4", ambientIntensity: 0.25,
  rim: "#ff9f80", rimIntensity: 0.6,
  fog: "#e9c6b8", fogBlend: 0.75,
  horizon: [1.0, 0.62, 0.42], mid: [0.62, 0.55, 0.72], zenith: [0.2, 0.3, 0.6],
  sunDisc: 0.8, stars: 0.15,
  water: [0.95, 0.8, 0.78], glint: 0.6,
  cloud: "#ffd2c2", cloudGlow: "#ffb08a",
  glowBoost: 1.2,
};

const morning: Omit<Key, "hour"> = {
  key: "#fff2de", keyIntensity: 2.3,
  hemiSky: "#d6ebff", hemiGround: "#6f8f4f", hemiIntensity: 1.3,
  ambient: "#fff4e0", ambientIntensity: 0.25,
  rim: "#ffc9a3", rimIntensity: 0.5,
  fog: "#dde8ee", fogBlend: 0.2,
  horizon: [1.0, 0.88, 0.78], mid: [0.6, 0.8, 0.95], zenith: [0.3, 0.58, 0.88],
  sunDisc: 1, stars: 0,
  water: [1, 1, 1], glint: 1,
  cloud: "#ffffff", cloudGlow: "#fff6ea",
  glowBoost: 1,
};

// The look the island has always had.
const day: Omit<Key, "hour"> = {
  key: "#fff0d6", keyIntensity: 2.6,
  hemiSky: "#cfe8ff", hemiGround: "#6f8f4f", hemiIntensity: 1.35,
  ambient: "#fff4e0", ambientIntensity: 0.25,
  rim: "#ffc9a3", rimIntensity: 0.55,
  fog: "#cfe6ee", fogBlend: 0,
  horizon: [1.0, 0.9, 0.76], mid: [0.66, 0.85, 0.96], zenith: [0.33, 0.62, 0.9],
  sunDisc: 1, stars: 0,
  water: [1, 1, 1], glint: 1,
  cloud: "#ffffff", cloudGlow: "#fff6ea",
  glowBoost: 1,
};

const golden: Omit<Key, "hour"> = {
  key: "#ffc27a", keyIntensity: 2.0,
  hemiSky: "#ffe0b8", hemiGround: "#6f7f45", hemiIntensity: 1.2,
  ambient: "#ffe2c0", ambientIntensity: 0.25,
  rim: "#ff9f6b", rimIntensity: 0.8,
  fog: "#f0d3b0", fogBlend: 0.55,
  horizon: [1.0, 0.72, 0.45], mid: [0.7, 0.75, 0.85], zenith: [0.3, 0.5, 0.82],
  sunDisc: 1, stars: 0,
  water: [1, 0.88, 0.75], glint: 1.2,
  cloud: "#ffe0bf", cloudGlow: "#ffb070",
  glowBoost: 1.05,
};

const dusk: Omit<Key, "hour"> = {
  key: "#ff8f6b", keyIntensity: 0.8,
  hemiSky: "#c9a0c0", hemiGround: "#3a4238", hemiIntensity: 0.9,
  ambient: "#d8b0c8", ambientIntensity: 0.3,
  rim: "#ff7f6b", rimIntensity: 0.55,
  fog: "#b58f9c", fogBlend: 0.8,
  horizon: [0.95, 0.45, 0.35], mid: [0.45, 0.35, 0.55], zenith: [0.1, 0.14, 0.35],
  sunDisc: 0.5, stars: 0.35,
  water: [0.55, 0.45, 0.52], glint: 0.4,
  cloud: "#d9a0b0", cloudGlow: "#a0607a",
  glowBoost: 1.4,
};

const SUNRISE = 6.5;
const SUNSET = 19.5;

const keys: Key[] = [
  { hour: 0, ...night },
  { hour: 5, ...night },
  { hour: SUNRISE, ...dawn },
  { hour: 8.5, ...morning },
  { hour: 11.5, ...day },
  { hour: 16.5, ...day },
  { hour: 18.8, ...golden },
  { hour: SUNSET + 0.3, ...dusk },
  { hour: 21.3, ...night },
  { hour: 24, ...night },
];

export type Daylight = {
  hour: number;
  keyDirection: THREE.Vector3;
  sunDirection: THREE.Vector3;
  moonDirection: THREE.Vector3;
  key: THREE.Color;
  keyIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  ambient: THREE.Color;
  ambientIntensity: number;
  rim: THREE.Color;
  rimIntensity: number;
  fog: THREE.Color;
  horizon: THREE.Color;
  mid: THREE.Color;
  zenith: THREE.Color;
  sunDisc: number;
  stars: number;
  water: THREE.Color;
  glint: number;
  cloud: THREE.Color;
  cloudGlow: THREE.Color;
  glowBoost: number;
};

// The noon sun of the old fixed lighting, so midday looks as it always did.
const NOON_AZIMUTH = Math.atan2(0.55, -0.55);

function direction(azimuth: number, elevation: number) {
  const flat = Math.cos(elevation);
  return new THREE.Vector3(Math.cos(azimuth) * flat, Math.sin(elevation), Math.sin(azimuth) * flat).normalize();
}

function sunAt(hour: number) {
  const p = (hour - SUNRISE) / (SUNSET - SUNRISE);
  const elevation = Math.sin(Math.PI * THREE.MathUtils.clamp(p, 0, 1)) * 0.6 + 0.08;
  return direction(NOON_AZIMUTH + (p - 0.5) * 3.2, p < 0 || p > 1 ? 0.04 : elevation);
}

function moonAt(hour: number) {
  // Across the sky from the evening to the morning, high in the middle of the night.
  const p = (((hour - SUNSET + 24) % 24) / (24 - SUNSET + SUNRISE));
  return direction(NOON_AZIMUTH + 0.7 + (p - 0.5) * 2.2, 0.35 + Math.sin(Math.PI * THREE.MathUtils.clamp(p, 0, 1)) * 0.6);
}

const color = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);
const linear = (a: Rgb, b: Rgb, t: number) => new THREE.Color().setRGB(...a, THREE.LinearSRGBColorSpace).lerp(new THREE.Color().setRGB(...b, THREE.LinearSRGBColorSpace), t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function daylightAt(hour: number, islandFog: string): Daylight {
  const h = ((hour % 24) + 24) % 24;
  const i = Math.max(0, keys.findIndex((k) => k.hour > h) - 1);
  const a = keys[i];
  const b = keys[i + 1] ?? keys[i];
  const t = b.hour > a.hour ? THREE.MathUtils.smoothstep(h, a.hour, b.hour) : 0;
  const stars = mix(a.stars, b.stars, t);
  const sunDirection = sunAt(h);
  const moonDirection = moonAt(h);
  const fogBlend = mix(a.fogBlend, b.fogBlend, t);
  return {
    hour: h,
    // The main light hands over from the sun to the moon as the stars come out.
    keyDirection: sunDirection.clone().lerp(moonDirection, stars).normalize(),
    sunDirection,
    moonDirection,
    key: color(a.key, b.key, t),
    keyIntensity: mix(a.keyIntensity, b.keyIntensity, t),
    hemiSky: color(a.hemiSky, b.hemiSky, t),
    hemiGround: color(a.hemiGround, b.hemiGround, t),
    hemiIntensity: mix(a.hemiIntensity, b.hemiIntensity, t),
    ambient: color(a.ambient, b.ambient, t),
    ambientIntensity: mix(a.ambientIntensity, b.ambientIntensity, t),
    rim: color(a.rim, b.rim, t),
    rimIntensity: mix(a.rimIntensity, b.rimIntensity, t),
    fog: new THREE.Color(islandFog).lerp(color(a.fog, b.fog, t), fogBlend),
    horizon: linear(a.horizon, b.horizon, t),
    mid: linear(a.mid, b.mid, t),
    zenith: linear(a.zenith, b.zenith, t),
    sunDisc: mix(a.sunDisc, b.sunDisc, t),
    stars,
    water: linear(a.water, b.water, t),
    glint: mix(a.glint, b.glint, t),
    cloud: color(a.cloud, b.cloud, t),
    cloudGlow: color(a.cloudGlow, b.cloudGlow, t),
    glowBoost: mix(a.glowBoost, b.glowBoost, t),
  };
}

function pinnedHour() {
  if (typeof window === "undefined") return null;
  const value = Number.parseFloat(new URLSearchParams(window.location.search).get("hour") ?? "");
  return Number.isFinite(value) ? value : null;
}

export function currentHour() {
  const pinned = pinnedHour();
  if (pinned !== null) return pinned;
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

// Recomputed at most once a second: the light moves far slower than frames.
let cached: { at: number; fog: string; light: Daylight } | null = null;

export function daylight(islandFog: string) {
  const now = typeof performance === "undefined" ? 0 : performance.now();
  if (!cached || cached.fog !== islandFog || now - cached.at > 1000) {
    cached = { at: now, fog: islandFog, light: daylightAt(currentHour(), islandFog) };
  }
  return cached.light;
}
