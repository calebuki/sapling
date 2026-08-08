export type DanishVoice = "da-DK-ChristelNeural" | "da-DK-JeppeNeural";

export type LessonExercise = {
  conceptSlug: string;
  audioId: string;
  voice: DanishVoice;
  eyebrow: string;
  prompt: string;
  expected: string;
  note: string;
};

export type Lesson = {
  id: string;
  number: number;
  title: string;
  description: string;
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
    id: "first-steps",
    number: 1,
    title: "First steps",
    description: "Ask for something, soften an answer, and make a suggestion.",
    exercises: [
      {
        conceptSlug: "jeg-vil-gerne",
        audioId: "learn-jeg-vil-gerne",
        voice: "da-DK-ChristelNeural",
        eyebrow: "At the café",
        prompt: "Ask politely for a coffee.",
        expected: "Jeg vil gerne have en kaffe, tak.",
        note: "Jeg vil gerne … is a warm, everyday way to say what you would like.",
      },
      {
        conceptSlug: "maaske",
        audioId: "learn-maaske",
        voice: "da-DK-JeppeNeural",
        eyebrow: "Keep it open",
        prompt: "Say “Maybe.”",
        expected: "Måske.",
        note: "Måske works on its own or at the beginning of a longer answer.",
      },
      {
        conceptSlug: "skal-vi-infinitive",
        audioId: "learn-skal-vi-tage-toget",
        voice: "da-DK-ChristelNeural",
        eyebrow: "Make a plan",
        prompt: "Suggest that you take the train.",
        expected: "Skal vi tage toget?",
        note: "Skal vi + a verb is a natural way to suggest doing something together.",
      },
    ],
  },
  {
    id: "hello",
    number: 2,
    title: "Hello",
    description: "Introduce yourself and greet someone naturally.",
    exercises: [
      {
        conceptSlug: "jeg-hedder",
        audioId: "learn-jeg-hedder",
        voice: "da-DK-JeppeNeural",
        eyebrow: "Introduce yourself",
        prompt: "Say: “Hi, my name is Caleb.”",
        expected: "Hej, jeg hedder Caleb.",
        note: "Jeg hedder literally means “I am called” and is the normal Danish introduction.",
      },
      {
        conceptSlug: "hvad-hedder-du",
        audioId: "learn-hvad-hedder-du",
        voice: "da-DK-ChristelNeural",
        eyebrow: "Meet someone",
        prompt: "Ask: “What is your name?”",
        expected: "Hvad hedder du?",
        note: "Use this after your own introduction to keep the conversation moving.",
      },
      {
        conceptSlug: "hyggeligt-at-moede-dig",
        audioId: "learn-hyggeligt-at-moede-dig",
        voice: "da-DK-JeppeNeural",
        eyebrow: "A warm response",
        prompt: "Say: “Nice to meet you.”",
        expected: "Hyggeligt at møde dig.",
        note: "Hyggeligt is useful far beyond introductions—it suggests warmth and pleasant company.",
      },
    ],
  },
  {
    id: "at-the-cafe",
    number: 3,
    title: "At the café",
    description: "Order simply and ask for the bill.",
    exercises: [
      {
        conceptSlug: "en-kaffe-tak",
        audioId: "learn-en-kaffe-tak",
        voice: "da-DK-ChristelNeural",
        eyebrow: "Order simply",
        prompt: "Order a coffee, please.",
        expected: "En kaffe, tak.",
        note: "A short order with tak is completely natural in a Danish café.",
      },
      {
        conceptSlug: "jeg-tager",
        audioId: "learn-jeg-tager-kanelsnegl",
        voice: "da-DK-JeppeNeural",
        eyebrow: "Choose something",
        prompt: "Say: “I’ll have a cinnamon roll.”",
        expected: "Jeg tager en kanelsnegl.",
        note: "Jeg tager … is a relaxed way to choose from a menu.",
      },
      {
        conceptSlug: "regningen-tak",
        audioId: "learn-regningen-tak",
        voice: "da-DK-ChristelNeural",
        eyebrow: "Finish up",
        prompt: "Ask politely for the bill.",
        expected: "Må jeg bede om regningen?",
        note: "Må jeg bede om … is polite without sounding overly formal.",
      },
    ],
  },
  {
    id: "getting-around",
    number: 4,
    title: "Getting around",
    description: "Find the station and check the right train and stop.",
    exercises: [
      {
        conceptSlug: "hvor-er-stationen",
        audioId: "learn-hvor-er-stationen",
        voice: "da-DK-JeppeNeural",
        eyebrow: "Find your way",
        prompt: "Ask: “Where is the station?”",
        expected: "Hvor er stationen?",
        note: "Hvor er … is a dependable frame for asking where something is.",
      },
      {
        conceptSlug: "toget-til-koebenhavn",
        audioId: "learn-toget-til-koebenhavn",
        voice: "da-DK-ChristelNeural",
        eyebrow: "Check the train",
        prompt: "Ask if this train goes to Copenhagen.",
        expected: "Går dette tog til København?",
        note: "Går can mean “goes” when you are talking about transport.",
      },
      {
        conceptSlug: "jeg-skal-af-her",
        audioId: "learn-jeg-skal-af-her",
        voice: "da-DK-JeppeNeural",
        eyebrow: "Your stop",
        prompt: "Say: “I need to get off here.”",
        expected: "Jeg skal af her.",
        note: "Use skal af when you need to get off a bus or train.",
      },
    ],
  },
  {
    id: "when-you-need-help",
    number: 5,
    title: "When you need help",
    description: "Repair a conversation when Danish moves too quickly.",
    exercises: [
      {
        conceptSlug: "jeg-forstaar-ikke",
        audioId: "learn-jeg-forstaar-ikke",
        voice: "da-DK-ChristelNeural",
        eyebrow: "Be honest",
        prompt: "Say: “I don’t understand.”",
        expected: "Jeg forstår ikke.",
        note: "This simple sentence is often the fastest way to reset a conversation.",
      },
      {
        conceptSlug: "kan-du-gentage",
        audioId: "learn-kan-du-gentage",
        voice: "da-DK-JeppeNeural",
        eyebrow: "Try again",
        prompt: "Ask: “Can you repeat that?”",
        expected: "Kan du gentage det?",
        note: "Gentage means to repeat; det points back to what was just said.",
      },
      {
        conceptSlug: "tal-langsommere",
        audioId: "learn-tal-langsommere",
        voice: "da-DK-ChristelNeural",
        eyebrow: "Slow things down",
        prompt: "Ask someone to speak a little more slowly.",
        expected: "Kan du tale lidt langsommere?",
        note: "Lidt makes the request feel gentler and more conversational.",
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
