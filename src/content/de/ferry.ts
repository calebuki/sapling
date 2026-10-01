import type { DayTime, FerryConfig, FerryCountry, FerryPerson, Greeting } from "@/lib/game/ferry";
import { spoken } from "@/lib/game/line";

// Greta's ferry. Passengers come down the landing stage; you greet them for
// the time of day, ask their name the right way (du to children, Sie to
// adults), put them on the list as they introduce themselves, and see them
// aboard. Each sentence a passenger says is recorded once and reused.

const people: FerryPerson[] = [
  { id: "anna", name: "Anna Weber", decoys: ["Anna Werner", "Hanna Weber"], gender: "woman", register: "Sie" },
  { id: "thomas", name: "Thomas Müller", decoys: ["Thomas Möller", "Tobias Müller"], gender: "man", register: "Sie" },
  { id: "petra", name: "Petra Schmidt", decoys: ["Petra Schmitz", "Peter Schmidt"], gender: "woman", register: "Sie" },
  { id: "klaus", name: "Klaus Fischer", decoys: ["Klaus Fiedler", "Hans Fischer"], gender: "man", register: "Sie" },
  { id: "sabine", name: "Sabine Wagner", decoys: ["Sabine Wegner", "Sabine Bauer"], gender: "woman", register: "Sie" },
  { id: "juergen", name: "Jürgen Becker", decoys: ["Jürgen Decker", "Jörg Becker"], gender: "man", register: "Sie" },
  { id: "monika", name: "Monika Hoffmann", decoys: ["Monika Hartmann", "Monika Hofer"], gender: "woman", register: "Sie" },
  { id: "peter", name: "Peter Schulz", decoys: ["Peter Scholz", "Dieter Schulz"], gender: "man", register: "Sie" },
  { id: "mia", name: "Mia", decoys: ["Mila", "Nina"], gender: "woman", register: "du" },
  { id: "leon", name: "Leon", decoys: ["Leo", "Levin"], gender: "man", register: "du" },
  { id: "emma", name: "Emma", decoys: ["Emmi", "Ella"], gender: "woman", register: "du" },
  { id: "ben", name: "Ben", decoys: ["Benno", "Tim"], gender: "man", register: "du" },
  { id: "lea", name: "Lea", decoys: ["Leni", "Lisa"], gender: "woman", register: "du" },
  { id: "finn", name: "Finn", decoys: ["Jan", "Fritz"], gender: "man", register: "du" },
  { id: "lukas", name: "Lukas", decoys: ["Luis", "Linus"], gender: "man", register: "du" },
  { id: "sophie", name: "Sophie", decoys: ["Sarah", "Sina"], gender: "woman", register: "du" },
];

// "aus der Schweiz": the one country here that keeps its article.
const countries: Array<FerryCountry & { aus?: string }> = [
  { id: "deutschland", name: { t: "Deutschland", en: "Germany" }, concept: "deutschland", languages: ["deutsch"] },
  { id: "oesterreich", name: { t: "Österreich", en: "Austria" }, concept: null, languages: ["deutsch"] },
  { id: "schweiz", name: { t: "die Schweiz", en: "Switzerland" }, concept: null, languages: ["deutsch"], aus: "der Schweiz" },
  { id: "england", name: { t: "England", en: "England" }, concept: null, languages: ["englisch"] },
  { id: "spanien", name: { t: "Spanien", en: "Spain" }, concept: null, languages: ["spanisch"] },
  { id: "italien", name: { t: "Italien", en: "Italy" }, concept: null, languages: ["italienisch"] },
  { id: "frankreich", name: { t: "Frankreich", en: "France" }, concept: null, languages: ["franzoesisch"] },
];

const cities = [
  { id: "berlin", name: { t: "Berlin", en: "Berlin" }, concept: null },
  { id: "hamburg", name: { t: "Hamburg", en: "Hamburg" }, concept: null },
  { id: "muenchen", name: { t: "München", en: "Munich" }, concept: null },
  { id: "wien", name: { t: "Wien", en: "Vienna" }, concept: null },
  { id: "zuerich", name: { t: "Zürich", en: "Zurich" }, concept: null },
  { id: "london", name: { t: "London", en: "London" }, concept: null },
  { id: "madrid", name: { t: "Madrid", en: "Madrid" }, concept: null },
  { id: "rom", name: { t: "Rom", en: "Rome" }, concept: null },
  { id: "tannenau", name: { t: "Tannenau", en: "Tannenau" }, concept: null },
];

const languages = [
  { id: "deutsch", name: { t: "Deutsch", en: "German" }, concept: "deutsch" },
  { id: "englisch", name: { t: "Englisch", en: "English" }, concept: "englisch" },
  { id: "spanisch", name: { t: "Spanisch", en: "Spanish" }, concept: null },
  { id: "italienisch", name: { t: "Italienisch", en: "Italian" }, concept: null },
  { id: "franzoesisch", name: { t: "Französisch", en: "French" }, concept: null },
];

const greeting = (concept: string, accept: string[], times: DayTime[] | null, t: string, en: string): Greeting => ({ concept, accept, times, reply: { t, en } });

const greetings: Greeting[] = [
  greeting("guten-morgen", [String.raw`\bguten morgen\b`, String.raw`^morgen\b`], ["morning"], "Guten Morgen!", "Good morning!"),
  greeting("guten-tag", [String.raw`\bguten tag\b`, String.raw`^tag\b`], ["day"], "Guten Tag!", "Hello! (good day)"),
  greeting("guten-abend", [String.raw`\bguten abend\b`, String.raw`^n?abend\b`], ["evening"], "Guten Abend!", "Good evening!"),
  greeting("hallo", [String.raw`\bhallo\b`, String.raw`\bgrüß dich\b`, String.raw`\bservus\b`, String.raw`\bmoin\b`], null, "Hallo!", "Hi!"),
  greeting("gruess-gott", [String.raw`\bgrüß gott\b`], null, "Grüß Gott!", "Hello! (southern Germany)"),
];

const farewells: Greeting[] = [
  greeting("tschuess", [String.raw`\btschüs+\b`, String.raw`\bciao\b`], null, "Tschüss!", "Bye!"),
  greeting("auf-wiedersehen", [String.raw`\b(auf )?wiedersehen\b`], null, "Auf Wiedersehen!", "Goodbye!"),
  greeting("bis-bald", [String.raw`\bbis bald\b`], null, "Bis bald!", "See you soon!"),
  greeting("bis-morgen", [String.raw`\bbis morgen\b`], null, "Bis morgen!", "See you tomorrow!"),
  greeting("gute-nacht", [String.raw`\bgute nacht\b`], ["evening"], "Gute Nacht!", "Good night!"),
];

const timeWord: Record<DayTime, { t: string; en: string }> = {
  morning: { t: "Es ist doch noch Morgen!", en: "But it's still morning!" },
  day: { t: "Es ist doch Mittag!", en: "But it's midday!" },
  evening: { t: "Es ist doch schon Abend!", en: "But it's evening already!" },
};

// "Weber: W, E, B, E, R." Adults spell their surname, children their name.
function letters(name: string) {
  return [...name].map((c) => c.toUpperCase()).join(", ");
}

export const ferry: FerryConfig = {
  host: "greta",
  people,
  countries,
  cities,
  languages,
  frames: { name: "ich-heisse", from: "ich-komme-aus", lives: "ich-wohne-in", speaks: "ich-spreche" },
  aLittle: "ein-bisschen",
  greetings,
  farewells,
  farewellFor: { du: "tschuess", Sie: "auf-wiedersehen" },
  askName: {
    du: { concept: "wie-heisst-du", accept: [String.raw`\bwie heißt du\b`, String.raw`\bwie ist dein name\b`, String.raw`\bwer bist du\b`], say: { t: "Wie heißt du?", en: "What's your name?" } },
    Sie: {
      concept: "wie-heissen-sie",
      accept: [String.raw`\bwie heißen sie\b`, String.raw`\bwie ist ihr name\b`, String.raw`\bwer sind sie\b`],
      say: { t: "Wie heißen Sie?", en: "What's your name? (formal)" },
    },
  },
  repairs: {
    again: { concept: "wie-bitte", say: { du: { t: "Wie bitte?", en: "Pardon?" }, Sie: { t: "Wie bitte?", en: "Pardon?" } } },
    slower: {
      concept: "langsamer",
      say: { du: { t: "Kannst du langsamer sprechen?", en: "Can you speak more slowly?" }, Sie: { t: "Können Sie langsamer sprechen?", en: "Can you speak more slowly? (formal)" } },
    },
    spell: { concept: "wie-schreibt-man", say: { du: { t: "Wie schreibt man das?", en: "How do you spell that?" }, Sie: { t: "Wie schreibt man das?", en: "How do you spell that?" } } },
  },
  times: {
    morning: { t: "Morgen", en: "morning" },
    day: { t: "Mittag", en: "midday" },
    evening: { t: "Abend", en: "evening" },
  },
  introduce(person) {
    return { t: `Ich heiße ${person.name}.`, en: `My name is ${person.name}.` };
  },
  from(country) {
    const c = country as FerryCountry & { aus?: string };
    return { t: `Ich komme aus ${c.aus ?? c.name.t}.`, en: `I'm from ${c.name.en}.` };
  },
  lives(city) {
    return { t: `Ich wohne in ${city.name.t}.`, en: `I live in ${city.name.en}.` };
  },
  speaks(spoken, aLittle) {
    const names = spoken.map((l) => l.name);
    if (aLittle) names.push({ t: `ein bisschen ${aLittle.name.t}`, en: `a little ${aLittle.name.en}` });
    const join = (key: "t" | "en", and: string) => (names.length > 1 ? `${names.slice(0, -1).map((n) => n[key]).join(", ")} ${and} ${names[names.length - 1][key]}` : names[0][key]);
    return { t: `Ich spreche ${join("t", "und")}.`, en: `I speak ${join("en", "and")}.` };
  },
  spell(person) {
    const word = person.register === "Sie" ? person.name.split(" ").slice(-1)[0] : person.name;
    return { t: `${word}: ${letters(word)}.`, en: `${word}: ${letters(word)}.` };
  },
  wrongTime(said, time, right) {
    const asked = said.reply.t.replace(/!$/, "?");
    return spoken([asked, timeWord[time].t, right.reply.t], `${said.reply.en.replace(/!$/, "?")} ${timeWord[time].en} ${right.reply.en}`);
  },
  wrongRegister(person) {
    return person.register === "du"
      ? { t: "Du kannst „du“ zu mir sagen!", en: "You can say “du” to me!" }
      : { t: "Oh, wir sind doch nicht per du!", en: "Oh, we're not on first-name terms!" };
  },
  lines: {
    invite: { t: "Kann ich dir helfen?", en: "Can I help you?" },
    notYet: { t: "Lern zuerst, wie man sich vorstellt!", en: "First learn how to introduce yourself!" },
    intro: [
      { t: "Hallo! Gut, dass du da bist. Die Fähre fährt gleich ab!", en: "Hi! Good that you're here. The ferry leaves soon!" },
      { t: "Begrüß die Fahrgäste und schreib ihre Namen in die Liste.", en: "Greet the passengers and write their names on the list." },
      { t: "Und wenn du etwas nicht verstehst, frag einfach: Wie bitte?", en: "And if you don't understand something, just ask: pardon?" },
    ],
    registerIntro: { t: "Zu Kindern sagst du „du“. Zu Erwachsenen sagst du „Sie“.", en: "To children you say “du”. To adults you say “Sie”." },
    title: { t: "Die Fähre", en: "The ferry" },
    clock: { t: "Die Fähre fährt ab", en: "The ferry leaves" },
    greet: { t: "Begrüß den Fahrgast!", en: "Greet the passenger!" },
    ask: { t: "Frag nach dem Namen!", en: "Ask for their name!" },
    listen: { t: "Hör gut zu und schreib es in die Liste!", en: "Listen carefully and put it on the list!" },
    farewell: { t: "Verabschiede dich!", en: "Say goodbye!" },
    pardon: { t: "Wie bitte?", en: "Pardon?" },
    listWrong: { t: "Hmm, stimmt das? Frag lieber noch einmal!", en: "Hmm, is that right? Better ask again!" },
    listRight: { t: "Danke! Gute Fahrt!", en: "Thanks! Have a good trip!" },
    list: { t: "Die Fahrgastliste", en: "The passenger list" },
    fields: {
      name: { t: "Name", en: "Name" },
      from: { t: "Kommt aus", en: "Comes from" },
      lives: { t: "Wohnt in", en: "Lives in" },
      speaks: { t: "Spricht", en: "Speaks" },
    },
    enter: { t: "Eintragen", en: "Put it on the list" },
    late: { t: "Oh nein, die Fähre fährt schon ab!", en: "Oh no, the ferry is already leaving!" },
    done: [
      { t: "Alle sind an Bord! Super gemacht!", en: "Everyone's on board! Great job!" },
      { t: "Gut gemacht! Fast alle sind an Bord.", en: "Well done! Almost everyone is on board." },
      { t: "Puh! Beim nächsten Mal klappt es besser.", en: "Phew! It'll go better next time." },
    ],
    harder: { t: "Morgen kommen noch mehr Fahrgäste!", en: "Tomorrow even more passengers are coming!" },
    again: { t: "Noch einmal!", en: "Once more!" },
    back: { t: "Zurück ins Dorf", en: "Back to the village" },
  },
};
