"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type UiSound = "tap" | "advance" | "correct" | "complete";

type UiSoundContextValue = {
  isMuted: boolean;
  playSound: (sound: UiSound) => void;
  toggleMuted: () => void;
};

const STORAGE_KEY = "sapling:ui-sound:v1";
const UiSoundContext = createContext<UiSoundContextValue | null>(null);

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const soundNotes: Record<UiSound, Array<[frequency: number, delay: number]>> = {
  tap: [[310, 0]],
  advance: [
    [330, 0],
    [440, 0.055],
  ],
  correct: [
    [440, 0],
    [554, 0.07],
    [659, 0.14],
  ],
  complete: [
    [392, 0],
    [523, 0.09],
    [659, 0.18],
    [784, 0.29],
  ],
};

export function UiSoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const mutedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const restorePreference = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "muted") {
        mutedRef.current = true;
        setIsMuted(true);
      }
    }, 0);
    return () => window.clearTimeout(restorePreference);
  }, []);

  const playSound = useCallback((sound: UiSound) => {
    if (mutedRef.current) {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    const context =
      audioContextRef.current ?? new AudioContextConstructor({ latencyHint: "interactive" });
    audioContextRef.current = context;
    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;
    const notes = soundNotes[sound];
    const peak = sound === "tap" ? 0.012 : sound === "advance" ? 0.018 : 0.026;

    notes.forEach(([frequency, delay], index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + delay;
      const duration = sound === "tap" ? 0.055 : 0.13 + index * 0.012;

      oscillator.type = sound === "tap" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.985, start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const interactive = target.closest("button:not(:disabled), a[href]");
      if (!interactive || interactive.getAttribute("data-sound") === "none") {
        return;
      }
      playSound("tap");
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [playSound]);

  const toggleMuted = useCallback(() => {
    setIsMuted((current) => {
      const next = !current;
      mutedRef.current = next;
      window.localStorage.setItem(STORAGE_KEY, next ? "muted" : "on");
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ isMuted, playSound, toggleMuted }),
    [isMuted, playSound, toggleMuted],
  );

  return <UiSoundContext.Provider value={value}>{children}</UiSoundContext.Provider>;
}

export function useUiSounds() {
  const context = useContext(UiSoundContext);
  if (!context) {
    throw new Error("useUiSounds must be used within UiSoundProvider");
  }
  return context;
}
