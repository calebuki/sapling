export type VoiceFragment = {
  id: string;
  speaker: "learner" | "elin";
  text: string;
  startMs: number;
  endMs: number;
};

export function appendFragment(current: VoiceFragment[], incoming: VoiceFragment) {
  if (current.some(f => f.id === incoming.id)) return current;
  // Overlap is legitimate in full duplex. Preserve repetitions and exact spacing.
  return [...current, incoming].sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
}

export function speakerCaption(fragments: VoiceFragment[], speaker: VoiceFragment["speaker"]) {
  return fragments.filter(f => f.speaker === speaker).map(f => f.text).join("");
}
