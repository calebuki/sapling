import { Coffee, TrainFront, Utensils } from "lucide-react";

export const metadata = { title: "World" };

const moments = [
  { icon: Coffee, label: "Mød Emil", detail: "A first coffee in Nørrebro" },
  { icon: TrainFront, label: "På vej", detail: "A plan changes at the station" },
  { icon: Utensils, label: "I køkkenet", detail: "Dinner and a small misunderstanding" },
];

export default function WorldPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="grid items-start gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <section>
          <h1 className="max-w-xl font-display text-5xl leading-[0.98] text-forest-950 sm:text-6xl">
            Language with somewhere to return to.
          </h1>
          <div className="mt-8 rounded-[28px] bg-forest-900 p-6 text-cream-50 shadow-2xl shadow-forest-950/15 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div className="grid size-14 place-items-center rounded-[20px] bg-cream-100/10 font-display text-2xl">
                E
              </div>
              <span className="rounded-full bg-cream-100/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-cream-100/65">
                Recurring character
              </span>
            </div>
            <h2 className="mt-8 font-display text-4xl">Emil</h2>
            <p className="mt-3 text-sm leading-6 text-cream-100/62">
              Patient, dryly funny, and always suggesting a different bakery.
              Emil remembers what happened yesterday—even when you need the same
              Danish again today.
            </p>
          </div>
        </section>

        <section className="paper-panel rounded-[28px] p-6 sm:p-8">
          <div className="relative space-y-3 before:absolute before:bottom-8 before:left-[19px] before:top-8 before:w-px before:bg-forest-900/12">
            {moments.map(({ icon: Icon, label, detail }, index) => (
              <div
                className="relative flex items-center gap-4 rounded-[22px] bg-white/50 p-4"
                key={label}
              >
                <span className="z-10 grid size-10 shrink-0 place-items-center rounded-full border border-forest-900/10 bg-cream-50 text-forest-800">
                  <Icon aria-hidden="true" size={17} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest-700/42">
                    Encounter {index + 1}
                  </p>
                  <h3 className="mt-0.5 font-display text-2xl text-forest-950">
                    {label}
                  </h3>
                  <p className="mt-0.5 text-sm text-forest-900/52">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
