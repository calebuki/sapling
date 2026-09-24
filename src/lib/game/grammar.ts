import type { Line, VillagerId } from "./villagers";

// Short grammar lessons, taught by the villager whose phrases need them. A tip
// opens once enough of that villager's phrases have been met, and the phrases
// it gates stay out of lessons until the tip has been read.

export type GrammarCard = {
  title: Line;
  // Plain-English explanation: grammar is the one place English leads.
  body: string;
  examples: Line[];
};

export type GrammarTip = {
  id: string;
  villager: VillagerId;
  title: Line;
  readyAt: number;
  gates: string[];
  cards: GrammarCard[];
  check: { question: string; options: string[]; answer: string; why: string };
};

export const grammarTips: GrammarTip[] = [
  {
    id: "svenska-101",
    villager: "elin",
    title: { sv: "Svenska 101", en: "Swedish 101" },
    readyAt: 0,
    gates: ["jag-heter", "trevligt-att-traeffas"],
    cards: [
      {
        title: { sv: "Tre extra bokstäver", en: "Three extra letters" },
        body: "Swedish has the same A–Z as English plus å, ä and ö. They are separate vowels, not accented letters: changing one changes the word.",
        examples: [
          { sv: "på", en: "on (å sounds like the 'o' in 'more')" },
          { sv: "är", en: "am / is / are (ä sounds like the 'e' in 'bed')" },
          { sv: "Lilla Ö", en: "Little Island (ö is like 'u' in 'fur')" },
        ],
      },
      {
        title: { sv: "Jag, du, hon, han, vi", en: "I, you, she, he, we" },
        body: "The words for people come first, just like English. Tap the speaker to hear each one.",
        examples: [
          { sv: "jag", en: "I" },
          { sv: "du", en: "you" },
          { sv: "hon / han", en: "she / he" },
          { sv: "vi", en: "we" },
        ],
      },
      {
        title: { sv: "Verbet ändras inte", en: "The verb never changes" },
        body: "Good news: Swedish verbs have one form for everyone. No 'am / is / are' or 'go / goes' to juggle.",
        examples: [
          { sv: "Jag heter Elin.", en: "My name is Elin. (I am called Elin.)" },
          { sv: "Hon heter Stina.", en: "Her name is Stina." },
          { sv: "Vi är på ön.", en: "We are on the island." },
        ],
      },
    ],
    check: {
      question: "How do you say “she is called Astrid”?",
      options: ["Hon heter Astrid.", "Hon heters Astrid.", "Hon hetta Astrid."],
      answer: "Hon heter Astrid.",
      why: "Heter is the same for jag, du, hon and vi.",
    },
  },
  {
    id: "fragor",
    villager: "elin",
    title: { sv: "Att fråga", en: "Asking questions" },
    readyAt: 4,
    gates: ["vad-heter-du"],
    cards: [
      {
        title: { sv: "Verbet först", en: "Verb first for yes/no" },
        body: "To ask a yes/no question, move the verb to the front. No 'do' needed.",
        examples: [
          { sv: "Du är trött.", en: "You are tired." },
          { sv: "Är du trött?", en: "Are you tired?" },
          { sv: "Gillar du kaffe?", en: "Do you like coffee?" },
        ],
      },
      {
        title: { sv: "Frågeord", en: "Question words" },
        body: "With a question word, it goes first, then the verb, then the person.",
        examples: [
          { sv: "Vad heter du?", en: "What are you called?" },
          { sv: "Var är Bosse?", en: "Where is Bosse?" },
          { sv: "Hur mår du?", en: "How are you?" },
        ],
      },
    ],
    check: {
      question: "Turn “Du heter Elin” into a question.",
      options: ["Heter du Elin?", "Du heter Elin?", "Elin du heter?"],
      answer: "Heter du Elin?",
      why: "The verb (heter) jumps to the front.",
    },
  },
  {
    id: "en-ett",
    villager: "bosse",
    title: { sv: "En eller ett?", en: "En or ett?" },
    readyAt: 0,
    gates: ["med-mjoelk", "och-en-kanelbulle"],
    cards: [
      {
        title: { sv: "Två sorters ord", en: "Two kinds of nouns" },
        body: "Every noun is either an en-word or an ett-word. Both mean 'a / an'. Most nouns (about 3 in 4) are en-words, so en is a good guess.",
        examples: [
          { sv: "en kanelbulle", en: "a cinnamon bun" },
          { sv: "en kaffe", en: "a (cup of) coffee" },
          { sv: "ett te", en: "a (cup of) tea" },
        ],
      },
      {
        title: { sv: "”The” sitter på slutet", en: "'The' goes on the end" },
        body: "Swedish glues 'the' onto the end of the word: -en for en-words, -et for ett-words. That's why Bosse says menyn.",
        examples: [
          { sv: "en meny → menyn", en: "a menu → the menu" },
          { sv: "en bulle → bullen", en: "a bun → the bun" },
          { sv: "ett bord → bordet", en: "a table → the table" },
        ],
      },
    ],
    check: {
      question: "Bosse holds up a bun. What does he say?",
      options: ["en kanelbulle", "ett kanelbulle", "kanelbulleet"],
      answer: "en kanelbulle",
      why: "Kanelbulle is an en-word, like most nouns.",
    },
  },
  {
    id: "vill-ha",
    villager: "bosse",
    title: { sv: "Vill ha eller skulle vilja?", en: "Want or would like?" },
    readyAt: 4,
    gates: ["vill-ha", "jag-skulle-vilja", "cafe-order-drink", "cafe-order-food"],
    cards: [
      {
        title: { sv: "Jag vill ha…", en: "I want…" },
        body: "Vill ha + a thing = want. It's direct: fine with friends, a bit blunt with strangers.",
        examples: [
          { sv: "Jag vill ha kaffe.", en: "I want coffee." },
          { sv: "Vill du ha te?", en: "Do you want tea?" },
        ],
      },
      {
        title: { sv: "Jag skulle vilja ha…", en: "I would like…" },
        body: "Skulle vilja ha is the polite version, perfect for ordering. Add tack at the end and Bosse will love you.",
        examples: [
          { sv: "Jag skulle vilja ha en kaffe, tack.", en: "I would like a coffee, please." },
          { sv: "Jag skulle vilja ha en kanelbulle.", en: "I would like a cinnamon bun." },
        ],
      },
    ],
    check: {
      question: "Which is the polite way to order a coffee?",
      options: ["Jag skulle vilja ha en kaffe, tack.", "Kaffe!", "Jag vill kaffe."],
      answer: "Jag skulle vilja ha en kaffe, tack.",
      why: "Skulle vilja ha + tack is polite. “Jag vill kaffe” is missing ha.",
    },
  },
  {
    id: "kan-jag-fa",
    villager: "bosse",
    title: { sv: "Kan jag få…?", en: "Can I have…?" },
    readyAt: 8,
    gates: ["cafe-ask-bill"],
    cards: [
      {
        title: { sv: "Kan jag få…?", en: "Can I get…?" },
        body: "Kan jag få + a thing is the everyday way to ask for something. Kan is followed by a verb in its plain form (få).",
        examples: [
          { sv: "Kan jag få notan?", en: "Can I have the bill?" },
          { sv: "Kan jag få ett glas vatten?", en: "Can I have a glass of water?" },
        ],
      },
    ],
    check: {
      question: "You're done with fika. How do you ask for the bill?",
      options: ["Kan jag få notan?", "Kan jag får notan?", "Jag kan notan?"],
      answer: "Kan jag få notan?",
      why: "After kan the verb stays plain: få, not får.",
    },
  },
  {
    id: "kan-du",
    villager: "stina",
    title: { sv: "Be om hjälp", en: "Asking for help" },
    readyAt: 0,
    gates: ["kan", "kan-du-upprepa", "prata-langsammare"],
    cards: [
      {
        title: { sv: "Kan du…?", en: "Can you…?" },
        body: "Kan du + a plain verb asks someone to do something. It's the most useful pattern on a trip.",
        examples: [
          { sv: "Kan du upprepa det?", en: "Can you repeat that?" },
          { sv: "Kan du prata långsammare?", en: "Can you speak more slowly?" },
          { sv: "Kan du hjälpa mig?", en: "Can you help me?" },
        ],
      },
    ],
    check: {
      question: "Stina talks too fast. What do you say?",
      options: ["Kan du prata långsammare?", "Du kan prata långsammare.", "Kan du pratar långsammare?"],
      answer: "Kan du prata långsammare?",
      why: "Verb first for a question, and the verb after kan stays plain (prata).",
    },
  },
  {
    id: "inte",
    villager: "stina",
    title: { sv: "Inte", en: "Saying 'not'" },
    readyAt: 3,
    gates: ["jag-foerstar-inte"],
    cards: [
      {
        title: { sv: "Inte efter verbet", en: "Inte comes after the verb" },
        body: "Put inte straight after the verb. English needs 'do not'; Swedish just adds inte.",
        examples: [
          { sv: "Jag förstår inte.", en: "I don't understand." },
          { sv: "Tåget går inte idag.", en: "The train isn't running today." },
          { sv: "Jag vet inte.", en: "I don't know." },
        ],
      },
    ],
    check: {
      question: "How do you say “I don't understand”?",
      options: ["Jag förstår inte.", "Jag inte förstår.", "Inte jag förstår."],
      answer: "Jag förstår inte.",
      why: "Inte goes right after the verb förstår.",
    },
  },
  {
    id: "v2",
    villager: "astrid",
    title: { sv: "Verbet på plats två", en: "The verb goes second" },
    readyAt: 0,
    gates: ["v2-idag"],
    cards: [
      {
        title: { sv: "Plats två", en: "Always in second place" },
        body: "In a normal sentence the verb is always the second idea. If you start with a time word like idag, the person moves behind the verb.",
        examples: [
          { sv: "Jag jobbar idag.", en: "I work today." },
          { sv: "Idag jobbar jag.", en: "Today I work." },
          { sv: "Imorgon kommer hon.", en: "Tomorrow she comes." },
        ],
      },
    ],
    check: {
      question: "Start with “Idag”: Today I water the flowers.",
      options: ["Idag vattnar jag blommorna.", "Idag jag vattnar blommorna.", "Jag idag vattnar blommorna."],
      answer: "Idag vattnar jag blommorna.",
      why: "Idag is first, so the verb (vattnar) must be second.",
    },
  },
  {
    id: "dat-tid",
    villager: "astrid",
    title: { sv: "Igår och har varit", en: "Talking about the past" },
    readyAt: 2,
    gates: ["past-gick", "perfect-har"],
    cards: [
      {
        title: { sv: "Igår gick jag", en: "Finished past" },
        body: "For a finished time (igår, i lördags) use the past form. Like the present, it's the same for everyone.",
        examples: [
          { sv: "Igår gick jag hem.", en: "Yesterday I went home." },
          { sv: "Hon gick till skolan.", en: "She went to school." },
        ],
      },
      {
        title: { sv: "Jag har varit", en: "Have been / have done" },
        body: "Har + a special verb form talks about experiences without a set time, like English 'have been'.",
        examples: [
          { sv: "Jag har varit i Stockholm.", en: "I have been to Stockholm." },
          { sv: "Har du varit här förut?", en: "Have you been here before?" },
        ],
      },
    ],
    check: {
      question: "“Yesterday I went to the café.”",
      options: ["Igår gick jag till kaféet.", "Igår jag gick till kaféet.", "Igår har jag gick till kaféet."],
      answer: "Igår gick jag till kaféet.",
      why: "Finished time → gick, and verb second after igår.",
    },
  },
];

export function tipsFor(villager: VillagerId) {
  return grammarTips.filter((tip) => tip.villager === villager);
}

// The next tip a villager should teach before their lesson, if any.
export function pendingTip(villager: VillagerId, met: number, seen: readonly string[]) {
  return tipsFor(villager).find((tip) => !seen.includes(tip.id) && met >= tip.readyAt) ?? null;
}

// Phrases that stay out of lessons until their tip has been read.
export function gatedSlugs(seen: readonly string[]) {
  return new Set(grammarTips.filter((tip) => !seen.includes(tip.id)).flatMap((tip) => tip.gates));
}
