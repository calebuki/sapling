// Every speaker gets one consistent neural voice so the island sounds like the
// same people each time you visit. Keys are shared by the client and the
// speech route; the route only accepts these keys, never raw voice names.

export const speechVoices = {
  elin: "Leda",
  bosse: "Achird",
  stina: "Erinome",
  astrid: "Sulafat",
  player: "Aoede",
  woman: "Autonoe",
  man: "Umbriel",
} as const;

export type SpeechVoiceKey = keyof typeof speechVoices;

export function isSpeechVoiceKey(value: string): value is SpeechVoiceKey {
  return Object.hasOwn(speechVoices, value);
}

export function speechVoiceFor(who: string | null | undefined, pitch = 1): SpeechVoiceKey {
  if (who && isSpeechVoiceKey(who)) return who;
  return pitch < 1 ? "man" : "woman";
}
