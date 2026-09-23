import { appendFragment, type VoiceFragment } from "./transcript";

export type VoiceStatus = "idle" | "connecting" | "live" | "closing" | "closed" | "error";
export type VoiceSnapshot = {
  status: VoiceStatus;
  fragments: VoiceFragment[];
  seconds: number;
  finalized: boolean;
  error: string | null;
  learningSessionId: string | null;
};

export class LiveVoiceTransport {
  private peer?: RTCPeerConnection;
  private channel?: RTCDataChannel;
  private microphone?: MediaStream;
  private audio: HTMLAudioElement;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private cancelled = false;
  private abort = new AbortController();
  snapshot: VoiceSnapshot = { status: "idle", fragments: [], seconds: 0, finalized: false, error: null, learningSessionId: null };

  constructor(audio: HTMLAudioElement, private onChange: (state: VoiceSnapshot) => void) { this.audio = audio; }

  private update(patch: Partial<VoiceSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.onChange(this.snapshot);
  }
  private send(event: Record<string, unknown>) {
    if (this.channel?.readyState === "open") this.channel.send(JSON.stringify({ event_id: crypto.randomUUID(), ...event }));
  }
  private cleanup() {
    this.cancelled = true;
    this.abort.abort();
    this.timers.forEach(clearTimeout);
    this.microphone?.getTracks().forEach(t => t.stop());
    this.channel?.close();
    this.peer?.close();
    this.audio.pause();
    this.audio.srcObject = null;
  }
  private fail(message: string) {
    if (this.cancelled) return;
    this.update({ status: "error", error: message });
    this.cleanup();
  }
  async start(scenarioId?: string) {
    this.update({ status: "connecting" });
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error("This browser cannot use live voice. Typed practice is available.");
      this.microphone = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (this.cancelled) { this.microphone.getTracks().forEach(t => t.stop()); return; }
      const peer = this.peer = new RTCPeerConnection();
      for (const track of this.microphone.getAudioTracks()) {
        track.onended = () => this.fail("Microphone disconnected. Your learning session is still here.");
        peer.addTrack(track, this.microphone);
      }
      peer.ontrack = e => {
        this.audio.srcObject = new MediaStream([e.track]);
        void this.audio.play().catch(() => this.update({ error: "Press play below to hear Elin." }));
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed" || peer.connectionState === "disconnected") this.fail("Voice connection lost. You can continue without a microphone.");
      };
      this.channel = peer.createDataChannel("oai-events");
      let opening = "Hej! Jag heter Elin. Vad heter du?";
      this.channel.onmessage = ({ data }) => {
        if (this.cancelled) return;
        try {
          const event = JSON.parse(data);
          if (event.type === "session.started") {
            this.update({ status: "live" });
            this.send({ type: "session.instructions.append", delegation_id: null, content: `Greet the learner now in Swedish: ${opening} Then pause and listen patiently.` });
            this.timers.push(setTimeout(() => this.close(), 180000));
          } else if (event.type === "session.input_transcript.delta" || event.type === "session.output_transcript.delta") {
            if (typeof event.delta !== "string" || !Number.isFinite(event.start_ms) || !Number.isFinite(event.end_ms)) return;
            const fragment: VoiceFragment = { id: event.event_id, speaker: event.type === "session.input_transcript.delta" ? "learner" : "elin",
              text: event.delta, startMs: event.start_ms, endMs: event.end_ms };
            this.update({ fragments: appendFragment(this.snapshot.fragments, fragment).slice(-600) });
          } else if (event.type === "session.usage.updated" || event.type === "session.closed") {
            this.update({ seconds: typeof event.usage?.seconds === "number" ? event.usage.seconds : this.snapshot.seconds });
            if (event.type === "session.closed") {
              this.update({ status: "closed", finalized: true });
              this.cleanup();
            }
          } else if (event.type === "error") {
            this.fail("Voice encountered a problem. Continue with listening or typed practice.");
          }
        } catch { this.fail("Voice sent an unreadable response."); }
      };
      this.channel.onclose = () => {
        if (!this.cancelled) this.fail("Voice disconnected before final usage was confirmed.");
      };
      this.timers.push(setTimeout(() => {
        if (this.snapshot.status === "connecting") this.fail("Voice took too long to connect.");
      }, 35000));
      await peer.setLocalDescription(await peer.createOffer());
      if (peer.iceGatheringState !== "complete") await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Microphone connection timed out.")), 10000);
        peer.addEventListener("icegatheringstatechange", () => {
          if (peer.iceGatheringState === "complete") { clearTimeout(timeout); resolve(); }
        });
      });
      if (this.cancelled) return;
      const response = await fetch("/api/voice/session", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: peer.localDescription?.sdp, scenarioId }), signal: this.abort.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Voice could not connect.");
      opening = result.opening;
      this.update({ learningSessionId: result.learningSessionId });
      await peer.setRemoteDescription({ type: "answer", sdp: result.transport.sdp });
    } catch (error) {
      this.fail(error instanceof Error ? error.message : "Microphone unavailable.");
    }
  }
  mute(muted: boolean) {
    this.microphone?.getAudioTracks().forEach(t => { t.enabled = !muted; });
  }
  close() {
    if (this.snapshot.status !== "live") { this.cleanup(); return; }
    this.update({ status: "closing" });
    this.mute(true);
    this.send({ type: "session.close" });
    this.timers.push(setTimeout(() => this.fail("Conversation ended; final usage could not be confirmed."), 15000));
  }
  dispose() {
    if (this.snapshot.learningSessionId && this.snapshot.status !== "closed") {
      const body = JSON.stringify({ sessionId: this.snapshot.learningSessionId, finalized: false,
        seconds: this.snapshot.seconds, fragments: [] });
      const payload = new Blob([body], { type: "application/json" });
      if (!navigator.sendBeacon("/api/voice/finish", payload)) {
        void fetch("/api/voice/finish", { method: "POST", headers: { "Content-Type": "application/json" },
          body, keepalive: true }).catch(() => {});
      }
    }
    this.close();
    // Keep receiving finalization in the background, but release the microphone immediately.
    this.microphone?.getTracks().forEach(t => { t.onended = null; t.stop(); });
  }
}
