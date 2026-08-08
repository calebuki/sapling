export type DanishVoice = "da-DK-ChristelNeural" | "da-DK-JeppeNeural";

export type LessonExercise = {
  conceptSlug: string;
  audioId: string;
  voice: DanishVoice;
  mode: "repeat" | "guided" | "open";
  eyebrow: string;
  prompt: string;
  expected: string;
  note: string;
};

export type ScenarioWord = {
  danish: string;
  english: string;
};

export type LessonSupport = {
  title: string;
  idea?: string;
  words: ScenarioWord[];
  starters?: ScenarioWord[];
};

export type Lesson = {
  id: string;
  number: number;
  title: string;
  description: string;
  support?: LessonSupport;
  exercises: LessonExercise[];
};

export type ListenSpeakItem = {
  id: string;
  conceptSlug: string;
  audioId: string;
  voice: DanishVoice;
  text: string;
  meaning: string;
  options: string[];
};

export type SpeechClip = {
  id: string;
  text: string;
  voice: DanishVoice;
};

export const lessons: Lesson[] = [
  {
    id: "first-words",
    number: 1,
    title: "First words",
    description: "Start with four everyday words.",
    exercises: [
      {
        conceptSlug: "hej",
        audioId: "learn-hej",
        voice: "da-DK-ChristelNeural",
        mode: "repeat",
        eyebrow: "Greet someone",
        prompt: "Hello",
        expected: "Hej.",
        note: "Hej is the everyday Danish hello.",
      },
      {
        conceptSlug: "tak",
        audioId: "learn-tak",
        voice: "da-DK-JeppeNeural",
        mode: "repeat",
        eyebrow: "Be polite",
        prompt: "Thanks",
        expected: "Tak.",
        note: "Tak means thanks and also softens short requests.",
      },
      {
        conceptSlug: "ja",
        audioId: "learn-ja",
        voice: "da-DK-ChristelNeural",
        mode: "repeat",
        eyebrow: "Say yes",
        prompt: "Yes",
        expected: "Ja.",
        note: "Ja means yes.",
      },
      {
        conceptSlug: "nej",
        audioId: "learn-nej",
        voice: "da-DK-JeppeNeural",
        mode: "repeat",
        eyebrow: "Say no",
        prompt: "No",
        expected: "Nej.",
        note: "Nej means no.",
      },
    ],
  },
  {
    id: "meet-someone",
    number: 2,
    title: "Meet someone",
    description: "Build a short introduction.",
    support: {
      title: "Introductions",
      words: [
        { danish: "hej", english: "hello" },
        { danish: "jeg", english: "I" },
        { danish: "du", english: "you" },
        { danish: "navn", english: "name" },
      ],
      starters: [
        { danish: "Jeg hedder …", english: "My name is …" },
        { danish: "Hvad hedder du?", english: "What is your name?" },
      ],
    },
    exercises: [
      {
        conceptSlug: "jeg-hedder",
        audioId: "learn-jeg-hedder",
        voice: "da-DK-JeppeNeural",
        mode: "guided",
        eyebrow: "Introduce yourself",
        prompt: "Say your name.",
        expected: "Hej, jeg hedder Caleb.",
        note: "Jeg hedder … is the normal way to introduce yourself.",
      },
      {
        conceptSlug: "hvad-hedder-du",
        audioId: "learn-hvad-hedder-du",
        voice: "da-DK-ChristelNeural",
        mode: "guided",
        eyebrow: "Ask their name",
        prompt: "Ask their name.",
        expected: "Hvad hedder du?",
        note: "Use this after your own introduction.",
      },
      {
        conceptSlug: "hyggeligt-at-moede-dig",
        audioId: "learn-hyggeligt-at-moede-dig",
        voice: "da-DK-JeppeNeural",
        mode: "guided",
        eyebrow: "Respond warmly",
        prompt: "Say nice to meet you.",
        expected: "Hyggeligt at møde dig.",
        note: "Hyggeligt makes the response warm and natural.",
      },
    ],
  },
  {
    id: "cafe-words",
    number: 3,
    title: "Café words",
    description: "Learn what is on the menu.",
    support: {
      title: "Menu",
      words: [
        { danish: "kaffe", english: "coffee" },
        { danish: "te", english: "tea" },
        { danish: "vand", english: "water" },
        { danish: "mælk", english: "milk" },
        { danish: "kanelsnegl", english: "cinnamon roll" },
      ],
    },
    exercises: [
      {
        conceptSlug: "kaffe",
        audioId: "learn-kaffe",
        voice: "da-DK-ChristelNeural",
        mode: "repeat",
        eyebrow: "A drink",
        prompt: "Coffee",
        expected: "Kaffe.",
        note: "Kaffe means coffee.",
      },
      {
        conceptSlug: "te",
        audioId: "learn-te",
        voice: "da-DK-JeppeNeural",
        mode: "repeat",
        eyebrow: "A drink",
        prompt: "Tea",
        expected: "Te.",
        note: "Te means tea.",
      },
      {
        conceptSlug: "vand",
        audioId: "learn-vand",
        voice: "da-DK-ChristelNeural",
        mode: "repeat",
        eyebrow: "A drink",
        prompt: "Water",
        expected: "Vand.",
        note: "Vand means water.",
      },
      {
        conceptSlug: "maelk",
        audioId: "learn-maelk",
        voice: "da-DK-JeppeNeural",
        mode: "repeat",
        eyebrow: "An extra",
        prompt: "Milk",
        expected: "Mælk.",
        note: "Mælk means milk.",
      },
      {
        conceptSlug: "kanelsnegl",
        audioId: "learn-kanelsnegl",
        voice: "da-DK-ChristelNeural",
        mode: "repeat",
        eyebrow: "Something sweet",
        prompt: "Cinnamon roll",
        expected: "Kanelsnegl.",
        note: "A kanelsnegl is a Danish cinnamon pastry.",
      },
    ],
  },
  {
    id: "build-an-order",
    number: 4,
    title: "Build an order",
    description: "Combine the café words.",
    support: {
      title: "Café",
      idea: "Try coffee with milk and a pastry.",
      words: [
        { danish: "kaffe", english: "coffee" },
        { danish: "te", english: "tea" },
        { danish: "vand", english: "water" },
        { danish: "mælk", english: "milk" },
        { danish: "kanelsnegl", english: "cinnamon roll" },
      ],
      starters: [
        { danish: "Jeg vil gerne have …", english: "I would like …" },
        { danish: "… med mælk", english: "… with milk" },
        { danish: "Og en …", english: "And a …" },
      ],
    },
    exercises: [
      {
        conceptSlug: "jeg-vil-gerne",
        audioId: "learn-jeg-vil-gerne",
        voice: "da-DK-JeppeNeural",
        mode: "guided",
        eyebrow: "Start the order",
        prompt: "Ask for a coffee.",
        expected: "Jeg vil gerne have en kaffe.",
        note: "Jeg vil gerne have … starts a polite order.",
      },
      {
        conceptSlug: "med-maelk",
        audioId: "learn-med-maelk",
        voice: "da-DK-ChristelNeural",
        mode: "guided",
        eyebrow: "Change the drink",
        prompt: "Add milk.",
        expected: "En kaffe med mælk.",
        note: "Med means with.",
      },
      {
        conceptSlug: "og-en-kanelsnegl",
        audioId: "learn-og-en-kanelsnegl",
        voice: "da-DK-JeppeNeural",
        mode: "guided",
        eyebrow: "Add food",
        prompt: "Add a cinnamon roll.",
        expected: "Og en kanelsnegl, tak.",
        note: "Og means and; tak finishes the order politely.",
      },
    ],
  },
  {
    id: "at-the-cafe",
    number: 5,
    title: "At the café",
    description: "Choose what you want and order naturally.",
    support: {
      title: "Menu",
      idea: "Try coffee with milk and a pastry.",
      words: [
        { danish: "kaffe", english: "coffee" },
        { danish: "te", english: "tea" },
        { danish: "vand", english: "water" },
        { danish: "mælk", english: "milk" },
        { danish: "kanelsnegl", english: "cinnamon roll" },
      ],
      starters: [
        { danish: "Jeg vil gerne have …", english: "I would like …" },
        { danish: "Kan jeg få …", english: "Can I have …" },
        { danish: "Regningen, tak.", english: "The bill, please." },
      ],
    },
    exercises: [
      {
        conceptSlug: "cafe-order-drink",
        audioId: "learn-cafe-order-drink",
        voice: "da-DK-ChristelNeural",
        mode: "open",
        eyebrow: "Order a drink",
        prompt: "Order any drink.",
        expected: "Jeg vil gerne have en kaffe med mælk, tak.",
        note: "Choose anything from the menu and order it your way.",
      },
      {
        conceptSlug: "cafe-order-food",
        audioId: "learn-cafe-order-food",
        voice: "da-DK-JeppeNeural",
        mode: "open",
        eyebrow: "Add something",
        prompt: "Add something to eat.",
        expected: "Og en kanelsnegl, tak.",
        note: "Add any food you know; a different natural answer is welcome.",
      },
      {
        conceptSlug: "cafe-ask-bill",
        audioId: "learn-cafe-ask-bill",
        voice: "da-DK-ChristelNeural",
        mode: "open",
        eyebrow: "Finish",
        prompt: "Ask for the bill.",
        expected: "Må jeg bede om regningen?",
        note: "Regningen, tak is also natural and completely acceptable.",
      },
    ],
  },
  {
    id: "getting-around",
    number: 6,
    title: "Getting around",
    description: "Find the station and the right train.",
    support: {
      title: "Transport",
      words: [
        { danish: "station", english: "station" },
        { danish: "tog", english: "train" },
        { danish: "billet", english: "ticket" },
        { danish: "stop", english: "stop" },
      ],
      starters: [
        { danish: "Hvor er …?", english: "Where is …?" },
        { danish: "Går dette tog til …?", english: "Does this train go to …?" },
      ],
    },
    exercises: [
      {
        conceptSlug: "hvor-er-stationen",
        audioId: "learn-hvor-er-stationen",
        voice: "da-DK-JeppeNeural",
        mode: "guided",
        eyebrow: "Find the station",
        prompt: "Ask where the station is.",
        expected: "Hvor er stationen?",
        note: "Hvor er … means where is …",
      },
      {
        conceptSlug: "toget-til-koebenhavn",
        audioId: "learn-toget-til-koebenhavn",
        voice: "da-DK-ChristelNeural",
        mode: "open",
        eyebrow: "Check the train",
        prompt: "Check this train goes to Copenhagen.",
        expected: "Går dette tog til København?",
        note: "Replace København with any destination you need.",
      },
      {
        conceptSlug: "jeg-skal-af-her",
        audioId: "learn-jeg-skal-af-her",
        voice: "da-DK-JeppeNeural",
        mode: "guided",
        eyebrow: "Your stop",
        prompt: "Say you need to get off here.",
        expected: "Jeg skal af her.",
        note: "Skal af means need to get off.",
      },
    ],
  },
  {
    id: "when-you-need-help",
    number: 7,
    title: "Need help",
    description: "Slow down a difficult conversation.",
    support: {
      title: "Help",
      words: [
        { danish: "forstår", english: "understand" },
        { danish: "gentage", english: "repeat" },
        { danish: "langsomt", english: "slowly" },
      ],
      starters: [
        { danish: "Jeg forstår ikke.", english: "I do not understand." },
        { danish: "Kan du …?", english: "Can you …?" },
      ],
    },
    exercises: [
      {
        conceptSlug: "jeg-forstaar-ikke",
        audioId: "learn-jeg-forstaar-ikke",
        voice: "da-DK-ChristelNeural",
        mode: "repeat",
        eyebrow: "Be honest",
        prompt: "I don't understand",
        expected: "Jeg forstår ikke.",
        note: "This quickly resets a difficult conversation.",
      },
      {
        conceptSlug: "kan-du-gentage",
        audioId: "learn-kan-du-gentage",
        voice: "da-DK-JeppeNeural",
        mode: "guided",
        eyebrow: "Try again",
        prompt: "Ask them to repeat.",
        expected: "Kan du gentage det?",
        note: "Gentage means repeat.",
      },
      {
        conceptSlug: "tal-langsommere",
        audioId: "learn-tal-langsommere",
        voice: "da-DK-ChristelNeural",
        mode: "open",
        eyebrow: "Slow down",
        prompt: "Ask them to speak more slowly.",
        expected: "Kan du tale lidt langsommere?",
        note: "Lidt makes the request softer.",
      },
    ],
  },
  {
    id: "make-plans",
    number: 8,
    title: "Make plans",
    description: "Keep an answer open and suggest an idea.",
    support: {
      title: "Plans",
      words: [
        { danish: "måske", english: "maybe" },
        { danish: "tog", english: "train" },
        { danish: "i morgen", english: "tomorrow" },
      ],
      starters: [
        { danish: "Måske …", english: "Maybe …" },
        { danish: "Skal vi …?", english: "Shall we …?" },
      ],
    },
    exercises: [
      {
        conceptSlug: "maaske",
        audioId: "learn-maaske",
        voice: "da-DK-JeppeNeural",
        mode: "repeat",
        eyebrow: "Keep it open",
        prompt: "Maybe",
        expected: "Måske.",
        note: "Måske can stand alone or start a longer answer.",
      },
      {
        conceptSlug: "skal-vi-infinitive",
        audioId: "learn-skal-vi-tage-toget",
        voice: "da-DK-ChristelNeural",
        mode: "open",
        eyebrow: "Suggest a plan",
        prompt: "Suggest taking the train.",
        expected: "Skal vi tage toget?",
        note: "Skal vi + a verb suggests doing something together.",
      },
    ],
  },
];

export const listenSpeakItems: ListenSpeakItem[] = [
  {
    id: "maybe-later",
    conceptSlug: "maaske",
    audioId: "listen-maaske-senere",
    voice: "da-DK-ChristelNeural",
    text: "Måske senere.",
    meaning: "Maybe later.",
    options: ["Maybe later.", "See you tomorrow.", "It is already late."],
  },
  {
    id: "maybe-tomorrow",
    conceptSlug: "maaske",
    audioId: "listen-maaske-i-morgen",
    voice: "da-DK-JeppeNeural",
    text: "Måske i morgen.",
    meaning: "Maybe tomorrow.",
    options: ["Maybe tomorrow.", "Tomorrow morning.", "Not tomorrow."],
  },
  {
    id: "yes-maybe",
    conceptSlug: "maaske",
    audioId: "listen-ja-maaske",
    voice: "da-DK-ChristelNeural",
    text: "Ja, måske.",
    meaning: "Yes, maybe.",
    options: ["Yes, maybe.", "Yes, of course.", "No, maybe not."],
  },
  {
    id: "anna-introduction",
    conceptSlug: "jeg-hedder",
    audioId: "listen-jeg-hedder-anna",
    voice: "da-DK-JeppeNeural",
    text: "Hej, jeg hedder Anna.",
    meaning: "Hi, my name is Anna.",
    options: ["Hi, my name is Anna.", "Anna is over here.", "Hi, do you know Anna?"],
  },
  {
    id: "mikkel-introduction",
    conceptSlug: "jeg-hedder",
    audioId: "listen-jeg-hedder-mikkel",
    voice: "da-DK-ChristelNeural",
    text: "Jeg hedder Mikkel.",
    meaning: "My name is Mikkel.",
    options: ["My name is Mikkel.", "I know Mikkel.", "Mikkel is here."],
  },
  {
    id: "sara-introduction",
    conceptSlug: "jeg-hedder",
    audioId: "listen-hej-jeg-hedder-sara",
    voice: "da-DK-JeppeNeural",
    text: "Hej, jeg hedder Sara.",
    meaning: "Hi, my name is Sara.",
    options: ["Hi, my name is Sara.", "Hi Sara, come in.", "Sara says hello."],
  },
  {
    id: "coffee-request",
    conceptSlug: "jeg-vil-gerne",
    audioId: "listen-jeg-vil-gerne-kaffe",
    voice: "da-DK-ChristelNeural",
    text: "Jeg vil gerne have en kaffe.",
    meaning: "I would like a coffee.",
    options: ["I would like a coffee.", "I have already had coffee.", "Is the coffee ready?"],
  },
  {
    id: "tea-request",
    conceptSlug: "jeg-vil-gerne",
    audioId: "listen-jeg-vil-gerne-te",
    voice: "da-DK-JeppeNeural",
    text: "Jeg vil gerne have en te.",
    meaning: "I would like a tea.",
    options: ["I would like a tea.", "The tea is ready.", "I do not drink tea."],
  },
  {
    id: "ticket-request",
    conceptSlug: "jeg-vil-gerne",
    audioId: "listen-jeg-vil-gerne-billet",
    voice: "da-DK-ChristelNeural",
    text: "Jeg vil gerne købe en billet.",
    meaning: "I would like to buy a ticket.",
    options: [
      "I would like to buy a ticket.",
      "I already have a ticket.",
      "Where can I buy a ticket?",
    ],
  },
  {
    id: "find-station",
    conceptSlug: "hvor-er-stationen",
    audioId: "listen-hvor-er-stationen",
    voice: "da-DK-JeppeNeural",
    text: "Hvor er stationen?",
    meaning: "Where is the station?",
    options: ["Where is the station?", "When does the train leave?", "Is this the last station?"],
  },
  {
    id: "find-toilet",
    conceptSlug: "hvor-er-stationen",
    audioId: "listen-hvor-er-toilettet",
    voice: "da-DK-ChristelNeural",
    text: "Hvor er toilettet?",
    meaning: "Where is the toilet?",
    options: ["Where is the toilet?", "Is the toilet free?", "Where is the station?"],
  },
  {
    id: "find-bus",
    conceptSlug: "hvor-er-stationen",
    audioId: "listen-hvor-er-bussen",
    voice: "da-DK-JeppeNeural",
    text: "Hvor er bussen?",
    meaning: "Where is the bus?",
    options: ["Where is the bus?", "When does the bus leave?", "Is this the bus?"],
  },
  {
    id: "repeat-that",
    conceptSlug: "kan-du-gentage",
    audioId: "listen-kan-du-gentage-det",
    voice: "da-DK-ChristelNeural",
    text: "Kan du gentage det?",
    meaning: "Can you repeat that?",
    options: ["Can you repeat that?", "Can you translate that?", "Can you write that down?"],
  },
  {
    id: "repeat-slowly",
    conceptSlug: "kan-du-gentage",
    audioId: "listen-kan-du-gentage-langsomt",
    voice: "da-DK-JeppeNeural",
    text: "Kan du gentage det langsomt?",
    meaning: "Can you repeat that slowly?",
    options: [
      "Can you repeat that slowly?",
      "Can you speak more loudly?",
      "Can you translate that?",
    ],
  },
  {
    id: "repeat-question",
    conceptSlug: "kan-du-gentage",
    audioId: "listen-kan-du-gentage-spoergsmaalet",
    voice: "da-DK-ChristelNeural",
    text: "Kan du gentage spørgsmålet?",
    meaning: "Can you repeat the question?",
    options: [
      "Can you repeat the question?",
      "Can you answer the question?",
      "Can you write the question?",
    ],
  },
  {
    id: "get-off-here",
    conceptSlug: "jeg-skal-af-her",
    audioId: "listen-jeg-skal-af-her",
    voice: "da-DK-JeppeNeural",
    text: "Jeg skal af her.",
    meaning: "I need to get off here.",
    options: ["I need to get off here.", "I am getting on here.", "I will wait here."],
  },
  {
    id: "get-off-next-stop",
    conceptSlug: "jeg-skal-af-her",
    audioId: "listen-jeg-skal-af-naeste-stop",
    voice: "da-DK-ChristelNeural",
    text: "Jeg skal af ved næste stop.",
    meaning: "I need to get off at the next stop.",
    options: [
      "I need to get off at the next stop.",
      "I got on at the last stop.",
      "The next stop is closed.",
    ],
  },
  {
    id: "get-off-now",
    conceptSlug: "jeg-skal-af-her",
    audioId: "listen-vi-skal-af-nu",
    voice: "da-DK-JeppeNeural",
    text: "Vi skal af nu.",
    meaning: "We need to get off now.",
    options: ["We need to get off now.", "We need to wait here.", "We are leaving now."],
  },
];

const speechClips = new Map<string, SpeechClip>([
  ...lessons.flatMap((lesson) =>
    lesson.exercises.map((exercise) => [
      exercise.audioId,
      { id: exercise.audioId, text: exercise.expected, voice: exercise.voice },
    ] as const),
  ),
  ...listenSpeakItems.map((item) => [
    item.audioId,
    { id: item.audioId, text: item.text, voice: item.voice },
  ] as const),
]);

function speechClipVersion(clip: SpeechClip) {
  const source = `${clip.voice}\0${clip.text}`;
  let hash = 2_166_136_261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(36);
}

export function getSpeechClip(id: string) {
  return speechClips.get(id) ?? null;
}

export function getSpeechClips() {
  return [...speechClips.values()];
}

export function getSpeechAudioUrl(id: string) {
  const clip = getSpeechClip(id);

  if (!clip) {
    return null;
  }

  return `/audio/danish/${encodeURIComponent(clip.id)}.mp3?v=${speechClipVersion(clip)}`;
}
