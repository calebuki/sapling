import type { GrammarTip } from "@/lib/game/grammar";

// Short grammar lessons for the Swedish course, each opened by the unit whose
// phrases need it.

export const grammarTips: GrammarTip[] = [
  {
    id: "svenska-101",
    unit: "hej",
    title: { t: "Svenska 101", en: "Swedish 101" },
    readyAt: 0,
    gates: ["jag-heter", "trevligt-att-traeffas"],
    cards: [
      {
        title: { t: "Tre extra bokstäver", en: "Three extra letters" },
        body: "Swedish has the same A–Z as English plus å, ä and ö. They are separate vowels, not accented letters: changing one changes the word.",
        examples: [
          { t: "på", en: "on (å sounds like the 'o' in 'more')" },
          { t: "är", en: "am / is / are (ä sounds like the 'e' in 'bed')" },
          { t: "Lilla Ö", en: "Little Island (ö is like 'u' in 'fur')" },
        ],
      },
      {
        title: { t: "Jag, du, hon, han, vi", en: "I, you, she, he, we" },
        body: "The words for people come first, just like English. Tap the speaker to hear each one.",
        examples: [
          { t: "jag", en: "I" },
          { t: "du", en: "you" },
          { t: "hon / han", en: "she / he" },
          { t: "vi", en: "we" },
        ],
      },
      {
        title: { t: "Verbet ändras inte", en: "The verb never changes" },
        body: "Good news: Swedish verbs have one form for everyone. No 'am / is / are' or 'go / goes' to juggle.",
        examples: [
          { t: "Jag heter Elin.", en: "My name is Elin. (I am called Elin.)" },
          { t: "Hon heter Stina.", en: "Her name is Stina." },
          { t: "Vi är på ön.", en: "We are on the island." },
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
    unit: "hej",
    title: { t: "Att fråga", en: "Asking questions" },
    readyAt: 4,
    gates: ["vad-heter-du"],
    cards: [
      {
        title: { t: "Verbet först", en: "Verb first for yes/no" },
        body: "To ask a yes/no question, move the verb to the front. No 'do' needed.",
        examples: [
          { t: "Du är trött.", en: "You are tired." },
          { t: "Är du trött?", en: "Are you tired?" },
          { t: "Gillar du kaffe?", en: "Do you like coffee?" },
        ],
      },
      {
        title: { t: "Frågeord", en: "Question words" },
        body: "With a question word, it goes first, then the verb, then the person.",
        examples: [
          { t: "Vad heter du?", en: "What are you called?" },
          { t: "Var är Bosse?", en: "Where is Bosse?" },
          { t: "Hur mår du?", en: "How are you?" },
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
    unit: "fika",
    title: { t: "En eller ett?", en: "En or ett?" },
    readyAt: 0,
    gates: ["med-mjoelk", "och-en-kanelbulle"],
    cards: [
      {
        title: { t: "Två sorters ord", en: "Two kinds of nouns" },
        body: "Every noun is either an en-word or an ett-word. Both mean 'a / an'. Most nouns (about 3 in 4) are en-words, so en is a good guess.",
        examples: [
          { t: "en kanelbulle", en: "a cinnamon bun" },
          { t: "en kaffe", en: "a (cup of) coffee" },
          { t: "ett te", en: "a (cup of) tea" },
        ],
      },
      {
        title: { t: "”The” sitter på slutet", en: "'The' goes on the end" },
        body: "Swedish glues 'the' onto the end of the word: -en for en-words, -et for ett-words. That's why Bosse says menyn.",
        examples: [
          { t: "en meny → menyn", en: "a menu → the menu" },
          { t: "en bulle → bullen", en: "a bun → the bun" },
          { t: "ett bord → bordet", en: "a table → the table" },
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
    unit: "fika",
    title: { t: "Vill ha eller skulle vilja?", en: "Want or would like?" },
    readyAt: 4,
    gates: ["vill-ha", "jag-skulle-vilja", "cafe-order-drink", "cafe-order-food"],
    cards: [
      {
        title: { t: "Jag vill ha…", en: "I want…" },
        body: "Vill ha + a thing = want. It's direct: fine with friends, a bit blunt with strangers.",
        examples: [
          { t: "Jag vill ha kaffe.", en: "I want coffee." },
          { t: "Vill du ha te?", en: "Do you want tea?" },
        ],
      },
      {
        title: { t: "Jag skulle vilja ha…", en: "I would like…" },
        body: "Skulle vilja ha is the polite version, perfect for ordering. Add tack at the end and Bosse will love you.",
        examples: [
          { t: "Jag skulle vilja ha en kaffe, tack.", en: "I would like a coffee, please." },
          { t: "Jag skulle vilja ha en kanelbulle.", en: "I would like a cinnamon bun." },
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
    unit: "fika",
    title: { t: "Kan jag få…?", en: "Can I have…?" },
    readyAt: 8,
    gates: ["cafe-ask-bill"],
    cards: [
      {
        title: { t: "Kan jag få…?", en: "Can I get…?" },
        body: "Kan jag få + a thing is the everyday way to ask for something. Kan is followed by a verb in its plain form (få).",
        examples: [
          { t: "Kan jag få notan?", en: "Can I have the bill?" },
          { t: "Kan jag få ett glas vatten?", en: "Can I have a glass of water?" },
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
    unit: "resan",
    title: { t: "Be om hjälp", en: "Asking for help" },
    readyAt: 0,
    gates: ["kan", "kan-du-upprepa", "prata-langsammare"],
    cards: [
      {
        title: { t: "Kan du…?", en: "Can you…?" },
        body: "Kan du + a plain verb asks someone to do something. It's the most useful pattern on a trip.",
        examples: [
          { t: "Kan du upprepa det?", en: "Can you repeat that?" },
          { t: "Kan du prata långsammare?", en: "Can you speak more slowly?" },
          { t: "Kan du hjälpa mig?", en: "Can you help me?" },
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
    unit: "resan",
    title: { t: "Inte", en: "Saying 'not'" },
    readyAt: 3,
    gates: ["jag-foerstar-inte"],
    cards: [
      {
        title: { t: "Inte efter verbet", en: "Inte comes after the verb" },
        body: "Put inte straight after the verb. English needs 'do not'; Swedish just adds inte.",
        examples: [
          { t: "Jag förstår inte.", en: "I don't understand." },
          { t: "Tåget går inte idag.", en: "The train isn't running today." },
          { t: "Jag vet inte.", en: "I don't know." },
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
    unit: "planer",
    title: { t: "Verbet på plats två", en: "The verb goes second" },
    readyAt: 0,
    gates: ["v2-idag"],
    cards: [
      {
        title: { t: "Plats två", en: "Always in second place" },
        body: "In a normal sentence the verb is always the second idea. If you start with a time word like idag, the person moves behind the verb.",
        examples: [
          { t: "Jag jobbar idag.", en: "I work today." },
          { t: "Idag jobbar jag.", en: "Today I work." },
          { t: "Imorgon kommer hon.", en: "Tomorrow she comes." },
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
    unit: "planer",
    title: { t: "Igår och har varit", en: "Talking about the past" },
    readyAt: 2,
    gates: ["past-gick", "perfect-har"],
    cards: [
      {
        title: { t: "Igår gick jag", en: "Finished past" },
        body: "For a finished time (igår, i lördags) use the past form. Like the present, it's the same for everyone.",
        examples: [
          { t: "Igår gick jag hem.", en: "Yesterday I went home." },
          { t: "Hon gick till skolan.", en: "She went to school." },
        ],
      },
      {
        title: { t: "Jag har varit", en: "Have been / have done" },
        body: "Har + a special verb form talks about experiences without a set time, like English 'have been'.",
        examples: [
          { t: "Jag har varit i Stockholm.", en: "I have been to Stockholm." },
          { t: "Har du varit här förut?", en: "Have you been here before?" },
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
