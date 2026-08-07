import { AudioLines, Ear, Radio, Volume2 } from "lucide-react";

export const metadata = { title: "Ear" };

const listeningPath = [
  "Isolated words",
  "Careful speech",
  "Normal sentences",
  "Natural conversation",
  "Unfamiliar speakers",
  "Reduced Danish",
  "Conversations",
  "Noisy environments",
];

export default function EarPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-forest-700/55">
            Ear
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-5xl leading-[0.98] text-forest-950 sm:text-6xl">
            Learn the Danish people actually say.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-forest-900/58">
            Listening evidence will stay separate from reading. The first real
            Ear session will begin with controlled speech, then earn its way
            toward reduction, new voices, conversation, and noise.
          </p>

          <div className="paper-panel mt-8 rounded-[28px] p-6">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-moss-400/18 text-forest-800">
                <Ear aria-hidden="true" size={22} />
              </span>
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-500">
                Next slice
              </span>
            </div>
            <h2 className="mt-6 font-display text-3xl text-forest-950">
              blødt d
            </h2>
            <p className="mt-2 text-sm leading-6 text-forest-900/55">
              Hear one sound across several familiar words, then identify it
              without seeing the spelling first.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[Volume2, AudioLines, Radio].map((Icon, index) => (
                <div
                  className="grid h-16 place-items-center rounded-2xl bg-forest-900/[0.045] text-forest-700/45"
                  key={index}
                >
                  <Icon aria-hidden="true" size={19} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="paper-panel rounded-[28px] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest-700/50">
            Listening ladder
          </p>
          <ol className="mt-6 space-y-2">
            {listeningPath.map((label, index) => (
              <li
                className={`flex items-center gap-4 rounded-2xl p-3.5 ${
                  index === 0
                    ? "bg-forest-900 text-cream-50"
                    : "bg-white/40 text-forest-900/55"
                }`}
                key={label}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    index === 0 ? "bg-cream-100/15" : "bg-forest-900/5"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-sm font-semibold">{label}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs leading-5 text-forest-900/43">
            This is an evidence progression, not a locked unit path. Sapling can
            move between levels concept by concept.
          </p>
        </section>
      </div>
    </div>
  );
}

