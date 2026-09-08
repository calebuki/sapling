import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultAppearance,
  restoreAppearance,
} from "../src/lib/island/appearance.ts";

test("appearance restores valid choices and repairs corrupt or obsolete saved values", () => {
  const selected = {
    ...defaultAppearance,
    skin: "#805039",
    style: "curls",
    shirt: "#6d99b0",
  };
  assert.deepEqual(restoreAppearance(JSON.stringify(selected)), selected);
  assert.deepEqual(restoreAppearance("broken json"), defaultAppearance);
  assert.deepEqual(restoreAppearance(null), defaultAppearance);
  assert.deepEqual(
    restoreAppearance(
      JSON.stringify({ ...selected, skin: "url(bad)", style: "unknown" }),
    ),
    {
      ...selected,
      skin: defaultAppearance.skin,
      style: defaultAppearance.style,
    },
  );
});
