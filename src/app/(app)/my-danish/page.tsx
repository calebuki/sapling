import { MyDanishView } from "@/components/my-danish-view";

export const metadata = { title: "My Danish" };

export default function MyDanishPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-forest-700/55">
          My Danish
        </p>
        <h1 className="mt-2 font-display text-5xl leading-none text-forest-950 sm:text-6xl">
          What has taken root?
        </h1>
        <p className="mt-5 text-base leading-7 text-forest-900/58">
          Not a list of completed words. This is the current shape of recognition,
          retrieval, production, sound, speed, and range.
        </p>
      </div>
      <MyDanishView />
    </div>
  );
}

