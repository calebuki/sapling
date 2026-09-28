import type { Line } from "@/lib/game/line";
import type { Villager } from "@/lib/game/villagers";

// The people of Lilla Ö. Each teaches a few units of the Swedish course.

export const villagers: Villager[] = [
  {
    id: "elin",
    name: "Elin",
    role: { t: "hamnvakt", en: "harbour keeper" },
    place: { t: "Bryggan", en: "The dock" },
    scenarioId: "meet-elin",
    round: "scene",
    stage: "guestbook",
    position: [3.2, 19.5],
    facing: Math.PI * 0.9,
    look: { skin: "#f3c9a8", hair: "#f2d27a", hairStyle: "braid", shirt: "#ffcf3f", pants: "#3c5a8a", accent: "#2f6fb5" },
    voicePitch: 1.25,
    voice: "Leda",
    context: "the ferry dock of Lilla Ö, a tiny Swedish island (Elin keeps the harbour)",
    greetings: [
      { t: "Hej igen! Vad kul att se dig!", en: "Hi again! How nice to see you!" },
      { t: "Hej! Är du redo för lite svenska?", en: "Hi! Are you ready for some Swedish?" },
      { t: "Tjena! Vilket fint väder idag!", en: "Hey! What nice weather today!" },
    ],
    chatter: [
      { t: "Båten kommer klockan tre.", en: "The boat comes at three o'clock." },
      { t: "Titta, en fågel!", en: "Look, a bird!" },
      { t: "Hej hej!", en: "Hi hi!" },
    ],
    locked: { t: "Hej!", en: "Hi!" },
    teach: { t: "Lär mig något!", en: "Teach me something!" },
    talk: { t: "Kan vi prata?", en: "Can we talk?" },
    goodbye: [
      { t: "Vi ses!", en: "See you!" },
      { t: "Ha det bra!", en: "Take care!" },
    ],
  },
  {
    id: "bosse",
    name: "Bosse",
    role: { t: "kafévärd", en: "café owner" },
    place: { t: "Café Kanel", en: "Café Cinnamon" },
    scenarioId: "fika-order",
    round: "cafe",
    stage: "guestbook",
    position: [-10.2, 4.8],
    facing: Math.PI * 0.35,
    look: { skin: "#e8b48f", hair: "#6b4a2f", hairStyle: "short", shirt: "#f4efe6", pants: "#4a3a2e", accent: "#c0392b", hat: "chef", beard: true, apron: "#c0392b", scale: 1.08 },
    voicePitch: 0.8,
    voice: "Achird",
    context: "Café Kanel on Lilla Ö, run by Bosse who bakes cinnamon buns",
    greetings: [
      { t: "Välkommen till Café Kanel!", en: "Welcome to Café Cinnamon!" },
      { t: "Mmm, känner du doften? Nybakat!", en: "Mmm, can you smell it? Freshly baked!" },
      { t: "Hej hej! Dags för fika?", en: "Hi hi! Time for fika?" },
    ],
    chatter: [
      { t: "Kanelbullar! Nybakade kanelbullar!", en: "Cinnamon buns! Freshly baked cinnamon buns!" },
      { t: "Kaffe är livet.", en: "Coffee is life." },
      { t: "Fika är viktigt.", en: "Fika is important." },
    ],
    locked: { t: "Förlåt, vi har stängt. Prata med Elin vid bryggan först!", en: "Sorry, we're closed. Talk to Elin by the dock first!" },
    teach: { t: "Vad finns på menyn?", en: "What's on the menu?" },
    talk: { t: "Jag vill beställa!", en: "I want to order!" },
    goodbye: [
      { t: "Välkommen åter!", en: "Welcome back (come again)!" },
      { t: "Hej då, ha en fin dag!", en: "Bye, have a nice day!" },
    ],
  },
  {
    id: "stina",
    name: "Stina",
    role: { t: "stationsvakt", en: "station master" },
    place: { t: "Stationen", en: "The station" },
    scenarioId: "centralstation-change",
    round: "scene",
    stage: "journey",
    position: [14.2, -1.2],
    facing: -Math.PI * 0.4,
    look: { skin: "#8d5a3b", hair: "#1f1a17", hairStyle: "bob", shirt: "#1f4e79", pants: "#1b2a3a", accent: "#f2c230", hat: "conductor" },
    voicePitch: 1.1,
    voice: "Erinome",
    context: "the island railway station and the train to the mainland (Stina is the station master)",
    greetings: [
      { t: "God dag! Tåget går i tid idag.", en: "Good day! The train is on time today." },
      { t: "Hej! Vart ska du resa?", en: "Hi! Where are you travelling?" },
      { t: "Välkommen till stationen!", en: "Welcome to the station!" },
    ],
    chatter: [
      { t: "Tåget går snart!", en: "The train leaves soon!" },
      { t: "Har du en biljett?", en: "Do you have a ticket?" },
      { t: "Spår två, spår två!", en: "Platform two, platform two!" },
    ],
    locked: { t: "Tåget går inte än. Har du varit på kaféet?", en: "The train isn't running yet. Have you been to the café?" },
    teach: { t: "Hjälp mig att resa!", en: "Help me travel!" },
    talk: { t: "Jag behöver hjälp!", en: "I need help!" },
    goodbye: [
      { t: "Trevlig resa!", en: "Have a nice trip!" },
      { t: "Vi ses på perrongen!", en: "See you on the platform!" },
    ],
  },
  {
    id: "astrid",
    name: "Astrid",
    role: { t: "trädgårdsmästare", en: "gardener" },
    place: { t: "Trädgården på berget", en: "The garden on the hill" },
    scenarioId: "make-weekend-plans",
    round: "scene",
    stage: "garden",
    position: [-2.2, -14.5],
    facing: Math.PI * 0.15,
    look: { skin: "#f0c4a4", hair: "#e6e6e6", hairStyle: "bun", shirt: "#7aa65a", pants: "#6b5a4a", accent: "#e76f8a", hat: "sunhat", scale: 0.95 },
    voicePitch: 0.95,
    voice: "Sulafat",
    context: "Astrid's vegetable and flower garden on the hill of Lilla Ö",
    greetings: [
      { t: "Nämen hej, lilla vän!", en: "Well hello, little friend!" },
      { t: "Blommorna växer så fint i år.", en: "The flowers are growing so nicely this year." },
      { t: "Sätt dig, sätt dig!", en: "Sit down, sit down!" },
    ],
    chatter: [
      { t: "Vilka fina blommor!", en: "What lovely flowers!" },
      { t: "Solen är varm idag.", en: "The sun is warm today." },
      { t: "Tomaterna är röda nu.", en: "The tomatoes are red now." },
    ],
    locked: { t: "Nämen hej! Kom tillbaka när du har rest med tåget.", en: "Well hello! Come back when you've taken the train." },
    teach: { t: "Berätta om din dag!", en: "Tell me about your day!" },
    talk: { t: "Ska vi göra något?", en: "Shall we do something?" },
    goodbye: [
      { t: "Hej då, kära du!", en: "Bye, dear!" },
      { t: "Kom snart tillbaka!", en: "Come back soon!" },
    ],
  },
];

// The first meeting doubles as the tutorial: hover-to-translate is taught in Swedish.
export const elinIntro: Line[] = [
  { t: "Hej! Välkommen till Lilla Ö!", en: "Hi! Welcome to Lilla Ö (Little Island)!" },
  { t: "Här pratar alla svenska.", en: "Everyone speaks Swedish here." },
  { t: "Förstår du inte? Håll musen över ett ord.", en: "Don't understand? Hold the mouse over a word." },
  { t: "Jag heter Elin. Vad heter du?", en: "My name is Elin. What's your name?" },
];

export const elinAfterName = (name: string): Line[] => [
  { t: `Trevligt att träffas, ${name}!`, en: `Nice to meet you, ${name}!` },
  { t: "Ser du det lilla trädet på torget? Det är ledset.", en: "Do you see the little tree in the square? It is sad." },
  { t: "Trädet växer när du lär dig svenska.", en: "The tree grows when you learn Swedish." },
  { t: "Kom, jag lär dig dina första ord!", en: "Come, I'll teach you your first words!" },
];

export const praise: Line[] = [
  { t: "Precis!", en: "Exactly!" },
  { t: "Snyggt!", en: "Nice!" },
  { t: "Perfekt!", en: "Perfect!" },
  { t: "Bra jobbat!", en: "Good job!" },
  { t: "Ja, så säger man!", en: "Yes, that's how you say it!" },
  { t: "Helt rätt!", en: "Completely right!" },
];

export const nudges: Line[] = [
  { t: "Nästan! Så här säger man:", en: "Almost! This is how you say it:" },
  { t: "Inte riktigt. Lyssna:", en: "Not quite. Listen:" },
  { t: "Bra försök! Man säger:", en: "Good try! You say:" },
];

export const roundDone: Line[] = [
  { t: "Bra jobbat idag!", en: "Good work today!" },
  { t: "Du lär dig så snabbt!", en: "You learn so fast!" },
  { t: "Vad duktig du är!", en: "How clever you are!" },
];

