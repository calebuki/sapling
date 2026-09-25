export type ReadingPracticeItem = {
  id: string;
  kind: "reading";
  conceptSlug: string;
  setting: string;
  passage: string;
  question: string;
  options: [string, string, string];
  answer: string;
  explanation: string;
};

export type WritingPracticeItem = {
  id: string;
  kind: "writing";
  conceptSlug: string;
  setting: string;
  prompt: string;
  exampleAnswer: string;
  fallbackKeywords: string[];
  note: string;
};

export type TextPracticeItem = ReadingPracticeItem | WritingPracticeItem;

export const readingPracticeItems: ReadingPracticeItem[] = [
  {
    id: "read-anna-coffee",
    kind: "reading",
    conceptSlug: "jeg-vil-gerne",
    setting: "At a café",
    passage: "Anna: Hej. Jeg vil gerne have en kaffe med mælk, tak.",
    question: "What does Anna order?",
    options: ["Coffee with milk", "Tea with milk", "Coffee and water"],
    answer: "Coffee with milk",
    explanation: "“En kaffe med mælk” means a coffee with milk.",
  },
  {
    id: "read-mikkel-introduction",
    kind: "reading",
    conceptSlug: "jeg-hedder",
    setting: "Meeting someone",
    passage: "Hej! Jeg hedder Mikkel. Hvad hedder du?",
    question: "What does Mikkel ask?",
    options: ["Your name", "Where you live", "What you would like"],
    answer: "Your name",
    explanation: "“Hvad hedder du?” asks what someone is called.",
  },
  {
    id: "read-te-and-pastry",
    kind: "reading",
    conceptSlug: "og-en-kanelsnegl",
    setting: "At the counter",
    passage: "Jeg vil gerne have en te og en kanelsnegl, tak.",
    question: "What two things does the customer want?",
    options: ["Tea and a cinnamon roll", "Coffee and milk", "Water and a ticket"],
    answer: "Tea and a cinnamon roll",
    explanation: "The order contains “en te” and “en kanelsnegl.”",
  },
  {
    id: "read-find-station",
    kind: "reading",
    conceptSlug: "hvor-er-stationen",
    setting: "In the city",
    passage: "Undskyld, hvor er stationen? Stationen er derovre.",
    question: "What is the person looking for?",
    options: ["The station", "The café", "The toilet"],
    answer: "The station",
    explanation: "“Hvor er stationen?” means “Where is the station?”",
  },
  {
    id: "read-next-stop",
    kind: "reading",
    conceptSlug: "jeg-skal-af-her",
    setting: "On the train",
    passage: "Sara: Jeg skal af ved næste stop.\nEmil: Okay, vi skal af nu.",
    question: "When does Sara need to get off?",
    options: ["At the next stop", "Tomorrow", "At the station café"],
    answer: "At the next stop",
    explanation: "“Ved næste stop” means at the next stop.",
  },
  {
    id: "read-repeat-slowly",
    kind: "reading",
    conceptSlug: "kan-du-gentage",
    setting: "A difficult conversation",
    passage: "Jeg forstår ikke. Kan du gentage det langsomt?",
    question: "What does the speaker need?",
    options: ["The sentence repeated slowly", "The answer written down", "The speaker to leave"],
    answer: "The sentence repeated slowly",
    explanation: "The speaker does not understand and asks for a slow repetition.",
  },
  {
    id: "read-maybe-tomorrow",
    kind: "reading",
    conceptSlug: "maaske",
    setting: "Making a plan",
    passage: "Emil: Skal vi tage toget i dag?\nAnna: Nej, måske i morgen.",
    question: "When might Anna take the train?",
    options: ["Tomorrow", "Today", "Next week"],
    answer: "Tomorrow",
    explanation: "“Måske i morgen” means maybe tomorrow.",
  },
  {
    id: "read-train-to-copenhagen",
    kind: "reading",
    conceptSlug: "toget-til-koebenhavn",
    setting: "At the station",
    passage: "Undskyld, er det toget til København? Ja, det er det.",
    question: "Where is the train going?",
    options: ["Copenhagen", "Aarhus", "The airport"],
    answer: "Copenhagen",
    explanation: "“Toget til København” is the train to Copenhagen.",
  },
  {
    id: "read-ask-for-bill",
    kind: "reading",
    conceptSlug: "cafe-ask-bill",
    setting: "After lunch",
    passage: "Tak for maden. Må jeg bede om regningen?",
    question: "What does the customer ask for?",
    options: ["The bill", "The menu", "Another coffee"],
    answer: "The bill",
    explanation: "“Regningen” is the bill.",
  },
  {
    id: "read-water-not-coffee",
    kind: "reading",
    conceptSlug: "vand",
    setting: "At a café",
    passage: "Vil du have kaffe? Nej tak, jeg vil gerne have vand.",
    question: "What does the customer choose?",
    options: ["Water", "Coffee", "Tea"],
    answer: "Water",
    explanation: "The customer says no to coffee and asks for water.",
  },
  {
    id: "read-nice-to-meet-you",
    kind: "reading",
    conceptSlug: "hyggeligt-at-moede-dig",
    setting: "A first meeting",
    passage: "Sara: Jeg hedder Sara.\nCaleb: Hej Sara. Hyggeligt at møde dig.",
    question: "How does Caleb respond to the introduction?",
    options: ["Nice to meet you", "See you tomorrow", "Please speak slowly"],
    answer: "Nice to meet you",
    explanation: "“Hyggeligt at møde dig” is a warm “Nice to meet you.”",
  },
  {
    id: "read-plan-change",
    kind: "reading",
    conceptSlug: "skal-vi-infinitive",
    setting: "Planning the day",
    passage: "Skal vi tage toget? Nej, måske skal vi tage bussen.",
    question: "What alternative is suggested?",
    options: ["Taking the bus", "Walking home", "Going tomorrow"],
    answer: "Taking the bus",
    explanation: "The second speaker suggests taking the bus instead.",
  },
];

export const writingPracticeItems: WritingPracticeItem[] = [
  {
    id: "write-greeting",
    kind: "writing",
    conceptSlug: "hej",
    setting: "Meeting someone",
    prompt: "Greet someone in Danish.",
    exampleAnswer: "Hej!",
    fallbackKeywords: ["hej"],
    note: "Hej is the everyday Danish greeting.",
  },
  {
    id: "write-introduction",
    kind: "writing",
    conceptSlug: "jeg-hedder",
    setting: "A first meeting",
    prompt: "Introduce yourself by name.",
    exampleAnswer: "Hej, jeg hedder Caleb.",
    fallbackKeywords: ["jeg", "hedder"],
    note: "Use jeg hedder followed by your name.",
  },
  {
    id: "write-ask-name",
    kind: "writing",
    conceptSlug: "hvad-hedder-du",
    setting: "Meeting someone",
    prompt: "Ask the other person’s name.",
    exampleAnswer: "Hvad hedder du?",
    fallbackKeywords: ["hedder", "du"],
    note: "Hvad hedder du? asks what someone is called.",
  },
  {
    id: "write-coffee-milk",
    kind: "writing",
    conceptSlug: "jeg-vil-gerne",
    setting: "At a café",
    prompt: "Politely order a coffee with milk.",
    exampleAnswer: "Jeg vil gerne have en kaffe med mælk, tak.",
    fallbackKeywords: ["kaffe", "mælk"],
    note: "Jeg vil gerne have … is a natural polite request.",
  },
  {
    id: "write-add-pastry",
    kind: "writing",
    conceptSlug: "og-en-kanelsnegl",
    setting: "At the counter",
    prompt: "Add a cinnamon roll to your order.",
    exampleAnswer: "Og en kanelsnegl, tak.",
    fallbackKeywords: ["kanelsnegl"],
    note: "Og adds another item to the order.",
  },
  {
    id: "write-find-station",
    kind: "writing",
    conceptSlug: "hvor-er-stationen",
    setting: "In the city",
    prompt: "Ask where the station is.",
    exampleAnswer: "Hvor er stationen?",
    fallbackKeywords: ["hvor", "station"],
    note: "Hvor er …? asks where something is.",
  },
  {
    id: "write-repeat",
    kind: "writing",
    conceptSlug: "kan-du-gentage",
    setting: "A difficult conversation",
    prompt: "Ask someone to repeat what they said.",
    exampleAnswer: "Kan du gentage det?",
    fallbackKeywords: ["gentag"],
    note: "Kan du …? is a useful way to ask someone to do something.",
  },
  {
    id: "write-slower",
    kind: "writing",
    conceptSlug: "tal-langsommere",
    setting: "A difficult conversation",
    prompt: "Ask someone to speak more slowly.",
    exampleAnswer: "Kan du tale langsommere?",
    fallbackKeywords: ["langsom"],
    note: "Langsommere means more slowly.",
  },
  {
    id: "write-get-off",
    kind: "writing",
    conceptSlug: "jeg-skal-af-her",
    setting: "On the train",
    prompt: "Say that you need to get off here.",
    exampleAnswer: "Jeg skal af her.",
    fallbackKeywords: ["af", "her"],
    note: "Skal af is used when getting off public transport.",
  },
  {
    id: "write-suggest-train",
    kind: "writing",
    conceptSlug: "skal-vi-infinitive",
    setting: "Making a plan",
    prompt: "Suggest taking the train together.",
    exampleAnswer: "Skal vi tage toget?",
    fallbackKeywords: ["vi", "tog"],
    note: "Skal vi + a verb suggests a shared action.",
  },
  {
    id: "write-maybe-tomorrow",
    kind: "writing",
    conceptSlug: "maaske",
    setting: "Making a plan",
    prompt: "Say “Maybe tomorrow” in Danish.",
    exampleAnswer: "Måske i morgen.",
    fallbackKeywords: ["måske", "morgen"],
    note: "Måske expresses uncertainty or possibility.",
  },
  {
    id: "write-bill",
    kind: "writing",
    conceptSlug: "cafe-ask-bill",
    setting: "After a meal",
    prompt: "Politely ask for the bill.",
    exampleAnswer: "Må jeg bede om regningen?",
    fallbackKeywords: ["regning"],
    note: "Må jeg bede om …? is a polite way to ask for something.",
  },
];

export function getWritingPracticeItem(id: string) {
  return writingPracticeItems.find((item) => item.id === id) ?? null;
}
