import { Mp3Encoder } from "@breezystack/lamejs";

// Gemini hands back uncompressed 16-bit PCM WAV; stored clips are MP3s about
// a tenth of the size. Speech needs no more than 48 kbps.
const KBPS = 48;
const FRAME = 1152;

export function wavToMp3(wav: Uint8Array): Uint8Array {
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  const tag = (at: number) => String.fromCharCode(wav[at], wav[at + 1], wav[at + 2], wav[at + 3]);
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("not a WAV file");

  let channels = 0;
  let sampleRate = 0;
  let bits = 0;
  let data: Int16Array | null = null;
  for (let at = 12; at + 8 <= wav.byteLength; ) {
    const size = view.getUint32(at + 4, true);
    const body = at + 8;
    if (tag(at) === "fmt ") {
      channels = view.getUint16(body + 2, true);
      sampleRate = view.getUint32(body + 4, true);
      bits = view.getUint16(body + 14, true);
    } else if (tag(at) === "data") {
      const length = Math.min(size, wav.byteLength - body) >> 1;
      data = new Int16Array(length);
      for (let i = 0; i < length; i++) data[i] = view.getInt16(body + i * 2, true);
    }
    at = body + size + (size & 1);
  }
  if (!data || bits !== 16 || (channels !== 1 && channels !== 2)) throw new Error("unsupported WAV format");

  const encoder = new Mp3Encoder(channels, sampleRate, KBPS);
  const chunks: Uint8Array[] = [];
  if (channels === 1) {
    for (let i = 0; i < data.length; i += FRAME) chunks.push(encoder.encodeBuffer(data.subarray(i, i + FRAME)));
  } else {
    const frames = data.length >> 1;
    const left = new Int16Array(frames);
    const right = new Int16Array(frames);
    for (let i = 0; i < frames; i++) {
      left[i] = data[i * 2];
      right[i] = data[i * 2 + 1];
    }
    for (let i = 0; i < frames; i += FRAME) chunks.push(encoder.encodeBuffer(left.subarray(i, i + FRAME), right.subarray(i, i + FRAME)));
  }
  chunks.push(encoder.flush());

  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
