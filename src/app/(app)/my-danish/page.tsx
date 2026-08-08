import { MyDanishView } from "@/components/my-danish-view";

export const metadata = { title: "Mit dansk" };

export default function MyDanishPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-forest-700/55">
          Mit dansk · My Danish
        </p>
        <h1 className="font-display text-5xl leading-none text-forest-950 sm:text-6xl">
          Se, hvad der vokser.
        </h1>
        <p className="mt-3 text-sm text-forest-900/52">
          See what is growing.
        </p>
      </div>
      <MyDanishView />
    </div>
  );
}
