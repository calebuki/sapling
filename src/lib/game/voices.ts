// Every speaker gets one consistent neural voice so an island sounds like the
// same people each time you visit. The speech route only accepts names from
// this list, never arbitrary strings.

export const neuralVoices = [
  "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Callirrhoe", "Autonoe",
  "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar",
  "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat",
] as const;

export type NeuralVoice = (typeof neuralVoices)[number];

export function isNeuralVoice(value: string): value is NeuralVoice {
  return (neuralVoices as readonly string[]).includes(value);
}

// Voices for the player and for passers-by without a voice of their own.
export const playerVoice: NeuralVoice = "Aoede";
export const passerVoices = { woman: "Autonoe", man: "Umbriel" } as const satisfies Record<string, NeuralVoice>;

export type VoiceGender = "man" | "woman";

const womenVoices = new Set<string>([
  "Zephyr", "Kore", "Leda", "Aoede", "Callirrhoe", "Autonoe", "Despina", "Erinome", "Laomedeia", "Achernar",
  "Gacrux", "Pulcherrima", "Vindemiatrix", "Sulafat",
] satisfies NeuralVoice[]);

// Whether a neural voice sounds like a man or a woman, so a fallback voice
// can match it when the neural one is unavailable.
export function genderOf(voice: string): VoiceGender {
  return womenVoices.has(voice) ? "woman" : "man";
}
