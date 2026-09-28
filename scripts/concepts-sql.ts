// Writes the SQL that upserts a course's concepts into Supabase, so signed-in
// learners have a row to attach evidence to for every phrase the island
// teaches. Run with `npm run content:sql -- de sv > supabase/migrations/…sql`.
//
// Existing rows keep any metadata and written descriptions they already had;
// forms, glosses, level, unit and course order are refreshed from the content.

import { getCourse } from "../src/content/courses";
import { isTargetLanguageCode } from "../src/lib/learning/languages";

const codes = process.argv.slice(2);
if (!codes.length || !codes.every(isTargetLanguageCode)) throw new Error("Usage: content:sql <language> [language…]");

const quote = (text: string) => `'${text.replaceAll("'", "''")}'`;

const out: string[] = [];
for (const code of codes) {
  const { concepts } = getCourse(code);
  if (!concepts.length) continue;
  out.push(`-- ${code}: ${concepts.length} concepts, in course order.`);
  out.push("insert into public.concepts (language_code, slug, kind, canonical_form, gloss, description, metadata, sort_order, is_active)");
  out.push("values");
  out.push(
    concepts
      .map((c, i) => {
        const metadata = JSON.stringify({ level: c.level, unit: c.unit });
        return `  (${[quote(code), quote(c.slug), quote(c.kind), quote(c.canonicalForm), quote(c.gloss), quote(c.description), `${quote(metadata)}::jsonb`, i + 1, "true"].join(", ")})`;
      })
      .join(",\n"),
  );
  out.push("on conflict (language_code, slug) do update");
  out.push("set");
  out.push("  kind = excluded.kind,");
  out.push("  canonical_form = excluded.canonical_form,");
  out.push("  gloss = excluded.gloss,");
  // A description that only repeats the gloss doesn't replace one someone wrote.
  out.push("  description = coalesce(nullif(excluded.description, excluded.gloss), public.concepts.description, excluded.description),");
  out.push("  metadata = public.concepts.metadata || excluded.metadata,");
  out.push("  sort_order = excluded.sort_order,");
  out.push("  is_active = true,");
  out.push("  updated_at = now();");
  out.push("");
}
process.stdout.write(out.join("\n"));
