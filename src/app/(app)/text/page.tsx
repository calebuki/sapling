import { ReadWriteSession } from "@/components/read-write-session";

export const metadata = { title: "Read & Write" };

export default function ReadWritePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mb-8">
        <h1 className="max-w-3xl font-display text-5xl leading-[0.98] text-forest-950 sm:text-6xl">
          Read it. Make it yours.
        </h1>
      </div>
      <ReadWriteSession />
    </div>
  );
}
