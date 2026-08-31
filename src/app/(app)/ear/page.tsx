import { ListenSpeakSession } from "@/components/listen-speak-session";

export const metadata = { title: "Listen & Speak" };

export default function ListenSpeakPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
      <div className="mb-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/65">Listen &amp; speak</p>
        <h1 className="max-w-3xl font-display text-4xl leading-[1.03] text-forest-950 sm:text-5xl">
          Listen carefully.
        </h1>
      </div>
      <ListenSpeakSession />
    </div>
  );
}
