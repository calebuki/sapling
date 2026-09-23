import type { Lesson, ListenSpeakItem } from "./course";

// Each pair changes one useful part of a construction in a familiar situation.
export const swedishFoundations = [
  ["vill-ha", "Jag vill ha", "I want", "Jag vill ha kaffe.", "I want coffee.", "Hon vill ha vatten.", "She wants water."],
  ["vet-inte", "Jag vet inte", "I don't know", "Jag vet inte.", "I don't know.", "Hon vet inte.", "She doesn't know."],
  ["det-aer", "Det är", "It is", "Det är kaffe.", "It is coffee.", "Det är vatten.", "It is water."],
  ["har", "Jag har", "I have", "Jag har en bok.", "I have a book.", "Hon har ett hus.", "She has a house."],
  ["kan", "Jag kan", "I can", "Jag kan komma.", "I can come.", "Kan du komma?", "Can you come?"],
  ["behoever", "Jag behöver", "I need", "Jag behöver vatten.", "I need water.", "Vi behöver kaffe.", "We need coffee."],
  ["gillar", "Jag gillar", "I like", "Jag gillar kaffe.", "I like coffee.", "Gillar du te?", "Do you like tea?"],
  ["finns", "Det finns", "There is", "Det finns ett kafé.", "There is a café.", "Det finns en park.", "There is a park."],
  ["v2-idag", "Idag jobbar jag", "Today I work", "Idag jobbar jag hemma.", "Today I work at home.", "Imorgon jobbar hon hemma.", "Tomorrow she works at home."],
  ["negation", "Jag kommer inte", "I'm not coming", "Jag kommer inte idag.", "I'm not coming today.", "Hon jobbar inte idag.", "She isn't working today."],
  ["past-gick", "Igår gick jag", "Yesterday I went", "Igår gick jag hem.", "Yesterday I went home.", "Igår gick hon till skolan.", "Yesterday she went to school."],
  ["perfect-har", "Jag har varit", "I have been", "Jag har varit i Stockholm.", "I have been to Stockholm.", "Har du varit i Stockholm?", "Have you been to Stockholm?"],
] as const;

export const foundationLessons: Lesson[] = swedishFoundations.map((row, index) => ({
  id: `sv-foundation-${row[0]}`,
  number: index + 1,
  title: row[1],
  description: row[2],
  exercises: [{
    conceptSlug: row[0],
    audioId: `sv-foundation-${row[0]}-a`,
    voice: "sv-SE-SofieNeural",
    mode: "guided",
    eyebrow: index < 8 ? "At the café" : "Around town",
    prompt: row[4],
    expected: row[3],
    note: `${row[3]} ${row[4]}`,
  }],
}));

export const foundationListening: ListenSpeakItem[] = swedishFoundations.flatMap((row, index) =>
  [0, 1].map(variant => ({
    id: `sv-foundation-${row[0]}-${variant}`,
    conceptSlug: row[0],
    audioId: `sv-foundation-${row[0]}-${variant === 0 ? "a" : "b"}`,
    voice: variant === 0 ? "sv-SE-SofieNeural" as const : "sv-SE-MattiasNeural" as const,
    text: row[variant === 0 ? 3 : 5],
    meaning: row[variant === 0 ? 4 : 6],
    options: [
      row[variant === 0 ? 4 : 6],
      swedishFoundations[(index + 1) % swedishFoundations.length][4],
      swedishFoundations[(index + 2) % swedishFoundations.length][6],
    ],
  })),
);
