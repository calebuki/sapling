// Villagers are the only way learning reaches the player: each one owns a slice
// of the Swedish course and one live-conversation scenario.

export type Line = { sv: string; en: string };

export type VillagerId = "elin" | "bosse" | "stina" | "astrid";

export type CharacterLook = {
  skin: string;
  hair: string;
  hairStyle: "bob" | "braid" | "short" | "bun" | "beanie";
  shirt: string;
  pants: string;
  accent: string;
  hat?: "conductor" | "sunhat" | "chef" | "beanie";
  beard?: boolean;
  apron?: string;
  scale?: number;
};

export type Villager = {
  id: VillagerId;
  name: string;
  role: Line;
  place: Line;
  scenarioId: string;
  conceptSlugs: string[];
  position: [number, number];
  facing: number;
  look: CharacterLook;
  voicePitch: number;
  greetings: Line[];
  chatter: Line[];
  locked: Line;
  teach: Line;
  talk: Line;
  goodbye: Line[];
};

export const villagers: Villager[] = [
  {
    id: "elin",
    name: "Elin",
    role: { sv: "hamnvakt", en: "harbour keeper" },
    place: { sv: "Bryggan", en: "The dock" },
    scenarioId: "meet-elin",
    conceptSlugs: ["hej", "tack", "ja", "nej", "jag-heter", "vad-heter-du", "trevligt-att-traeffas", "vet-inte", "det-aer"],
    position: [3.2, 19.5],
    facing: Math.PI * 0.9,
    look: { skin: "#f3c9a8", hair: "#f2d27a", hairStyle: "braid", shirt: "#ffcf3f", pants: "#3c5a8a", accent: "#2f6fb5" },
    voicePitch: 1.25,
    greetings: [
      { sv: "Hej igen! Vad kul att se dig!", en: "Hi again! How nice to see you!" },
      { sv: "Hej! Är du redo för lite svenska?", en: "Hi! Are you ready for some Swedish?" },
      { sv: "Tjena! Vilket fint väder idag!", en: "Hey! What nice weather today!" },
    ],
    chatter: [
      { sv: "Båten kommer klockan tre.", en: "The boat comes at three o'clock." },
      { sv: "Titta, en fågel!", en: "Look, a bird!" },
      { sv: "Hej hej!", en: "Hi hi!" },
    ],
    locked: { sv: "Hej!", en: "Hi!" },
    teach: { sv: "Lär mig något!", en: "Teach me something!" },
    talk: { sv: "Kan vi prata?", en: "Can we talk?" },
    goodbye: [
      { sv: "Vi ses!", en: "See you!" },
      { sv: "Ha det bra!", en: "Take care!" },
    ],
  },
  {
    id: "bosse",
    name: "Bosse",
    role: { sv: "kafévärd", en: "café owner" },
    place: { sv: "Café Kanel", en: "Café Cinnamon" },
    scenarioId: "fika-order",
    conceptSlugs: ["kaffe", "te", "vatten", "mjoelk", "kanelbulle", "jag-skulle-vilja", "med-mjoelk", "och-en-kanelbulle", "vill-ha", "gillar", "har", "cafe-order-drink", "cafe-order-food", "cafe-ask-bill"],
    position: [-10.2, 4.8],
    facing: Math.PI * 0.35,
    look: { skin: "#e8b48f", hair: "#6b4a2f", hairStyle: "short", shirt: "#f4efe6", pants: "#4a3a2e", accent: "#c0392b", hat: "chef", beard: true, apron: "#c0392b", scale: 1.08 },
    voicePitch: 0.8,
    greetings: [
      { sv: "Välkommen till Café Kanel!", en: "Welcome to Café Cinnamon!" },
      { sv: "Mmm, känner du doften? Nybakat!", en: "Mmm, can you smell it? Freshly baked!" },
      { sv: "Hej hej! Dags för fika?", en: "Hi hi! Time for fika?" },
    ],
    chatter: [
      { sv: "Kanelbullar! Nybakade kanelbullar!", en: "Cinnamon buns! Freshly baked cinnamon buns!" },
      { sv: "Kaffe är livet.", en: "Coffee is life." },
      { sv: "Fika är viktigt.", en: "Fika is important." },
    ],
    locked: { sv: "Förlåt, vi har stängt. Prata med Elin vid bryggan först!", en: "Sorry, we're closed. Talk to Elin by the dock first!" },
    teach: { sv: "Vad finns på menyn?", en: "What's on the menu?" },
    talk: { sv: "Jag vill beställa!", en: "I want to order!" },
    goodbye: [
      { sv: "Välkommen åter!", en: "Welcome back (come again)!" },
      { sv: "Hej då, ha en fin dag!", en: "Bye, have a nice day!" },
    ],
  },
  {
    id: "stina",
    name: "Stina",
    role: { sv: "stationsvakt", en: "station master" },
    place: { sv: "Stationen", en: "The station" },
    scenarioId: "centralstation-change",
    conceptSlugs: ["var-ligger-stationen", "taget-till-stockholm", "jag-ska-av-haer", "jag-foerstar-inte", "kan-du-upprepa", "prata-langsammare", "finns", "kan", "behoever"],
    position: [14.2, -1.2],
    facing: -Math.PI * 0.4,
    look: { skin: "#8d5a3b", hair: "#1f1a17", hairStyle: "bob", shirt: "#1f4e79", pants: "#1b2a3a", accent: "#f2c230", hat: "conductor" },
    voicePitch: 1.1,
    greetings: [
      { sv: "God dag! Tåget går i tid idag.", en: "Good day! The train is on time today." },
      { sv: "Hej! Vart ska du resa?", en: "Hi! Where are you travelling?" },
      { sv: "Välkommen till stationen!", en: "Welcome to the station!" },
    ],
    chatter: [
      { sv: "Tåget går snart!", en: "The train leaves soon!" },
      { sv: "Har du en biljett?", en: "Do you have a ticket?" },
      { sv: "Spår två, spår två!", en: "Platform two, platform two!" },
    ],
    locked: { sv: "Tåget går inte än. Har du varit på kaféet?", en: "The train isn't running yet. Have you been to the café?" },
    teach: { sv: "Hjälp mig att resa!", en: "Help me travel!" },
    talk: { sv: "Jag behöver hjälp!", en: "I need help!" },
    goodbye: [
      { sv: "Trevlig resa!", en: "Have a nice trip!" },
      { sv: "Vi ses på perrongen!", en: "See you on the platform!" },
    ],
  },
  {
    id: "astrid",
    name: "Astrid",
    role: { sv: "trädgårdsmästare", en: "gardener" },
    place: { sv: "Trädgården på berget", en: "The garden on the hill" },
    scenarioId: "make-weekend-plans",
    conceptSlugs: ["kanske", "ska-vi-infinitive", "v2-idag", "negation", "past-gick", "perfect-har"],
    position: [-2.2, -14.5],
    facing: Math.PI * 0.15,
    look: { skin: "#f0c4a4", hair: "#e6e6e6", hairStyle: "bun", shirt: "#7aa65a", pants: "#6b5a4a", accent: "#e76f8a", hat: "sunhat", scale: 0.95 },
    voicePitch: 0.95,
    greetings: [
      { sv: "Nämen hej, lilla vän!", en: "Well hello, little friend!" },
      { sv: "Blommorna växer så fint i år.", en: "The flowers are growing so nicely this year." },
      { sv: "Sätt dig, sätt dig!", en: "Sit down, sit down!" },
    ],
    chatter: [
      { sv: "Vilka fina blommor!", en: "What lovely flowers!" },
      { sv: "Solen är varm idag.", en: "The sun is warm today." },
      { sv: "Tomaterna är röda nu.", en: "The tomatoes are red now." },
    ],
    locked: { sv: "Nämen hej! Kom tillbaka när du har rest med tåget.", en: "Well hello! Come back when you've taken the train." },
    teach: { sv: "Berätta om din dag!", en: "Tell me about your day!" },
    talk: { sv: "Ska vi göra något?", en: "Shall we do something?" },
    goodbye: [
      { sv: "Hej då, kära du!", en: "Bye, dear!" },
      { sv: "Kom snart tillbaka!", en: "Come back soon!" },
    ],
  },
];

export function getVillager(id: VillagerId) {
  return villagers.find((villager) => villager.id === id)!;
}

// The first meeting doubles as the tutorial: hover-to-translate is taught in Swedish.
export const elinIntro: Line[] = [
  { sv: "Hej! Välkommen till Lilla Ö!", en: "Hi! Welcome to Lilla Ö (Little Island)!" },
  { sv: "Här pratar alla svenska.", en: "Everyone speaks Swedish here." },
  { sv: "Förstår du inte? Håll musen över ett ord.", en: "Don't understand? Hold the mouse over a word." },
  { sv: "Jag heter Elin. Vad heter du?", en: "My name is Elin. What's your name?" },
];

export const elinAfterName = (name: string): Line[] => [
  { sv: `Trevligt att träffas, ${name}!`, en: `Nice to meet you, ${name}!` },
  { sv: "Ser du det lilla trädet på torget? Det är ledset.", en: "Do you see the little tree in the square? It is sad." },
  { sv: "Trädet växer när du lär dig svenska.", en: "The tree grows when you learn Swedish." },
  { sv: "Kom, jag lär dig dina första ord!", en: "Come, I'll teach you your first words!" },
];

export const praise: Line[] = [
  { sv: "Precis!", en: "Exactly!" },
  { sv: "Snyggt!", en: "Nice!" },
  { sv: "Perfekt!", en: "Perfect!" },
  { sv: "Bra jobbat!", en: "Good job!" },
  { sv: "Ja, så säger man!", en: "Yes, that's how you say it!" },
  { sv: "Helt rätt!", en: "Completely right!" },
];

export const nudges: Line[] = [
  { sv: "Nästan! Så här säger man:", en: "Almost! This is how you say it:" },
  { sv: "Inte riktigt. Lyssna:", en: "Not quite. Listen:" },
  { sv: "Bra försök! Man säger:", en: "Good try! You say:" },
];

export const roundDone: Line[] = [
  { sv: "Bra jobbat idag!", en: "Good work today!" },
  { sv: "Du lär dig så snabbt!", en: "You learn so fast!" },
  { sv: "Vad duktig du är!", en: "How clever you are!" },
];

export function pick<T>(items: readonly T[], seed = Math.random()) {
  return items[Math.floor(seed * items.length) % items.length];
}
