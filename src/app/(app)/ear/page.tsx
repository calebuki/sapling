import { ListenSpeakSession } from "@/components/listen-speak-session";

export const metadata = { title: "Listen & Speak" };

export default function ListenSpeakPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-forest-700/55">
          Listen &amp; Speak
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-5xl leading-[0.98] text-forest-950 sm:text-6xl">
          Hear the thought. Make it yours.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-forest-900/58">
          First understand natural Danish, then repeat it. Listening can always be
          replayed and speaking never blocks your progress.
        </p>
      </div>
      <ListenSpeakSession />
    </div>
  );
}
