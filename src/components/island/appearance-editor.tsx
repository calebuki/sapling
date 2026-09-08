"use client";
import { appearanceOptions, type Appearance } from "@/lib/island/appearance";
import { CharacterScene } from "./character-scene";

const names = {
  skin: "Skin tone",
  hair: "Hair color",
  shirt: "Outfit color",
  style: "Hair style",
};
export function AppearanceEditor({
  value,
  onChange,
}: {
  value: Appearance;
  onChange: (value: Appearance) => void;
}) {
  return (
    <section className="appearance-editor" aria-label="Character customization">
      <h3>Your character</h3>
      <CharacterScene appearance={value} />
      {(Object.keys(appearanceOptions) as (keyof Appearance)[]).map((key) => (
        <fieldset key={key}>
          <legend>{names[key]}</legend>
          <div className="appearance-options">
            {appearanceOptions[key].map((option, i) => (
              <button
                key={option}
                type="button"
                aria-label={key === "style" ? option : `${names[key]} ${i + 1}`}
                aria-pressed={value[key] === option}
                style={
                  key === "style" ? undefined : { backgroundColor: option }
                }
                onClick={() => onChange({ ...value, [key]: option })}
              >
                {key === "style" ? option : value[key] === option ? "✓" : ""}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <small>Saved on this browser.</small>
    </section>
  );
}
