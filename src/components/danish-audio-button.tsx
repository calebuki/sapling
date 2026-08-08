"use client";

import { CircleAlert, Gauge, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getSpeechAudioUrl } from "@/lib/learning/course";

type DanishAudioButtonProps = {
  clipId: string;
  label?: string;
  onPlay?: () => void;
  showSlowControl?: boolean;
};

export function DanishAudioButton({
  clipId,
  label = "Hear it",
  onPlay,
  showSlowControl = false,
}: DanishAudioButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function play() {
    setError(null);

    if (!audioRef.current) {
      const audioUrl = getSpeechAudioUrl(clipId);
      if (!audioUrl) {
        setError("Audio is unavailable right now.");
        return;
      }

      const audio = new Audio(audioUrl);
      audio.preload = "none";
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setError("Audio is unavailable right now.");
      };
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    audio.playbackRate = isSlow ? 0.78 : 1;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.currentTime = 0;
    void audio
      .play()
      .then(() => {
        setHasPlayed(true);
        setIsPlaying(true);
        onPlay?.();
      })
      .catch(() => setError("Audio is unavailable right now."));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        aria-label={isPlaying ? "Pause Danish audio" : label}
        className="inline-flex items-center gap-2 rounded-2xl border border-forest-900/12 bg-white/75 px-4 py-2.5 text-sm font-bold text-forest-900 transition hover:bg-white"
        onClick={play}
        type="button"
      >
        {isPlaying ? (
          <Pause aria-hidden="true" size={16} />
        ) : hasPlayed ? (
          <RotateCcw aria-hidden="true" size={16} />
        ) : (
          <Play aria-hidden="true" size={16} />
        )}
        {isPlaying ? "Playing" : hasPlayed ? "Replay" : label}
      </button>

      {showSlowControl ? (
        <button
          aria-pressed={isSlow}
          className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
            isSlow
              ? "bg-moss-400/20 text-forest-900"
              : "text-forest-900/55 hover:bg-white/60"
          }`}
          onClick={() => setIsSlow((current) => !current)}
          type="button"
        >
          <Gauge aria-hidden="true" size={15} />
          Slower
        </button>
      ) : null}

      {error ? (
        <span className="flex items-center gap-1.5 text-xs text-clay-500">
          <CircleAlert aria-hidden="true" size={14} />
          {error}
        </span>
      ) : null}
    </div>
  );
}
