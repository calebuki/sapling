import { MyDanishView } from "@/components/my-danish-view";

export const metadata = { title: "My Danish" };

export default function MyDanishPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mb-8">
        <h1 className="font-display text-5xl leading-none text-forest-950 sm:text-6xl">
          What has taken root?
        </h1>
      </div>
      <MyDanishView />
    </div>
  );
}
