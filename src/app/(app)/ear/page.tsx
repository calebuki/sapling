import { ListenSpeakSession } from "@/components/listen-speak-session";

export const metadata = { title: "Listen & Speak" };

export default function ListenSpeakPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mb-8">
        <h1 className="max-w-3xl font-display text-5xl leading-[0.98] text-forest-950 sm:text-6xl">
          Hear it. Say it.
        </h1>
      </div>
      <ListenSpeakSession />
    </div>
  );
}
