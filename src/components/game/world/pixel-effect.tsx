"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { BlendFunction, Effect, EffectAttribute } from "postprocessing";

// The island is drawn at a fraction of the screen's resolution and scaled up
// with hard edges, so every object turns into chunky pixel art. Pixels are a
// whole number of device pixels so they all come out the same size.
const TARGET_ROWS = 300;

function pixelScale() {
  const ratio = window.devicePixelRatio || 1;
  const devicePixels = Math.max(2, Math.round((window.innerHeight * ratio) / TARGET_ROWS));
  return ratio / devicePixels;
}

export function usePixelDpr() {
  const [dpr, setDpr] = useState(pixelScale);
  useEffect(() => {
    const update = () => setDpr(pixelScale());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return dpr;
}

// One-pixel outlines where an object stands in front of something farther
// away, in a darker shade of the object's own colour rather than black.
const outlineFragment = /* glsl */ `
  uniform float uStrength;
  uniform float uFadeNear;
  uniform float uFadeFar;

  float distanceAt(const in vec2 uv) {
    return -getViewZ(readDepth(uv));
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    float d = -getViewZ(depth);
    float threshold = 0.05 * d + 0.12;
    float edge = 0.0;
    edge = max(edge, step(threshold, distanceAt(uv + vec2(texelSize.x, 0.0)) - d));
    edge = max(edge, step(threshold, distanceAt(uv - vec2(texelSize.x, 0.0)) - d));
    edge = max(edge, step(threshold, distanceAt(uv + vec2(0.0, texelSize.y)) - d));
    edge = max(edge, step(threshold, distanceAt(uv - vec2(0.0, texelSize.y)) - d));
    float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, d);
    vec3 ink = inputColor.rgb * vec3(0.32, 0.3, 0.38);
    outputColor = vec4(mix(inputColor.rgb, ink, edge * fade * uStrength), inputColor.a);
  }
`;

class OutlineEffect extends Effect {
  constructor() {
    super("PixelOutline", outlineFragment, {
      attributes: EffectAttribute.DEPTH,
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["uStrength", new THREE.Uniform(0.85)],
        ["uFadeNear", new THREE.Uniform(60)],
        ["uFadeFar", new THREE.Uniform(150)],
      ]),
    });
  }
}

// Snaps colours to a small number of levels per channel, dithering between
// neighbours with an ordered Bayer pattern like hand-made pixel art.
const paletteFragment = /* glsl */ `
  uniform float uLevels;

  float bayer4(vec2 p) {
    vec2 q = mod(floor(p), 4.0);
    int i = int(q.x + q.y * 4.0);
    float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
    return (m[i] + 0.5) / 16.0 - 0.5;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = clamp(inputColor.rgb, 0.0, 1.0);
    c = pow(c, vec3(1.0 / 2.2));
    c = floor(c * uLevels + 0.5 + bayer4(uv * resolution) * 0.55) / uLevels;
    outputColor = vec4(pow(clamp(c, 0.0, 1.0), vec3(2.2)), inputColor.a);
  }
`;

class PaletteEffect extends Effect {
  constructor() {
    super("PixelPalette", paletteFragment, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([["uLevels", new THREE.Uniform(20)]]),
    });
  }
}

export function PixelOutline() {
  const effect = useMemo(() => new OutlineEffect(), []);
  return <primitive object={effect} dispose={null} />;
}

export function PixelPalette() {
  const effect = useMemo(() => new PaletteEffect(), []);
  return <primitive object={effect} dispose={null} />;
}
