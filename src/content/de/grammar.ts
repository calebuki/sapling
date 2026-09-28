import type { GrammarTip } from "@/lib/game/grammar";

// Short grammar lessons for the German course, each opened by the unit whose
// phrases need it. English explains; every example is German.

export const grammarTips: GrammarTip[] = [
  {
    id: "deutsch-101",
    unit: "hallo",
    title: { t: "Deutsch 101", en: "German 101" },
    readyAt: 0,
    gates: ["gruess-gott", "auf-wiedersehen"],
    cards: [
      {
        title: { t: "Vier neue Buchstaben", en: "Four new letters" },
        body: "German has the same A–Z as English plus ä, ö, ü and ß. The dots change the sound, and ß is simply a sharp double s.",
        examples: [
          { t: "schön", en: "beautiful (ö: say 'e' with round lips)" },
          { t: "Tschüss", en: "Bye (ü: say 'ee' with round lips)" },
          { t: "Grüß Gott", en: "Hello, in the south (ß sounds like ss)" },
        ],
      },
      {
        title: { t: "Nomen sind groß", en: "Nouns are capitalised" },
        body: "Every German noun starts with a capital letter, not just names. It makes nouns easy to spot in a sentence.",
        examples: [
          { t: "der Kaffee", en: "the coffee" },
          { t: "die Insel", en: "the island" },
          { t: "Das Boot kommt um drei.", en: "The boat comes at three." },
        ],
      },
      {
        title: { t: "Hallo oder Grüß Gott?", en: "Hallo or Grüß Gott?" },
        body: "Hallo and Tschüss are for everyone you know. Guten Tag and Auf Wiedersehen are more polite. In the south, including the Black Forest, people also say Grüß Gott.",
        examples: [
          { t: "Hallo, Greta!", en: "Hi, Greta!" },
          { t: "Guten Tag, Frau Weber!", en: "Good day, Mrs Weber!" },
          { t: "Auf Wiedersehen!", en: "Goodbye!" },
        ],
      },
    ],
    check: {
      question: "Which word is a noun?",
      options: ["Boot", "schön", "danke"],
      answer: "Boot",
      why: "Nouns are capitalised: das Boot, the boat.",
    },
  },
  {
    id: "du-und-sie",
    unit: "vorstellen",
    title: { t: "Du oder Sie?", en: "Du or Sie?" },
    readyAt: 3,
    gates: ["wie-heissen-sie", "sie-formal"],
    cards: [
      {
        title: { t: "Zwei Wörter für „you“", en: "Two words for 'you'" },
        body: "Use du with friends, family, children and other young people. Use Sie, always with a capital S, with adults you don't know, at the doctor's or in a shop.",
        examples: [
          { t: "Wie heißt du?", en: "What's your name? (friendly)" },
          { t: "Wie heißen Sie?", en: "What's your name? (polite)" },
          { t: "Kommen Sie aus England?", en: "Are you from England? (polite)" },
        ],
      },
      {
        title: { t: "Im Zweifel: Sie", en: "When in doubt: Sie" },
        body: "Sie is never rude. If someone says Du kannst du sagen, you can switch to du. On Tannenau, everyone says du to you.",
        examples: [
          { t: "Sie können du sagen.", en: "You can say du. (polite)" },
          { t: "Du bist nett!", en: "You're nice!" },
        ],
      },
    ],
    check: {
      question: "You meet an older doctor for the first time. How do you ask her name?",
      options: ["Wie heißen Sie?", "Wie heißt du?", "Wie heißt sie?"],
      answer: "Wie heißen Sie?",
      why: "Strangers and professionals get Sie, with the verb ending -en.",
    },
  },
  {
    id: "verben",
    unit: "vorstellen",
    title: { t: "Verben: -e, -st, -t", en: "Verbs: -e, -st, -t" },
    readyAt: 6,
    gates: ["wo-wohnst-du", "ich-wohne-in"],
    cards: [
      {
        title: { t: "Die Endung ändert sich", en: "The ending changes" },
        body: "German verbs change their ending for each person. Take wohnen (to live): cut off -en and add the ending.",
        examples: [
          { t: "ich wohne", en: "I live" },
          { t: "du wohnst", en: "you live" },
          { t: "er / sie wohnt", en: "he / she lives" },
          { t: "wir wohnen", en: "we live" },
        ],
      },
      {
        title: { t: "Genauso: kommen, lernen, heißen", en: "Same for kommen, lernen, heißen" },
        body: "Most verbs follow the same pattern. Heißen just keeps its ß: du heißt, not du heißst.",
        examples: [
          { t: "Ich komme aus Wien.", en: "I come from Vienna." },
          { t: "Du lernst Deutsch.", en: "You're learning German." },
          { t: "Sie heißt Hilde.", en: "Her name is Hilde." },
        ],
      },
    ],
    check: {
      question: "“Where do you live?”",
      options: ["Wo wohnst du?", "Wo wohnt du?", "Wo wohnen du?"],
      answer: "Wo wohnst du?",
      why: "du takes -st: du wohnst.",
    },
  },
  {
    id: "fragen",
    unit: "vorstellen",
    title: { t: "Fragen stellen", en: "Asking questions" },
    readyAt: 9,
    gates: ["woher-kommst-du", "sprichst-du"],
    cards: [
      {
        title: { t: "Verb zuerst", en: "Verb first for yes/no" },
        body: "For a yes/no question, put the verb first. There is no 'do' in German.",
        examples: [
          { t: "Du sprichst Englisch.", en: "You speak English." },
          { t: "Sprichst du Englisch?", en: "Do you speak English?" },
          { t: "Bist du Lena?", en: "Are you Lena?" },
        ],
      },
      {
        title: { t: "W-Fragen", en: "W-questions" },
        body: "Question words start with W: wer (who), was (what), wo (where), woher (where from), wie (how). The verb comes straight after.",
        examples: [
          { t: "Woher kommst du?", en: "Where are you from?" },
          { t: "Wo wohnst du?", en: "Where do you live?" },
          { t: "Wer ist das?", en: "Who is that?" },
        ],
      },
    ],
    check: {
      question: "Turn “Du kommst aus England” into a question.",
      options: ["Kommst du aus England?", "Du kommst aus England?", "Aus England du kommst?"],
      answer: "Kommst du aus England?",
      why: "The verb (kommst) jumps to the front.",
    },
  },
  {
    id: "der-die-das",
    unit: "cafe",
    title: { t: "Der, die, das", en: "Der, die, das" },
    readyAt: 0,
    gates: ["und-eine-brezel", "das-stueck"],
    cards: [
      {
        title: { t: "Drei Geschlechter", en: "Three genders" },
        body: "Every German noun is masculine (der), feminine (die) or neuter (das). There are some patterns, but it's best to learn each noun with its article.",
        examples: [
          { t: "der Kaffee", en: "the coffee (masculine)" },
          { t: "die Brezel", en: "the pretzel (feminine)" },
          { t: "das Wasser", en: "the water (neuter)" },
        ],
      },
      {
        title: { t: "Ein und eine", en: "Ein and eine: a / an" },
        body: "For 'a', masculine and neuter words take ein, feminine words take eine.",
        examples: [
          { t: "ein Kaffee", en: "a coffee" },
          { t: "eine Brezel", en: "a pretzel" },
          { t: "ein Stück Kuchen", en: "a piece of cake" },
        ],
      },
    ],
    check: {
      question: "Die Brezel. So “a pretzel” is …",
      options: ["eine Brezel", "ein Brezel", "einen Brezel"],
      answer: "eine Brezel",
      why: "Brezel is feminine (die), so it's eine.",
    },
  },
  {
    id: "akkusativ",
    unit: "cafe",
    title: { t: "Einen Kaffee, bitte!", en: "Einen Kaffee, please!" },
    readyAt: 4,
    gates: ["ich-haette-gern", "noch-ein"],
    cards: [
      {
        title: { t: "Der wird den", en: "Der becomes den" },
        body: "When a masculine noun is the thing you want, have or order, der becomes den and ein becomes einen. Feminine and neuter words don't change.",
        examples: [
          { t: "Der Kaffee ist heiß.", en: "The coffee is hot." },
          { t: "Ich hätte gern einen Kaffee.", en: "I'd like a coffee." },
          { t: "Ich möchte eine Brezel.", en: "I'd like a pretzel. (no change)" },
        ],
      },
      {
        title: { t: "Ich hätte gern …", en: "Ich hätte gern …" },
        body: "Ich hätte gern means 'I would like'. It's the friendliest way to order in a café or shop.",
        examples: [
          { t: "Ich hätte gern einen Tee.", en: "I'd like a tea." },
          { t: "Ich hätte gern ein Wasser.", en: "I'd like a water." },
        ],
      },
    ],
    check: {
      question: "“I'd like a tea.” (der Tee)",
      options: ["Ich hätte gern einen Tee.", "Ich hätte gern ein Tee.", "Ich hätte gern eine Tee."],
      answer: "Ich hätte gern einen Tee.",
      why: "Tee is masculine, and you're ordering it: einen Tee.",
    },
  },
  {
    id: "zahlen-bauen",
    unit: "zahlen",
    title: { t: "Zahlen bauen", en: "Building numbers" },
    readyAt: 12,
    gates: ["einundzwanzig"],
    cards: [
      {
        title: { t: "Eins und zwanzig", en: "One and twenty" },
        body: "From 21 on, German says the ones first: einundzwanzig is 'one-and-twenty'. It's written as one word.",
        examples: [
          { t: "einundzwanzig", en: "21 (one and twenty)" },
          { t: "zweiunddreißig", en: "32 (two and thirty)" },
          { t: "fünfundvierzig", en: "45 (five and forty)" },
        ],
      },
    ],
    check: {
      question: "How do you say 43?",
      options: ["dreiundvierzig", "vierzigunddrei", "vierunddreißig"],
      answer: "dreiundvierzig",
      why: "Ones first, then tens: drei-und-vierzig.",
    },
  },
  {
    id: "haben-sein",
    unit: "familie",
    title: { t: "Haben und sein", en: "Haben and sein" },
    readyAt: 3,
    gates: ["ich-habe", "hast-du"],
    cards: [
      {
        title: { t: "Sein: to be", en: "Sein: to be" },
        body: "Sein is irregular, like 'to be' in English. You'll use it all the time.",
        examples: [
          { t: "ich bin", en: "I am" },
          { t: "du bist", en: "you are" },
          { t: "er / sie ist", en: "he / she is" },
          { t: "wir sind", en: "we are" },
        ],
      },
      {
        title: { t: "Haben: to have", en: "Haben: to have" },
        body: "Haben is almost regular. Watch du hast and er hat.",
        examples: [
          { t: "Ich habe einen Bruder.", en: "I have a brother." },
          { t: "Hast du Geschwister?", en: "Do you have siblings?" },
          { t: "Sie hat eine Katze.", en: "She has a cat." },
        ],
      },
    ],
    check: {
      question: "“Do you have a dog?”",
      options: ["Hast du einen Hund?", "Habst du einen Hund?", "Hat du einen Hund?"],
      answer: "Hast du einen Hund?",
      why: "du hast, and Hund is masculine: einen Hund.",
    },
  },
  {
    id: "kein-nicht",
    unit: "familie",
    title: { t: "Kein oder nicht?", en: "Kein or nicht?" },
    readyAt: 8,
    gates: ["kein"],
    cards: [
      {
        title: { t: "Kein = nicht ein", en: "Kein = not a" },
        body: "Kein replaces ein (or no article) to say you don't have something. It takes the same endings as ein.",
        examples: [
          { t: "Ich habe einen Hund.", en: "I have a dog." },
          { t: "Ich habe keinen Hund.", en: "I don't have a dog." },
          { t: "Ich habe keine Geschwister.", en: "I don't have any siblings." },
        ],
      },
      {
        title: { t: "Nicht für den Rest", en: "Nicht for everything else" },
        body: "Nicht negates verbs, adjectives and nouns with der, die or das.",
        examples: [
          { t: "Ich wohne nicht hier.", en: "I don't live here." },
          { t: "Das ist nicht mein Hund.", en: "That's not my dog." },
        ],
      },
    ],
    check: {
      question: "“I don't have a car.” (das Auto)",
      options: ["Ich habe kein Auto.", "Ich habe nicht Auto.", "Ich habe nicht ein Auto."],
      answer: "Ich habe kein Auto.",
      why: "No car at all: kein Auto.",
    },
  },
  {
    id: "mein-dein",
    unit: "familie",
    title: { t: "Mein, dein, sein", en: "My, your, his" },
    readyAt: 14,
    gates: ["sein-ihr", "unser"],
    cards: [
      {
        title: { t: "Wie ein und eine", en: "Just like ein and eine" },
        body: "Mein (my), dein (your), sein (his), ihr (her), unser (our) take the same endings as ein: an -e for feminine and plural words.",
        examples: [
          { t: "mein Bruder", en: "my brother" },
          { t: "meine Schwester", en: "my sister" },
          { t: "meine Eltern", en: "my parents" },
        ],
      },
      {
        title: { t: "Sein oder ihr?", en: "Sein or ihr?" },
        body: "Sein is his, ihr is her. It depends on who owns it, not on the thing itself.",
        examples: [
          { t: "Das ist sein Hund.", en: "That's his dog." },
          { t: "Das ist ihr Hund.", en: "That's her dog." },
          { t: "Das ist unser Hof.", en: "This is our farm." },
        ],
      },
    ],
    check: {
      question: "“My mother” (die Mutter)",
      options: ["meine Mutter", "mein Mutter", "meinen Mutter"],
      answer: "meine Mutter",
      why: "Mutter is feminine, so mein gets an -e.",
    },
  },
  {
    id: "es-gibt",
    unit: "essen",
    title: { t: "Es gibt", en: "Es gibt: there is" },
    readyAt: 10,
    gates: ["es-gibt"],
    cards: [
      {
        title: { t: "Es gibt …", en: "There is / there are" },
        body: "Es gibt means 'there is' or 'there are'. What follows is the object, so masculine words take einen.",
        examples: [
          { t: "Heute gibt es Suppe.", en: "Today there's soup." },
          { t: "Gibt es einen Supermarkt?", en: "Is there a supermarket?" },
          { t: "Es gibt keinen Kuchen mehr.", en: "There's no more cake." },
        ],
      },
    ],
    check: {
      question: "“Is there a café here?” (das Café)",
      options: ["Gibt es hier ein Café?", "Gibt es hier einen Café?", "Es gibt hier ein Café?"],
      answer: "Gibt es hier ein Café?",
      why: "Question: verb first. Café is neuter: ein Café.",
    },
  },
  {
    id: "mehrzahl",
    unit: "essen",
    title: { t: "Mehr als eins", en: "More than one" },
    readyAt: 20,
    gates: [],
    cards: [
      {
        title: { t: "Viele Endungen", en: "Many plural endings" },
        body: "German plurals come in several shapes: -e, -en, -er, -s or no ending, often with an umlaut. The plural article is always die.",
        examples: [
          { t: "der Apfel → die Äpfel", en: "apple → apples" },
          { t: "die Tomate → die Tomaten", en: "tomato → tomatoes" },
          { t: "das Ei → die Eier", en: "egg → eggs" },
          { t: "das Auto → die Autos", en: "car → cars" },
        ],
      },
    ],
    check: {
      question: "What's the article for all plurals?",
      options: ["die", "der", "das"],
      answer: "die",
      why: "Every plural uses die: die Äpfel, die Autos.",
    },
  },
  {
    id: "verb-zwei",
    unit: "uhrzeit",
    title: { t: "Das Verb an Platz zwei", en: "The verb in second place" },
    readyAt: 20,
    gates: ["v2-heute"],
    cards: [
      {
        title: { t: "Immer Platz zwei", en: "Always position two" },
        body: "In a German statement the verb is always the second idea. If you start with a time like heute or am Montag, the person moves after the verb.",
        examples: [
          { t: "Ich arbeite heute.", en: "I'm working today." },
          { t: "Heute arbeite ich.", en: "Today I'm working." },
          { t: "Am Montag fährt Lena nach Freiburg.", en: "On Monday Lena goes to Freiburg." },
        ],
      },
    ],
    check: {
      question: "“Tomorrow I'm going home.”",
      options: ["Morgen gehe ich nach Hause.", "Morgen ich gehe nach Hause.", "Morgen nach Hause ich gehe."],
      answer: "Morgen gehe ich nach Hause.",
      why: "Morgen comes first, so the verb gehe is second and ich follows it.",
    },
  },
  {
    id: "trennbar",
    unit: "uhrzeit",
    title: { t: "Verben in zwei Teilen", en: "Verbs in two parts" },
    readyAt: 24,
    gates: ["aufstehen"],
    cards: [
      {
        title: { t: "Auf … stehen", en: "The prefix goes to the end" },
        body: "Some verbs have a prefix like auf-, an- or ein-. In a sentence, the prefix splits off and goes to the very end.",
        examples: [
          { t: "aufstehen: Ich stehe um sechs auf.", en: "to get up: I get up at six." },
          { t: "einkaufen: Wir kaufen heute ein.", en: "to shop: We're shopping today." },
          { t: "ankommen: Der Zug kommt um zehn an.", en: "to arrive: The train arrives at ten." },
        ],
      },
    ],
    check: {
      question: "“I get up early.” (aufstehen)",
      options: ["Ich stehe früh auf.", "Ich aufstehe früh.", "Ich stehe auf früh."],
      answer: "Ich stehe früh auf.",
      why: "The prefix auf goes to the very end.",
    },
  },
  {
    id: "wo-praepositionen",
    unit: "wohnen",
    title: { t: "Wo ist das?", en: "Where is it?" },
    readyAt: 18,
    gates: ["unter", "neben"],
    cards: [
      {
        title: { t: "Dem und der", en: "Dem and der" },
        body: "After in, auf, unter, neben and other place words, when you say where something is, der and das become dem, and die becomes der.",
        examples: [
          { t: "auf dem Tisch", en: "on the table (der Tisch)" },
          { t: "in der Küche", en: "in the kitchen (die Küche)" },
          { t: "unter dem Bett", en: "under the bed (das Bett)" },
        ],
      },
      {
        title: { t: "Im und am", en: "Im and am" },
        body: "In dem and an dem are usually shortened to im and am.",
        examples: [
          { t: "Die Milch ist im Kühlschrank.", en: "The milk is in the fridge." },
          { t: "Das Hotel ist am See.", en: "The hotel is by the lake." },
        ],
      },
    ],
    check: {
      question: "“The cat is in the kitchen.” (die Küche)",
      options: ["Die Katze ist in der Küche.", "Die Katze ist in die Küche.", "Die Katze ist in dem Küche."],
      answer: "Die Katze ist in der Küche.",
      why: "Where? die Küche becomes in der Küche.",
    },
  },
  {
    id: "imperativ",
    unit: "weg",
    title: { t: "Gehen Sie geradeaus!", en: "Go straight ahead!" },
    readyAt: 12,
    gates: ["abbiegen", "die-erste-strasse"],
    cards: [
      {
        title: { t: "Anweisungen", en: "Giving directions" },
        body: "To tell someone polite what to do, put the verb first and add Sie. With du, drop the -st ending and the du.",
        examples: [
          { t: "Gehen Sie geradeaus.", en: "Go straight ahead. (polite)" },
          { t: "Nehmen Sie die erste Straße links.", en: "Take the first street on the left. (polite)" },
          { t: "Geh geradeaus!", en: "Go straight ahead! (du)" },
        ],
      },
    ],
    check: {
      question: "Tell a stranger politely: “Go left.”",
      options: ["Gehen Sie links.", "Sie gehen links?", "Geht links."],
      answer: "Gehen Sie links.",
      why: "Verb first, then Sie.",
    },
  },
  {
    id: "adjektive",
    unit: "kleidung",
    title: { t: "Rot oder roter?", en: "Rot or roter?" },
    readyAt: 22,
    gates: [],
    cards: [
      {
        title: { t: "Nach „ist“: keine Endung", en: "After 'is': no ending" },
        body: "An adjective after sein never changes: der Hut ist rot, die Jacke ist rot.",
        examples: [
          { t: "Der Hut ist rot.", en: "The hat is red." },
          { t: "Die Schuhe sind neu.", en: "The shoes are new." },
        ],
      },
      {
        title: { t: "Vor dem Nomen: eine Endung", en: "Before a noun: an ending" },
        body: "Right before a noun, adjectives get an ending. For now, just notice it: ein roter Hut, eine rote Jacke, ein rotes Kleid.",
        examples: [
          { t: "ein roter Hut", en: "a red hat" },
          { t: "eine rote Jacke", en: "a red jacket" },
          { t: "ein weißes T-Shirt", en: "a white T-shirt" },
        ],
      },
    ],
    check: {
      question: "“The dress is pink.”",
      options: ["Das Kleid ist rosa.", "Das Kleid ist rosas.", "Das rosa ist Kleid."],
      answer: "Das Kleid ist rosa.",
      why: "After ist, the adjective has no ending.",
    },
  },
  {
    id: "modalverben",
    unit: "freizeit",
    title: { t: "Können, wollen, müssen", en: "Can, want, must" },
    readyAt: 10,
    gates: ["ich-kann", "ich-will"],
    cards: [
      {
        title: { t: "Das zweite Verb geht ans Ende", en: "The second verb goes to the end" },
        body: "With können (can), wollen (want), müssen (must) and sollen (should), the main verb goes to the end of the sentence in its dictionary form.",
        examples: [
          { t: "Ich kann gut schwimmen.", en: "I can swim well." },
          { t: "Ich will heute wandern.", en: "I want to go hiking today." },
          { t: "Du musst viel trinken.", en: "You have to drink a lot." },
        ],
      },
      {
        title: { t: "Ich kann, er kann", en: "Ich kann, er kann" },
        body: "These verbs have no ending for ich and er / sie.",
        examples: [
          { t: "ich kann / er kann", en: "I can / he can" },
          { t: "ich will / sie will", en: "I want / she wants" },
          { t: "du kannst / du willst", en: "you can / you want" },
        ],
      },
    ],
    check: {
      question: "“I can dance.”",
      options: ["Ich kann tanzen.", "Ich kann tanze.", "Ich tanzen kann."],
      answer: "Ich kann tanzen.",
      why: "kann in second place, tanzen in its dictionary form at the end.",
    },
  },
  {
    id: "mir-ist",
    unit: "gesundheit",
    title: { t: "Mir ist kalt", en: "Mir ist kalt" },
    readyAt: 8,
    gates: ["mir-geht-es-schlecht", "mir-geht-es-besser"],
    cards: [
      {
        title: { t: "Mir, nicht ich", en: "Mir, not ich" },
        body: "For how you feel, German often says 'to me it is'. Mir means 'to me', dir means 'to you'.",
        examples: [
          { t: "Mir ist kalt.", en: "I'm cold." },
          { t: "Mir geht es gut.", en: "I'm well." },
          { t: "Wie geht es dir?", en: "How are you?" },
        ],
      },
    ],
    check: {
      question: "“I'm not well.”",
      options: ["Mir geht es schlecht.", "Ich geht es schlecht.", "Mich geht es schlecht."],
      answer: "Mir geht es schlecht.",
      why: "It goes badly 'to me': mir geht es schlecht.",
    },
  },
  {
    id: "perfekt",
    unit: "vergangenheit",
    title: { t: "Ich habe gemacht", en: "Talking about the past" },
    readyAt: 0,
    gates: ["perfekt-habe-gemacht", "perfekt-bin-gegangen"],
    cards: [
      {
        title: { t: "Haben + ge…t", en: "Haben + ge…t" },
        body: "In spoken German, the past is usually haben plus a past participle at the end of the sentence. Regular participles look like ge-…-t.",
        examples: [
          { t: "machen → gemacht", en: "to do → done" },
          { t: "Ich habe Äpfel gekauft.", en: "I bought apples." },
          { t: "Wir haben Karten gespielt.", en: "We played cards." },
        ],
      },
      {
        title: { t: "Sein für Bewegung", en: "Sein for movement" },
        body: "Verbs of moving from place to place use sein instead of haben. Many common verbs have participles ending in -en.",
        examples: [
          { t: "Ich bin nach Hause gegangen.", en: "I went home." },
          { t: "Wir sind nach Freiburg gefahren.", en: "We went to Freiburg." },
          { t: "Er ist gekommen.", en: "He came." },
        ],
      },
    ],
    check: {
      question: "“Yesterday I went to the café.”",
      options: ["Gestern bin ich ins Café gegangen.", "Gestern habe ich ins Café gegangen.", "Gestern ich bin ins Café gegangen."],
      answer: "Gestern bin ich ins Café gegangen.",
      why: "gehen takes sein, the verb stays second, the participle goes last.",
    },
  },
  {
    id: "war-hatte",
    unit: "vergangenheit",
    title: { t: "War und hatte", en: "War and hatte" },
    readyAt: 6,
    gates: ["war", "hatte"],
    cards: [
      {
        title: { t: "Kurz und einfach", en: "Short and simple" },
        body: "For sein and haben, Germans usually use the short past forms war (was) and hatte (had).",
        examples: [
          { t: "Gestern war ich müde.", en: "Yesterday I was tired." },
          { t: "Wie war dein Tag?", en: "How was your day?" },
          { t: "Ich hatte keine Zeit.", en: "I didn't have time." },
        ],
      },
    ],
    check: {
      question: "“The film was great.”",
      options: ["Der Film war super.", "Der Film ist super gewesen war.", "Der Film hatte super."],
      answer: "Der Film war super.",
      why: "was = war.",
    },
  },
  {
    id: "futur",
    unit: "plaene",
    title: { t: "Die Zukunft", en: "The future" },
    readyAt: 12,
    gates: ["werden-future"],
    cards: [
      {
        title: { t: "Meistens: Präsens", en: "Usually: the present" },
        body: "German often uses the present tense for the future, with a time word: Morgen fahre ich nach Wien.",
        examples: [
          { t: "Morgen fahre ich nach Wien.", en: "Tomorrow I'm going to Vienna." },
          { t: "Am Samstag feiern wir.", en: "On Saturday we're celebrating." },
        ],
      },
      {
        title: { t: "Werden + Infinitiv", en: "Werden + infinitive" },
        body: "For plans and predictions you can use werden with a verb at the end.",
        examples: [
          { t: "Ich werde morgen wandern.", en: "I'll go hiking tomorrow." },
          { t: "Es wird regnen.", en: "It's going to rain." },
        ],
      },
    ],
    check: {
      question: "“It's going to snow.”",
      options: ["Es wird schneien.", "Es wird schneit.", "Es schneien wird."],
      answer: "Es wird schneien.",
      why: "werden + the dictionary form at the end.",
    },
  },
  {
    id: "weil",
    unit: "gefuehle",
    title: { t: "Weil: das Verb am Ende", en: "Weil: verb at the end" },
    readyAt: 16,
    gates: ["weil", "deshalb"],
    cards: [
      {
        title: { t: "Weil schickt das Verb ans Ende", en: "Weil sends the verb to the end" },
        body: "After weil (because), the verb jumps to the very end of the sentence.",
        examples: [
          { t: "Ich bin froh.", en: "I'm glad." },
          { t: "…, weil die Sonne scheint.", en: "…, because the sun is shining." },
          { t: "Ich bleibe zu Hause, weil ich krank bin.", en: "I'm staying home because I'm ill." },
        ],
      },
      {
        title: { t: "Deshalb: das Verb zuerst", en: "Deshalb: the verb comes next" },
        body: "Deshalb (that's why) counts as the first idea, so the verb comes straight after it.",
        examples: [
          { t: "Es regnet, deshalb bleibe ich zu Hause.", en: "It's raining, that's why I'm staying home." },
        ],
      },
    ],
    check: {
      question: "“…because I'm tired.”",
      options: ["…, weil ich müde bin.", "…, weil ich bin müde.", "…, weil bin ich müde."],
      answer: "…, weil ich müde bin.",
      why: "weil sends bin to the end.",
    },
  },
  {
    id: "sich",
    unit: "gefuehle",
    title: { t: "Sich freuen", en: "Sich freuen" },
    readyAt: 22,
    gates: ["sich-freuen", "sich-aergern"],
    cards: [
      {
        title: { t: "Verben mit „sich“", en: "Verbs with 'sich'" },
        body: "Some verbs need a word for 'myself', 'yourself': mich, dich, sich. Many feelings work this way.",
        examples: [
          { t: "Ich freue mich.", en: "I'm happy. (I please myself)" },
          { t: "Freust du dich?", en: "Are you pleased?" },
          { t: "Er ärgert sich.", en: "He's annoyed." },
        ],
      },
    ],
    check: {
      question: "“I'm looking forward to the weekend.”",
      options: ["Ich freue mich auf das Wochenende.", "Ich freue auf das Wochenende.", "Ich freue dich auf das Wochenende."],
      answer: "Ich freue mich auf das Wochenende.",
      why: "ich … mich: Ich freue mich.",
    },
  },
  {
    id: "dass",
    unit: "meinung",
    title: { t: "Ich finde, dass …", en: "I think that …" },
    readyAt: 4,
    gates: ["dass"],
    cards: [
      {
        title: { t: "Wie weil", en: "Just like weil" },
        body: "Dass (that) also sends the verb to the end of its part of the sentence.",
        examples: [
          { t: "Ich finde, dass Deutsch schön ist.", en: "I think that German is beautiful." },
          { t: "Ich glaube, dass es regnet.", en: "I think it's raining." },
        ],
      },
    ],
    check: {
      question: "“I know that you're right.”",
      options: ["Ich weiß, dass du recht hast.", "Ich weiß, dass du hast recht.", "Ich weiß, dass hast du recht."],
      answer: "Ich weiß, dass du recht hast.",
      why: "dass sends hast to the end.",
    },
  },
  {
    id: "vergleiche",
    unit: "meinung",
    title: { t: "Größer als", en: "Bigger than" },
    readyAt: 10,
    gates: ["vergleich-als", "am-besten"],
    cards: [
      {
        title: { t: "-er als", en: "-er than" },
        body: "To compare, add -er to the adjective and use als (than). Short words often get an umlaut: alt → älter, groß → größer.",
        examples: [
          { t: "Der Zug ist schneller als der Bus.", en: "The train is faster than the bus." },
          { t: "Hilde ist älter als Greta.", en: "Hilde is older than Greta." },
        ],
      },
      {
        title: { t: "Am besten", en: "The best" },
        body: "For 'the most', use am … -sten. Gut is irregular: gut, besser, am besten.",
        examples: [
          { t: "Franz backt am besten.", en: "Franz bakes best." },
          { t: "Der Berg ist am höchsten.", en: "The mountain is highest." },
        ],
      },
    ],
    check: {
      question: "“Tea is better than coffee.”",
      options: ["Tee ist besser als Kaffee.", "Tee ist guter als Kaffee.", "Tee ist besser wie Kaffee."],
      answer: "Tee ist besser als Kaffee.",
      why: "gut → besser, and 'than' is als.",
    },
  },
];
