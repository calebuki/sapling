import type { TargetLanguageCode } from "@/lib/learning/languages";
import type { PracticeCharacter, PracticeScenario } from "@/types/practice";

const characters: PracticeCharacter[] = [
  {
    id: "emil",
    name: "Emil",
    description: "Patient, dryly funny, and usually on his way to a bakery.",
  },
  {
    id: "elin",
    name: "Elin",
    description: "Warm, quick-witted harbour keeper of Lilla Ö who greets every new arrival at the dock.",
  },
  {
    id: "bosse",
    name: "Bosse",
    description: "Jolly, round-bellied owner of Café Kanel; proud of his cinnamon buns and a little theatrical.",
  },
  {
    id: "stina",
    name: "Stina",
    description: "Brisk, kind station master who loves timetables and gently teases travellers who rush.",
  },
  {
    id: "astrid",
    name: "Astrid",
    description: "Unhurried old gardener on the hill who has seen every summer on the island and loves making plans.",
  },
];

export function getPracticeCharacter(characterId: string): PracticeCharacter {
  return characters.find((character) => character.id === characterId) ?? characters[1];
}

const danishScenarios: PracticeScenario[] = [
  {
    id: "meet-emil",
    languageCode: "da",
    characterId: "emil",
    title: "Meet Emil",
    setting: "You meet outside a bakery in Nørrebro.",
    learnerRole: "Introduce yourself and get to know Emil.",
    characterRole: "A friendly local meeting you for the first time.",
    goal: "Exchange names and complete a short, natural introduction.",
    openingLine: "Hej! Jeg hedder Emil. Hvad hedder du?",
    openingEnglish: "Hi! My name is Emil. What is your name?",
    style: "roleplay",
    requiredConceptSlugs: ["hej", "jeg-hedder"],
    optionalConceptSlugs: ["hvad-hedder-du", "hyggeligt-at-moede-dig", "ja", "nej"],
    minimumEncountered: 0,
    minimumTurns: 3,
    maximumTurns: 5,
    starterHints: [
      { target: "Hej, jeg hedder …", english: "Hi, my name is …" },
      { target: "Hyggeligt at møde dig.", english: "Nice to meet you." },
    ],
    fallbackReplies: [
      { target: "Hyggeligt at møde dig! Hvad laver du til daglig?", english: "Nice to meet you! What do you do day to day?" },
      { target: "Det lyder godt. Bor du her i byen?", english: "That sounds good. Do you live here in the city?" },
      { target: "Godt at møde dig. Vi ses snart igen!", english: "Good to meet you. See you again soon!" },
    ],
  },
  {
    id: "bakery-order",
    languageCode: "da",
    characterId: "emil",
    title: "At the bakery",
    setting: "Emil has brought you to his favorite neighborhood bakery.",
    learnerRole: "Choose something and order it naturally.",
    characterRole: "Your friend, helping only when the conversation stalls.",
    goal: "Order a drink or pastry and respond to one follow-up question.",
    openingLine: "Hvad har du lyst til? Jeg tager en kaffe.",
    openingEnglish: "What would you like? I’m having a coffee.",
    style: "roleplay",
    requiredConceptSlugs: ["jeg-vil-gerne", "kaffe", "tak"],
    optionalConceptSlugs: ["te", "vand", "kanelsnegl", "med-maelk", "regningen-tak"],
    minimumEncountered: 2,
    minimumTurns: 3,
    maximumTurns: 6,
    starterHints: [
      { target: "Jeg vil gerne have …", english: "I would like …" },
      { target: "… med mælk, tak.", english: "… with milk, please." },
    ],
    fallbackReplies: [
      { target: "Godt valg. Vil du også have en kanelsnegl?", english: "Good choice. Would you also like a cinnamon roll?" },
      { target: "Skal vi sidde her eller tage det med?", english: "Should we sit here or take it with us?" },
      { target: "Perfekt. Jeg finder et bord.", english: "Perfect. I’ll find a table." },
    ],
  },
  {
    id: "station-change",
    languageCode: "da",
    characterId: "emil",
    title: "A change at the station",
    setting: "Your train platform changes while you and Emil are travelling.",
    learnerRole: "Find the right train and explain where you need to get off.",
    characterRole: "Your travelling companion.",
    goal: "Ask for direction, check the train, and confirm your stop.",
    openingLine: "Sporet er ændret. Ved du, hvor toget til København går fra?",
    openingEnglish: "The platform changed. Do you know where the train to Copenhagen leaves from?",
    style: "roleplay",
    requiredConceptSlugs: ["hvor-er-stationen", "toget-til-koebenhavn", "jeg-skal-af-her"],
    optionalConceptSlugs: ["kan-du-gentage", "tal-langsommere", "jeg-forstaar-ikke"],
    minimumEncountered: 2,
    minimumTurns: 4,
    maximumTurns: 6,
    starterHints: [
      { target: "Hvor er …?", english: "Where is …?" },
      { target: "Går dette tog til …?", english: "Does this train go to …?" },
    ],
    fallbackReplies: [
      { target: "Jeg tror, det er spor fem. Skal vi spørge nogen?", english: "I think it is platform five. Should we ask someone?" },
      { target: "Ja, det er det rigtige tog. Hvor skal du af?", english: "Yes, this is the right train. Where are you getting off?" },
      { target: "Fint, så siger jeg til, når vi er der.", english: "Great, then I’ll tell you when we are there." },
    ],
  },
  {
    id: "make-weekend-plans",
    languageCode: "da",
    characterId: "emil",
    title: "Make a plan",
    setting: "Emil asks what you want to do this weekend.",
    learnerRole: "Share a preference and suggest a plan.",
    characterRole: "A friend making plans with you.",
    goal: "Respond openly, suggest an activity, and agree on a next step.",
    openingLine: "Har du planer i weekenden? Skal vi finde på noget?",
    openingEnglish: "Do you have plans this weekend? Should we think of something to do?",
    style: "open_question",
    requiredConceptSlugs: ["maaske", "skal-vi-infinitive"],
    optionalConceptSlugs: ["ja", "nej", "kan-du-gentage"],
    minimumEncountered: 1,
    minimumTurns: 3,
    maximumTurns: 5,
    starterHints: [
      { target: "Måske …", english: "Maybe …" },
      { target: "Skal vi …?", english: "Should we …?" },
    ],
    fallbackReplies: [
      { target: "Det kunne være hyggeligt. Hvornår passer det dig?", english: "That could be nice. When works for you?" },
      { target: "Måske lørdag?", english: "Maybe Saturday?" },
      { target: "Så har vi en plan.", english: "Then we have a plan." },
    ],
  },
];

const swedishScenarios: PracticeScenario[] = [
  {
    id: "meet-elin",
    languageCode: "sv",
    characterId: "elin",
    title: "Meet Elin",
    setting: "You have just stepped off the ferry onto the dock of Lilla Ö, a small Swedish island village.",
    learnerRole: "Introduce yourself and get to know Elin.",
    characterRole: "The friendly harbour keeper meeting you for the first time.",
    goal: "Exchange names and complete a short, natural introduction.",
    openingLine: "Hej! Jag heter Elin. Vad heter du?",
    openingEnglish: "Hi! My name is Elin. What is your name?",
    style: "roleplay",
    requiredConceptSlugs: ["hej", "jag-heter"],
    optionalConceptSlugs: ["vad-heter-du", "trevligt-att-traeffas", "ja", "nej"],
    minimumEncountered: 0,
    minimumTurns: 3,
    maximumTurns: 5,
    starterHints: [
      { target: "Hej, jag heter …", english: "Hi, my name is …" },
      { target: "Trevligt att träffas.", english: "Nice to meet you." },
    ],
    fallbackReplies: [
      { target: "Trevligt att träffas! Vad gör du på dagarna?", english: "Nice to meet you! What do you do during the day?" },
      { target: "Det låter bra. Bor du här i stan?", english: "That sounds good. Do you live here in the city?" },
      { target: "Kul att träffas. Vi ses snart igen!", english: "Great to meet you. See you again soon!" },
    ],
  },
  {
    id: "fika-order",
    languageCode: "sv",
    characterId: "bosse",
    title: "Fika at Café Kanel",
    setting: "You step up to the counter of Café Kanel, the island's cosy café.",
    learnerRole: "Choose something and order it naturally.",
    characterRole: "Bosse, the café owner taking your order and chatting while he works.",
    goal: "Order a drink or pastry and respond to one follow-up question.",
    openingLine: "Välkommen till Café Kanel! Vad är du sugen på?",
    openingEnglish: "Welcome to Café Kanel! What are you in the mood for?",
    style: "roleplay",
    requiredConceptSlugs: ["jag-skulle-vilja", "kaffe", "tack"],
    optionalConceptSlugs: ["te", "vatten", "kanelbulle", "med-mjoelk", "notan-tack"],
    minimumEncountered: 2,
    minimumTurns: 3,
    maximumTurns: 6,
    starterHints: [
      { target: "Jag skulle vilja ha …", english: "I would like …" },
      { target: "… med mjölk, tack.", english: "… with milk, please." },
    ],
    fallbackReplies: [
      { target: "Bra val. Vill du också ha en kanelbulle?", english: "Good choice. Would you also like a cinnamon roll?" },
      { target: "Vill du sitta här eller ta med?", english: "Do you want to sit here or take it away?" },
      { target: "Varsågod! Det blir fyrtio kronor.", english: "Here you go! That will be forty kronor." },
    ],
  },
  {
    id: "centralstation-change",
    languageCode: "sv",
    characterId: "stina",
    title: "A change at the station",
    setting: "You are at the island's little railway station, about to take the train to the mainland.",
    learnerRole: "Find the right train and explain where you need to get off.",
    characterRole: "Stina, the station master helping travellers.",
    goal: "Ask for direction, check the train, and confirm your stop.",
    openingLine: "Hej hej! Spåret har ändrats idag. Vart ska du?",
    openingEnglish: "Hi there! The platform has changed today. Where are you going?",
    style: "roleplay",
    requiredConceptSlugs: ["var-ligger-stationen", "taget-till-stockholm", "jag-ska-av-haer"],
    optionalConceptSlugs: ["kan-du-upprepa", "prata-langsammare", "jag-foerstar-inte"],
    minimumEncountered: 2,
    minimumTurns: 4,
    maximumTurns: 6,
    starterHints: [
      { target: "Var ligger …?", english: "Where is …?" },
      { target: "Går det här tåget till …?", english: "Does this train go to …?" },
    ],
    fallbackReplies: [
      { target: "Tåget till Stockholm går från spår två.", english: "The train to Stockholm leaves from platform two." },
      { target: "Ja, det är rätt tåg. Var ska du gå av?", english: "Yes, this is the right train. Where are you getting off?" },
      { target: "Bra. Trevlig resa!", english: "Good. Have a nice trip!" },
    ],
  },
  {
    id: "make-weekend-plans",
    languageCode: "sv",
    characterId: "astrid",
    title: "Make a plan",
    setting: "Astrid, resting in her hilltop garden, asks what you want to do this weekend.",
    learnerRole: "Share a preference and suggest a plan.",
    characterRole: "Astrid, an old friend making plans with you.",
    goal: "Respond openly, suggest an activity, and agree on a next step.",
    openingLine: "Har du planer i helgen? Ska vi hitta på något?",
    openingEnglish: "Do you have plans this weekend? Should we think of something to do?",
    style: "open_question",
    requiredConceptSlugs: ["kanske", "ska-vi-infinitive"],
    optionalConceptSlugs: ["ja", "nej", "kan-du-upprepa"],
    minimumEncountered: 1,
    minimumTurns: 3,
    maximumTurns: 5,
    starterHints: [
      { target: "Kanske …", english: "Maybe …" },
      { target: "Ska vi …?", english: "Should we …?" },
    ],
    fallbackReplies: [
      { target: "Det vore trevligt. När passar det dig?", english: "That would be nice. When works for you?" },
      { target: "Kanske på lördag?", english: "Maybe Saturday?" },
      { target: "Då har vi en plan.", english: "Then we have a plan." },
    ],
  },
];

const scenarios: Record<TargetLanguageCode, PracticeScenario[]> = {
  da: danishScenarios,
  sv: swedishScenarios,
};

export function getPracticeScenarios(languageCode: TargetLanguageCode) {
  return scenarios[languageCode];
}

export function getPracticeScenario(
  languageCode: TargetLanguageCode,
  scenarioId: string,
) {
  return scenarios[languageCode].find((scenario) => scenario.id === scenarioId);
}
