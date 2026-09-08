export const appearanceOptions = {
  skin: ["#edc7a3", "#dba77b", "#b97b55", "#805039", "#51382e"],
  hair: ["#49352c", "#93613d", "#d6b36a", "#251f24", "#c6beba"],
  shirt: ["#9373d5", "#769e81", "#c47660", "#6d99b0", "#e2ba62"],
  style: ["short", "bob", "curls"],
} as const;
export type Appearance = {
  skin: string;
  hair: string;
  shirt: string;
  style: "short" | "bob" | "curls";
};
export const defaultAppearance: Appearance = {
  skin: appearanceOptions.skin[0],
  hair: appearanceOptions.hair[0],
  shirt: appearanceOptions.shirt[0],
  style: "short",
};
export const elinAppearance: Appearance = {
  skin: "#edc7a3",
  hair: "#93613d",
  shirt: "#769e81",
  style: "bob",
};
export function restoreAppearance(raw: string | null): Appearance {
  try {
    const value = JSON.parse(raw ?? "null");
    return Object.fromEntries(
      Object.entries(appearanceOptions).map(([key, options]) => [
        key,
        (options as readonly string[]).includes(value?.[key])
          ? value[key]
          : defaultAppearance[key as keyof Appearance],
      ]),
    ) as Appearance;
  } catch {
    return { ...defaultAppearance };
  }
}
