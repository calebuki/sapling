import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import nextEnv from "@next/env";

import { getSpeechClips } from "../src/lib/learning/course.ts";

nextEnv.loadEnvConfig(process.cwd());

const outputDirectory = path.join(process.cwd(), "public", "audio", "danish");
const manifestPath = path.join(outputDirectory, "manifest.json");
const sourceBaseUrl = process.env.SPEECH_AUDIO_SOURCE_BASE_URL?.replace(/\/$/, "");
const speechKey = process.env.AZURE_SPEECH_KEY?.trim();
const speechRegion = process.env.AZURE_SPEECH_REGION?.trim();

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function clipVersion(clip) {
  const source = `${clip.voice}\0${clip.text}`;
  let hash = 2_166_136_261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(36);
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return {};
  }
}

async function synthesize(clip) {
  if (sourceBaseUrl) {
    const response = await fetch(
      `${sourceBaseUrl}/api/speech/audio/${encodeURIComponent(clip.id)}`,
    );
    if (!response.ok) {
      throw new Error(`Could not download ${clip.id}: HTTP ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  if (!speechKey || !speechRegion) {
    throw new Error(
      "Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION, or provide SPEECH_AUDIO_SOURCE_BASE_URL.",
    );
  }

  const response = await fetch(
    `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/ssml+xml",
        "Ocp-Apim-Subscription-Key": speechKey,
        "User-Agent": "SaplingAudioGenerator",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: `<?xml version="1.0" encoding="UTF-8"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="da-DK"><voice name="${clip.voice}">${escapeXml(clip.text)}</voice></speak>`,
    },
  );

  if (!response.ok) {
    throw new Error(`Azure could not synthesize ${clip.id}: HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

await mkdir(outputDirectory, { recursive: true });

const previousManifest = await loadManifest();
const nextManifest = {};
let generatedCount = 0;

for (const clip of getSpeechClips()) {
  const version = clipVersion(clip);
  const outputPath = path.join(outputDirectory, `${clip.id}.mp3`);
  nextManifest[clip.id] = version;

  if (previousManifest[clip.id] === version && (await fileExists(outputPath))) {
    continue;
  }

  const audio = await synthesize(clip);
  await writeFile(outputPath, audio);
  generatedCount += 1;
}

await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);
console.log(
  generatedCount === 0
    ? "All Danish course audio is already current."
    : `Generated ${generatedCount} Danish audio ${generatedCount === 1 ? "clip" : "clips"}.`,
);
