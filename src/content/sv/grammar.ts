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
  {
    id: "du",
    unit: "hejsan",
    title: { t: "Alla är du", en: "Everyone is du" },
    readyAt: 4,
    gates: ["god-dag"],
    cards: [
      {
        title: { t: "Du till alla", en: "One 'you' for everyone" },
        body: "Swedes say du to everyone: friends, strangers, the doctor, the king's gardener. The formal ni is almost never used for one person, and God dag sounds a little old-fashioned. Hej works almost everywhere.",
        examples: [
          { t: "Hej! Hur mår du?", en: "Hi! How are you? (to anyone)" },
          { t: "God dag och välkommen!", en: "Good day and welcome! (formal, a bit old-fashioned)" },
          { t: "Ni", en: "you (to more than one person)" },
        ],
      },
    ],
    check: {
      question: "You meet an elderly stranger. What's the natural greeting?",
      options: ["Hej! Hur mår du?", "God dag! Hur mår ni?", "Tjena! Läget?"],
      answer: "Hej! Hur mår du?",
      why: "Swedes use hej and du with everyone; tjena is for friends.",
    },
  },
  {
    id: "pronomen",
    unit: "vem",
    title: { t: "Jag och mig", en: "I and me" },
    readyAt: 5,
    gates: ["ni", "de"],
    cards: [
      {
        title: { t: "Vem gör något?", en: "Who does something" },
        body: "Like English I/me and he/him, Swedish words for people change when something is done to them.",
        examples: [
          { t: "jag → mig", en: "I → me" },
          { t: "du → dig", en: "you → you" },
          { t: "han → honom, hon → henne", en: "he → him, she → her" },
          { t: "vi → oss, ni → er, de → dem", en: "we → us, you all → you, they → them" },
        ],
      },
      {
        title: { t: "Man säger dom", en: "Said 'dom'" },
        body: "De (they) and dem (them) are both said dom. Mig and dig are said 'mej' and 'dej'.",
        examples: [
          { t: "De bor här.", en: "They live here. (said: dom bor här)" },
          { t: "Kan du hjälpa mig?", en: "Can you help me? (said: mej)" },
        ],
      },
    ],
    check: {
      question: "“Can you help me?”",
      options: ["Kan du hjälpa mig?", "Kan du hjälpa jag?", "Kan dig hjälpa mig?"],
      answer: "Kan du hjälpa mig?",
      why: "Du does the helping; mig is the one being helped.",
    },
  },
  {
    id: "siffror",
    unit: "siffror",
    title: { t: "Att räkna", en: "Counting" },
    readyAt: 10,
    gates: ["tjugofem", "sextio"],
    cards: [
      {
        title: { t: "Tretton till nitton", en: "Thirteen to nineteen" },
        body: "Like English -teen, most of them end in -ton.",
        examples: [
          { t: "tretton, fjorton, femton", en: "thirteen, fourteen, fifteen" },
          { t: "sexton, sjutton, arton, nitton", en: "sixteen, seventeen, eighteen, nineteen" },
        ],
      },
      {
        title: { t: "Tjugofem", en: "Twenty-five" },
        body: "Tens end in -tio (said 'ti'), and bigger numbers are written as one word: twenty + five = tjugofem.",
        examples: [
          { t: "tjugo, trettio, fyrtio, femtio", en: "twenty, thirty, forty, fifty" },
          { t: "tjugofem", en: "twenty-five" },
          { t: "hundrafemtio", en: "a hundred and fifty" },
        ],
      },
    ],
    check: {
      question: "How do you write 35?",
      options: ["trettiofem", "femtrettio", "tretton fem"],
      answer: "trettiofem",
      why: "Tens first, then the ones, all in one word.",
    },
  },
  {
    id: "min-mitt-mina",
    unit: "familj",
    title: { t: "Min, mitt, mina", en: "My, your, our" },
    readyAt: 6,
    gates: ["din-ditt-dina", "vaar"],
    cards: [
      {
        title: { t: "Som en och ett", en: "Follows en and ett" },
        body: "'My' matches the thing you have: min for en-words, mitt for ett-words, mina for more than one. Din (your) and vår (our) work the same way.",
        examples: [
          { t: "en bror → min bror", en: "a brother → my brother" },
          { t: "ett barn → mitt barn", en: "a child → my child" },
          { t: "två systrar → mina systrar", en: "two sisters → my sisters" },
          { t: "vår katt, vårt hus, våra barn", en: "our cat, our house, our children" },
        ],
      },
      {
        title: { t: "Hans och hennes", en: "His and her never change" },
        body: "Hans (his) and hennes (her) stay the same whatever follows.",
        examples: [
          { t: "hans syster, hans barn", en: "his sister, his child" },
          { t: "hennes son, hennes föräldrar", en: "her son, her parents" },
        ],
      },
    ],
    check: {
      question: "“My child” (ett barn)",
      options: ["mitt barn", "min barn", "mina barn"],
      answer: "mitt barn",
      why: "Barn is an ett-word, so 'my' is mitt.",
    },
  },
  {
    id: "slutet",
    unit: "mat",
    title: { t: "The på slutet", en: "'The' goes on the end" },
    readyAt: 6,
    gates: ["god", "varm", "kall"],
    cards: [
      {
        title: { t: "Maten, brödet", en: "The food, the bread" },
        body: "Swedish has no separate word for 'the'. It sticks to the end of the word: -en for en-words, -et for ett-words.",
        examples: [
          { t: "en macka → mackan", en: "a sandwich → the sandwich" },
          { t: "en ost → osten", en: "a cheese → the cheese" },
          { t: "ett ägg → ägget", en: "an egg → the egg" },
          { t: "Maten är god.", en: "The food is good." },
        ],
      },
    ],
    check: {
      question: "“The egg is warm.” (ett ägg)",
      options: ["Ägget är varmt.", "Det ägg är varmt.", "Äggen är varmt."],
      answer: "Ägget är varmt.",
      why: "Ett ägg → ägget: the -et goes on the end.",
    },
  },
  {
    id: "halv-fyra",
    unit: "klockan",
    title: { t: "Halv fyra", en: "Half past, the Swedish way" },
    readyAt: 5,
    gates: ["halv", "kvart-oever", "kvart-i"],
    cards: [
      {
        title: { t: "Halv till nästa", en: "Half to the next hour" },
        body: "Halv counts towards the next hour: halv fyra is 3:30, half way to four. Kvart över is quarter past, kvart i is quarter to.",
        examples: [
          { t: "Klockan är halv fyra.", en: "It's 3:30." },
          { t: "Klockan är kvart över två.", en: "It's 2:15." },
          { t: "Klockan är kvart i sex.", en: "It's 5:45." },
        ],
      },
      {
        title: { t: "Små bokstäver", en: "Lower case days" },
        body: "Days and months start with a small letter, and 'on Monday' is på måndag.",
        examples: [
          { t: "på måndag", en: "on Monday" },
          { t: "i juli", en: "in July" },
        ],
      },
    ],
    check: {
      question: "The clock says 9:30. What time is it?",
      options: ["Klockan är halv tio.", "Klockan är halv nio.", "Klockan är nio halv."],
      answer: "Klockan är halv tio.",
      why: "Half way to ten: halv tio.",
    },
  },
  {
    id: "den-har",
    unit: "handla",
    title: { t: "Den här, det här", en: "This one" },
    readyAt: 4,
    gates: ["den-haer"],
    cards: [
      {
        title: { t: "Här och där", en: "This and that" },
        body: "Point at things with den här (en-words) or det här (ett-words). Further away, use där instead of här. The noun after it takes its 'the' ending too.",
        examples: [
          { t: "den här osten", en: "this cheese" },
          { t: "det här vykortet", en: "this postcard" },
          { t: "Jag tar den där.", en: "I'll take that one." },
        ],
      },
    ],
    check: {
      question: "“I'll take this postcard.” (ett vykort)",
      options: ["Jag tar det här vykortet.", "Jag tar den här vykortet.", "Jag tar det här vykort."],
      answer: "Jag tar det här vykortet.",
      why: "Vykort is an ett-word, so det här … vykortet.",
    },
  },
  {
    id: "ligger-star",
    unit: "hemma",
    title: { t: "Ligger och står", en: "Lying and standing" },
    readyAt: 8,
    gates: ["ligger", "staar"],
    cards: [
      {
        title: { t: "Var är den?", en: "Where is it?" },
        body: "Swedes often say how something is placed: flat things ligger (lie), upright things står (stand). Är is fine too, but this sounds natural.",
        examples: [
          { t: "Boken ligger på bordet.", en: "The book is (lying) on the table." },
          { t: "Lampan står på bordet.", en: "The lamp is (standing) on the table." },
          { t: "Katten ligger i soffan.", en: "The cat is lying on the sofa." },
        ],
      },
      {
        title: { t: "Hemma eller hem?", en: "At home, or going home?" },
        body: "Hemma is where you are; hem is where you're going.",
        examples: [
          { t: "Jag är hemma.", en: "I'm at home." },
          { t: "Jag går hem.", en: "I'm going home." },
        ],
      },
    ],
    check: {
      question: "The key is lying on the table.",
      options: ["Nyckeln ligger på bordet.", "Nyckeln står på bordet.", "Nyckeln hemma på bordet."],
      answer: "Nyckeln ligger på bordet.",
      why: "A key lies flat, so it ligger.",
    },
  },
  {
    id: "imperativ",
    unit: "vaegen",
    title: { t: "Gå! Sväng!", en: "Telling someone what to do" },
    readyAt: 4,
    gates: ["svaeng", "gaa"],
    cards: [
      {
        title: { t: "Kort och snällt", en: "Short, not rude" },
        body: "Instructions use the verb's short form: drop the -r from the present. It isn't rude; add gärna or tack to soften it.",
        examples: [
          { t: "Du går → Gå!", en: "You go → Go!" },
          { t: "Du svänger → Sväng!", en: "You turn → Turn!" },
          { t: "Du tittar → Titta!", en: "You look → Look!" },
          { t: "Sväng höger vid kaféet.", en: "Turn right at the café." },
        ],
      },
    ],
    check: {
      question: "“Turn left!”",
      options: ["Sväng till vänster!", "Svänger till vänster!", "Du sväng till vänster!"],
      answer: "Sväng till vänster!",
      why: "Svänger → sväng for an instruction.",
    },
  },
  {
    id: "adjektiv",
    unit: "klaeder",
    title: { t: "Röd, rött, röda", en: "Colours change too" },
    readyAt: 12,
    gates: ["gul", "vit", "graa"],
    cards: [
      {
        title: { t: "En, ett, flera", en: "En, ett, more than one" },
        body: "Describing words match the noun: nothing extra for en-words, -t for ett-words, -a for more than one (and after 'the').",
        examples: [
          { t: "en röd jacka", en: "a red jacket" },
          { t: "ett rött hus", en: "a red house" },
          { t: "röda skor", en: "red shoes" },
          { t: "den röda jackan", en: "the red jacket" },
        ],
      },
    ],
    check: {
      question: "“A yellow house” (ett hus)",
      options: ["ett gult hus", "ett gul hus", "ett gula hus"],
      answer: "ett gult hus",
      why: "Hus is an ett-word, so the colour gets -t: gult.",
    },
  },
  {
    id: "det-regnar",
    unit: "vaedret",
    title: { t: "Det regnar", en: "It rains" },
    readyAt: 3,
    gates: ["det-snoear", "paa-sommaren"],
    cards: [
      {
        title: { t: "Det som i 'it'", en: "Det, like 'it'" },
        body: "Weather starts with det, just like English 'it'.",
        examples: [
          { t: "Det regnar.", en: "It's raining." },
          { t: "Det snöar.", en: "It's snowing." },
          { t: "Det är kallt.", en: "It's cold." },
        ],
      },
      {
        title: { t: "På sommaren", en: "In summer" },
        body: "Seasons in general take på and the -en ending. For this coming season, use i: i sommar.",
        examples: [
          { t: "På sommaren badar vi.", en: "In summer we swim." },
          { t: "I sommar ska jag resa.", en: "This summer I'm going to travel." },
        ],
      },
    ],
    check: {
      question: "“In winter it snows.”",
      options: ["På vintern snöar det.", "I vinter det snöar.", "På vintern det snöar."],
      answer: "På vintern snöar det.",
      why: "På vintern = in winter generally; then the verb comes second.",
    },
  },
  {
    id: "att",
    unit: "fritid",
    title: { t: "Gillar att läsa", en: "Like to read" },
    readyAt: 3,
    gates: ["jag-tycker-om", "jag-aer-bra-paa"],
    cards: [
      {
        title: { t: "Att + verb", en: "Att + verb" },
        body: "After gillar, tycker om and bra på, a second verb takes att, like English 'to'.",
        examples: [
          { t: "Jag gillar att läsa.", en: "I like reading." },
          { t: "Jag tycker om att fiska.", en: "I like fishing." },
          { t: "Hon är bra på att simma.", en: "She's good at swimming." },
        ],
      },
      {
        title: { t: "Utan att", en: "No att after kan, vill, ska" },
        body: "Kan, vill, ska and måste take the next verb straight away.",
        examples: [
          { t: "Jag kan simma.", en: "I can swim." },
          { t: "Vill du dansa?", en: "Do you want to dance?" },
        ],
      },
    ],
    check: {
      question: "“I like dancing.”",
      options: ["Jag gillar att dansa.", "Jag gillar dansa.", "Jag att gillar dansa."],
      answer: "Jag gillar att dansa.",
      why: "Gillar + att + the verb.",
    },
  },
  {
    id: "ont-i",
    unit: "haelsa",
    title: { t: "Ont i huvudet", en: "Where it hurts" },
    readyAt: 4,
    gates: ["halsen", "ryggen", "tanden"],
    cards: [
      {
        title: { t: "Ha ont i", en: "Have pain in" },
        body: "Swedes 'have pain in the …': har ont i plus the body part with its 'the' ending, never 'my'.",
        examples: [
          { t: "Jag har ont i huvudet.", en: "I have a headache." },
          { t: "Jag har ont i magen.", en: "My stomach hurts." },
          { t: "Har du ont i halsen?", en: "Do you have a sore throat?" },
        ],
      },
    ],
    check: {
      question: "“My back hurts.” (ryggen)",
      options: ["Jag har ont i ryggen.", "Min rygg har ont.", "Jag har ont min rygg."],
      answer: "Jag har ont i ryggen.",
      why: "Har ont i + ryggen (the back).",
    },
  },
  {
    id: "yrken",
    unit: "jobb",
    title: { t: "Jag är lärare", en: "Jobs without 'a'" },
    readyAt: 3,
    gates: ["en-sjukskoeterska", "en-fiskare"],
    cards: [
      {
        title: { t: "Inget en", en: "No 'a' before a job" },
        body: "Saying what someone does, Swedish drops the en/ett that English needs.",
        examples: [
          { t: "Jag är lärare.", en: "I'm a teacher." },
          { t: "Karin är sjuksköterska.", en: "Karin is a nurse." },
          { t: "Han jobbar som fiskare.", en: "He works as a fisherman." },
        ],
      },
    ],
    check: {
      question: "“Nils is a fisherman.”",
      options: ["Nils är fiskare.", "Nils är en fiskare.", "Nils fiskare är."],
      answer: "Nils är fiskare.",
      why: "No en before a job.",
    },
  },
  {
    id: "preteritum",
    unit: "igaar",
    title: { t: "Pratade, läste, var", en: "The past, verb by verb" },
    readyAt: 4,
    gates: ["jag-traeffade", "jag-pratade-med", "jag-bodde"],
    cards: [
      {
        title: { t: "-ade och -de", en: "Regular endings" },
        body: "Most verbs add -ade (from -ar), or -de/-te (from -er). Same form for everyone.",
        examples: [
          { t: "pratar → pratade", en: "talk → talked" },
          { t: "träffar → träffade", en: "meet → met" },
          { t: "läser → läste", en: "read → read" },
          { t: "bor → bodde", en: "live → lived" },
        ],
      },
      {
        title: { t: "Egna former", en: "Everyday irregulars" },
        body: "The most common verbs have their own past forms. Learn them as words.",
        examples: [
          { t: "är → var, har → hade", en: "am → was, have → had" },
          { t: "gör → gjorde, går → gick", en: "do → did, go → went" },
          { t: "ser → såg, äter → åt", en: "see → saw, eat → ate" },
        ],
      },
    ],
    check: {
      question: "“Yesterday I talked to Bosse.”",
      options: ["Igår pratade jag med Bosse.", "Igår jag pratade med Bosse.", "Igår pratar jag med Bosse."],
      answer: "Igår pratade jag med Bosse.",
      why: "Past form pratade, and the verb stays second after igår.",
    },
  },
  {
    id: "plural",
    unit: "naturen",
    title: { t: "Fåglar och blommor", en: "More than one" },
    readyAt: 5,
    gates: ["stjaernor", "en-sten"],
    cards: [
      {
        title: { t: "-or, -ar, -er", en: "Three common endings" },
        body: "En-words ending in -a take -or, many others -ar or -er. Learn the plural with the word.",
        examples: [
          { t: "en blomma → blommor", en: "a flower → flowers" },
          { t: "en fågel → fåglar", en: "a bird → birds" },
          { t: "en älg → älgar", en: "an elk → elks" },
        ],
      },
      {
        title: { t: "Ett träd, två träd", en: "Many ett-words don't change" },
        body: "Ett-words ending in a consonant stay the same in the plural.",
        examples: [
          { t: "ett träd → två träd", en: "a tree → two trees" },
          { t: "ett berg → många berg", en: "a mountain → many mountains" },
        ],
      },
    ],
    check: {
      question: "“Three flowers” (en blomma)",
      options: ["tre blommor", "tre blommar", "tre blomma"],
      answer: "tre blommor",
      why: "En-words ending in -a take -or.",
    },
  },
  {
    id: "modala",
    unit: "traeffas",
    title: { t: "Vill du? Kan du?", en: "Want to, can, shall" },
    readyAt: 3,
    gates: ["vi-kan", "jag-hinner-inte"],
    cards: [
      {
        title: { t: "Hjälpverb", en: "Helper verbs" },
        body: "Vill, kan, ska and måste are followed straight by the plain verb. In a question, the helper verb comes first.",
        examples: [
          { t: "Vill du fika?", en: "Do you want to get a coffee?" },
          { t: "Vi kan gå till stranden.", en: "We can go to the beach." },
          { t: "Ska vi ses imorgon?", en: "Shall we meet tomorrow?" },
        ],
      },
    ],
    check: {
      question: "“Can you come on Saturday?”",
      options: ["Kan du komma på lördag?", "Kan du att komma på lördag?", "Du kan komma på lördag?"],
      answer: "Kan du komma på lördag?",
      why: "Kan first for the question, then the plain verb komma.",
    },
  },
  {
    id: "aka-ga",
    unit: "resa",
    title: { t: "Åka eller gå?", en: "Travelling or walking" },
    readyAt: 4,
    gates: ["med-taaget", "bussen"],
    cards: [
      {
        title: { t: "Med fordon", en: "By vehicle" },
        body: "Gå means to walk. Going anywhere by train, bus, boat, bike or car is åka.",
        examples: [
          { t: "Jag går till affären.", en: "I walk to the shop." },
          { t: "Jag åker till Stockholm.", en: "I'm going to Stockholm." },
          { t: "Vi åker med tåget.", en: "We're going by train." },
        ],
      },
    ],
    check: {
      question: "“I'm taking the ferry to the mainland.”",
      options: ["Jag åker färja till fastlandet.", "Jag går färja till fastlandet.", "Jag åka färja till fastlandet."],
      answer: "Jag åker färja till fastlandet.",
      why: "A ferry is a vehicle, so åker.",
    },
  },
  {
    id: "eftersom",
    unit: "kaenslor",
    title: { t: "Eftersom", en: "Because" },
    readyAt: 6,
    gates: ["eftersom", "foer-att"],
    cards: [
      {
        title: { t: "Ingen vändning", en: "No flip after eftersom" },
        body: "After eftersom (because) the person comes before the verb, and inte comes before the verb too.",
        examples: [
          { t: "Jag är glad eftersom solen skiner.", en: "I'm happy because the sun is shining." },
          { t: "Hon är ledsen eftersom hon inte kan komma.", en: "She's sad because she can't come." },
        ],
      },
    ],
    check: {
      question: "“…because I don't have time”",
      options: ["eftersom jag inte har tid", "eftersom jag har inte tid", "eftersom har jag inte tid"],
      answer: "eftersom jag inte har tid",
      why: "After eftersom: jag, then inte, then the verb.",
    },
  },
  {
    id: "framtid",
    unit: "framtid",
    title: { t: "Ska eller kommer att", en: "Two futures" },
    readyAt: 3,
    gates: ["jag-kommer-att", "det-blir-fint"],
    cards: [
      {
        title: { t: "Planer och förutsägelser", en: "Plans and predictions" },
        body: "Use ska for what you've decided to do, kommer att for what will happen anyway. With a time word, plain present works too.",
        examples: [
          { t: "Jag ska plantera tomater.", en: "I'm going to plant tomatoes. (my plan)" },
          { t: "Det kommer att regna.", en: "It's going to rain. (prediction)" },
          { t: "Imorgon åker jag hem.", en: "Tomorrow I'm going home." },
        ],
      },
    ],
    check: {
      question: "Your plan: “I'm going to learn to sail.”",
      options: ["Jag ska lära mig segla.", "Jag kommer lära mig segla att.", "Jag lär ska mig segla."],
      answer: "Jag ska lära mig segla.",
      why: "It's a plan, so ska.",
    },
  },
  {
    id: "jamforelse",
    unit: "aasikter",
    title: { t: "Större, bäst", en: "Comparing" },
    readyAt: 6,
    gates: ["baest", "saemre", "mest"],
    cards: [
      {
        title: { t: "-are och -ast", en: "-er and -est" },
        body: "Add -are for 'more' and -ast for 'most'. Than is än.",
        examples: [
          { t: "varm → varmare → varmast", en: "warm → warmer → warmest" },
          { t: "Idag är det varmare än igår.", en: "Today it's warmer than yesterday." },
        ],
      },
      {
        title: { t: "Egna former", en: "The irregular ones" },
        body: "A few everyday words change more.",
        examples: [
          { t: "bra → bättre → bäst", en: "good → better → best" },
          { t: "stor → större → störst", en: "big → bigger → biggest" },
          { t: "dålig → sämre → sämst", en: "bad → worse → worst" },
        ],
      },
    ],
    check: {
      question: "“Coffee is better than tea.”",
      options: ["Kaffe är bättre än te.", "Kaffe är mer bra än te.", "Kaffe är bättre som te."],
      answer: "Kaffe är bättre än te.",
      why: "Bra → bättre, and 'than' is än.",
    },
  },
];
