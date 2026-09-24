import { normalizeSwedish } from "@/lib/learning/adaptive";
import type { Line, VillagerId } from "./villagers";

// Each phrase a villager teaches is practised as a turn in a real exchange:
// someone says the cue, the learner answers, they react. Every phrase has
// several variants (other people, other situations, sometimes another right
// answer) so a repeat never replays the same scene.

export type SceneTime = "igår" | "idag" | "imorgon";

export type SceneBeat = {
  // One English sentence setting the scene; the Swedish lives in the cue.
  situation: string;
  speaker: string;
  cue: Line;
  reaction: Line;
  // A different right answer for this variant ("Det är vatten." instead of "Det är kaffe.").
  expect?: Line;
  // Other ways to say it right, as patterns over the normalised answer.
  accept?: string[];
  // Reactions that depend on what was actually said; {name} is the learner's name.
  branches?: Array<{ when: string; reaction: Line }>;
  // Phrases that would also be a fine reply, so never offered as wrong choices.
  notWith?: string[];
  // Who joins Elin's guest book when this goes well (defaults to the speaker).
  guest?: string;
  time?: SceneTime;
  departure?: string;
  ride?: string;
  fast?: boolean;
  pitch?: number;
};

const HEJ = ["^(hej|hejsan|hallå|tjena|tja|hej hej)\\b"];
const NAME = ["^(hej )?(jag heter|mitt namn är) \\p{L}+"];

const elin: Record<string, SceneBeat[]> = {
  hej: [
    {
      situation: "A passenger steps off the ferry and waves at you.",
      speaker: "Anna",
      cue: { sv: "Hej!", en: "Hi!" },
      reaction: { sv: "Vilken fin ö!", en: "What a lovely island!" },
      accept: HEJ,
      pitch: 1.2,
    },
    {
      situation: "A kid races past you down the dock.",
      speaker: "Lisa",
      cue: { sv: "Hej hej!", en: "Hi hi!" },
      reaction: { sv: "Hej! Jag ska bada!", en: "Hi! I'm going swimming!" },
      accept: HEJ,
      pitch: 1.45,
    },
    {
      situation: "The ferry captain leans out of the wheelhouse window.",
      speaker: "Kaptenen",
      cue: { sv: "Hej där!", en: "Hi there!" },
      reaction: { sv: "Välkommen ombord nästa gång!", en: "Welcome aboard next time!" },
      accept: HEJ,
      pitch: 0.7,
    },
    {
      situation: "Nils walks by with a fishing rod and a big smile.",
      speaker: "Nils",
      cue: { sv: "Hej! Fint väder, va?", en: "Hi! Nice weather, huh?" },
      reaction: { sv: "Perfekt för att fiska!", en: "Perfect for fishing!" },
      branches: [{ when: "\\bja\\b", reaction: { sv: "Ja, perfekt för att fiska!", en: "Yes, perfect for fishing!" } }],
      accept: HEJ,
      pitch: 0.8,
    },
  ],
  tack: [
    {
      situation: "Erik picks up the bag you dropped and hands it back.",
      speaker: "Erik",
      cue: { sv: "Varsågod, din väska!", en: "Here you go, your bag!" },
      reaction: { sv: "Ingen orsak!", en: "No problem!" },
      accept: ["\\btack\\b"],
      pitch: 0.85,
    },
    {
      situation: "Sara gives you a hand-drawn map of the island.",
      speaker: "Sara",
      cue: { sv: "Här är en karta över ön.", en: "Here's a map of the island." },
      reaction: { sv: "Varsågod! Lycka till!", en: "You're welcome! Good luck!" },
      accept: ["\\btack\\b"],
      pitch: 1.15,
    },
    {
      situation: "Maja offers you a cinnamon bun from a paper bag.",
      speaker: "Maja",
      cue: { sv: "Vill du ha en kanelbulle?", en: "Do you want a cinnamon bun?" },
      reaction: { sv: "Varsågod! Den är från Café Kanel.", en: "Here you go! It's from Café Kanel." },
      branches: [{ when: "\\bnej tack\\b", reaction: { sv: "Okej, då äter jag den!", en: "Okay, then I'll eat it!" } }],
      accept: ["\\btack\\b"],
      pitch: 1.25,
    },
    {
      situation: "Nils holds the gate open for you.",
      speaker: "Nils",
      cue: { sv: "Varsågod, gå först.", en: "Go ahead, you first." },
      reaction: { sv: "Ingen orsak!", en: "Don't mention it!" },
      accept: ["\\btack\\b"],
      pitch: 0.8,
    },
  ],
  ja: [
    {
      situation: "Sara wonders if you're new here. You are!",
      speaker: "Sara",
      cue: { sv: "Är du ny på ön?", en: "Are you new on the island?" },
      reaction: { sv: "Vad roligt! Välkommen!", en: "How fun! Welcome!" },
      accept: ["^(ja|japp|jajamän|ja visst)\\b"],
      notWith: ["nej"],
      pitch: 1.15,
    },
    {
      situation: "Erik asks if you're learning Swedish. You are!",
      speaker: "Erik",
      cue: { sv: "Lär du dig svenska?", en: "Are you learning Swedish?" },
      reaction: { sv: "Vad bra! Du pratar redan fint.", en: "Great! You already speak well." },
      accept: ["^(ja|japp|jajamän|ja visst)\\b"],
      notWith: ["nej"],
      pitch: 0.85,
    },
    {
      situation: "Maja asks if you like the island. You love it.",
      speaker: "Maja",
      cue: { sv: "Gillar du ön?", en: "Do you like the island?" },
      reaction: { sv: "Jag också! Den är så fin.", en: "Me too! It's so lovely." },
      accept: ["^(ja|japp|jajamän|ja visst)\\b"],
      notWith: ["nej"],
      pitch: 1.25,
    },
    {
      situation: "A lost tourist asks if this is the dock. It is.",
      speaker: "Lars",
      cue: { sv: "Är det här bryggan?", en: "Is this the dock?" },
      reaction: { sv: "Tack! Då är jag rätt.", en: "Thanks! Then I'm in the right place." },
      accept: ["^(ja|japp|jajamän|ja visst)\\b"],
      notWith: ["nej"],
      pitch: 0.75,
    },
  ],
  nej: [
    {
      situation: "Nils points at a red rowing boat. It isn't yours.",
      speaker: "Nils",
      cue: { sv: "Är det din båt?", en: "Is that your boat?" },
      reaction: { sv: "Okej, då är det Elins båt.", en: "Okay, then it's Elin's boat." },
      accept: ["^(nej|nä|nej tack)\\b"],
      notWith: ["ja"],
      pitch: 0.8,
    },
    {
      situation: "Anna asks if you're cold. The sun is shining!",
      speaker: "Anna",
      cue: { sv: "Fryser du?", en: "Are you cold?" },
      reaction: { sv: "Bra! Solen är varm idag.", en: "Good! The sun is warm today." },
      accept: ["^(nej|nä)\\b"],
      notWith: ["ja"],
      pitch: 1.2,
    },
    {
      situation: "A tourist thinks you're Elin. You're not.",
      speaker: "Lars",
      cue: { sv: "Är du Elin?", en: "Are you Elin?" },
      reaction: { sv: "Förlåt! Var är Elin då?", en: "Sorry! Where is Elin then?" },
      accept: ["^(nej|nä)\\b"],
      notWith: ["ja"],
      pitch: 0.75,
    },
    {
      situation: "Olle asks if you brought a car. Nobody drives on Lilla Ö.",
      speaker: "Olle",
      cue: { sv: "Har du bil här?", en: "Do you have a car here?" },
      reaction: { sv: "Ingen har bil på Lilla Ö!", en: "Nobody has a car on Lilla Ö!" },
      accept: ["^(nej|nä)\\b"],
      notWith: ["ja"],
      pitch: 0.9,
    },
  ],
  "jag-heter": [
    {
      situation: "Maja wants to know who you are.",
      speaker: "Maja",
      cue: { sv: "Hej! Vad heter du?", en: "Hi! What's your name?" },
      reaction: { sv: "Vilket fint namn, {name}!", en: "What a nice name, {name}!" },
      accept: NAME,
      pitch: 1.25,
    },
    {
      situation: "The ferry captain checks the passenger list.",
      speaker: "Kaptenen",
      cue: { sv: "Vad heter du?", en: "What's your name?" },
      reaction: { sv: "{name}… ja, här står du på listan!", en: "{name}… yes, here you are on the list!" },
      accept: NAME,
      pitch: 0.7,
    },
    {
      situation: "Erik introduces himself and waits for you.",
      speaker: "Erik",
      cue: { sv: "Hej, jag heter Erik. Och du?", en: "Hi, my name is Erik. And you?" },
      reaction: { sv: "Hej {name}! Trevligt att träffas.", en: "Hi {name}! Nice to meet you." },
      accept: NAME,
      pitch: 0.85,
    },
    {
      situation: "Lisa, a curious kid, stares up at you.",
      speaker: "Lisa",
      cue: { sv: "Vem är du?", en: "Who are you?" },
      reaction: { sv: "{name}! Det är ett roligt namn!", en: "{name}! That's a fun name!" },
      accept: NAME,
      pitch: 1.45,
    },
  ],
  "vad-heter-du": [
    {
      situation: "Someone new says hi. Ask what they're called.",
      speaker: "?",
      guest: "Olle",
      cue: { sv: "Hej hej!", en: "Hi there!" },
      reaction: { sv: "Jag heter Olle.", en: "My name is Olle." },
      accept: ["\\bvad heter du\\b", "\\bvad är ditt namn\\b"],
      pitch: 0.9,
    },
    {
      situation: "A woman in a big sun hat waves. You haven't met her.",
      speaker: "?",
      guest: "Karin",
      cue: { sv: "Hej! Välkommen till ön!", en: "Hi! Welcome to the island!" },
      reaction: { sv: "Jag heter Karin. Jag bor i det gula huset.", en: "My name is Karin. I live in the yellow house." },
      accept: ["\\bvad heter du\\b", "\\bvad är ditt namn\\b"],
      pitch: 1.1,
    },
    {
      situation: "A boy fishing at the end of the dock shows off his catch.",
      speaker: "?",
      guest: "Leo",
      cue: { sv: "Titta, jag fick en fisk!", en: "Look, I caught a fish!" },
      reaction: { sv: "Jag heter Leo! Och fisken heter Bosse.", en: "I'm Leo! And the fish is called Bosse." },
      accept: ["\\bvad heter du\\b", "\\bvad är ditt namn\\b"],
      pitch: 1.4,
    },
    {
      situation: "A new passenger says good morning. Ask her name.",
      speaker: "?",
      guest: "Greta",
      cue: { sv: "God morgon!", en: "Good morning!" },
      reaction: { sv: "Jag heter Greta. Jag är också ny här.", en: "My name is Greta. I'm new here too." },
      accept: ["\\bvad heter du\\b", "\\bvad är ditt namn\\b"],
      pitch: 1.2,
    },
  ],
  "trevligt-att-traeffas": [
    {
      situation: "Olle introduces himself. Be friendly back.",
      speaker: "Olle",
      cue: { sv: "Hej, jag heter Olle.", en: "Hi, my name is Olle." },
      reaction: { sv: "Detsamma!", en: "Likewise!" },
      accept: ["\\btrevligt att träffas\\b"],
      pitch: 0.9,
    },
    {
      situation: "Karin tells you her name.",
      speaker: "Karin",
      cue: { sv: "Jag heter Karin.", en: "My name is Karin." },
      reaction: { sv: "Detsamma! Välkommen till ön.", en: "Likewise! Welcome to the island." },
      accept: ["\\btrevligt att träffas\\b"],
      pitch: 1.1,
    },
    {
      situation: "Elin introduces you to her brother.",
      speaker: "Johan",
      cue: { sv: "Hej, jag heter Johan. Elin är min syster.", en: "Hi, I'm Johan. Elin is my sister." },
      reaction: { sv: "Detsamma! Elin pratar mycket om dig.", en: "Likewise! Elin talks about you a lot." },
      accept: ["\\btrevligt att träffas\\b"],
      pitch: 0.8,
    },
    {
      situation: "Greta shakes your hand.",
      speaker: "Greta",
      cue: { sv: "Hej! Jag heter Greta.", en: "Hi! My name is Greta." },
      reaction: { sv: "Tack, detsamma!", en: "Thanks, likewise!" },
      accept: ["\\btrevligt att träffas\\b"],
      pitch: 1.2,
    },
  ],
  "vet-inte": [
    {
      situation: "A tourist asks you something you have no idea about.",
      speaker: "Lars",
      cue: { sv: "När går nästa båt?", en: "When does the next boat leave?" },
      reaction: { sv: "Okej, jag frågar Elin.", en: "Okay, I'll ask Elin." },
      accept: ["^(jag vet inte|vet inte|ingen aning)\\b"],
      pitch: 0.75,
    },
    {
      situation: "Lisa asks you a question only a fish could answer.",
      speaker: "Lisa",
      cue: { sv: "Hur många fiskar finns det i havet?", en: "How many fish are there in the sea?" },
      reaction: { sv: "Inte jag heller!", en: "Me neither!" },
      accept: ["^(jag vet inte|vet inte|ingen aning)\\b"],
      pitch: 1.45,
    },
    {
      situation: "A tourist asks where Bosse is. You haven't met him yet.",
      speaker: "Turist",
      cue: { sv: "Var är Bosse?", en: "Where is Bosse?" },
      reaction: { sv: "Okej, jag letar på kaféet.", en: "Okay, I'll look in the café." },
      accept: ["^(jag vet inte|vet inte|ingen aning)\\b"],
      pitch: 0.85,
    },
    {
      situation: "Erik asks the time. You don't have a watch.",
      speaker: "Erik",
      cue: { sv: "Vad är klockan?", en: "What time is it?" },
      reaction: { sv: "Ingen fara, jag frågar Elin.", en: "No worries, I'll ask Elin." },
      accept: ["^(jag vet inte|vet inte|ingen aning)\\b"],
      pitch: 0.85,
    },
  ],
  "det-aer": [
    {
      situation: "Anna points at the cup of coffee in your hand.",
      speaker: "Anna",
      cue: { sv: "Vad är det?", en: "What is that?" },
      reaction: { sv: "Mmm, det luktar gott!", en: "Mmm, it smells good!" },
      pitch: 1.2,
    },
    {
      situation: "Lisa points down at the sea under the dock.",
      speaker: "Lisa",
      cue: { sv: "Vad är det?", en: "What is that?" },
      expect: { sv: "Det är vatten.", en: "It is water." },
      reaction: { sv: "Kallt vatten! Brr!", en: "Cold water! Brr!" },
      pitch: 1.45,
    },
    {
      situation: "Leo holds up something wet and wriggly.",
      speaker: "Leo",
      cue: { sv: "Vad är det här?", en: "What's this?" },
      expect: { sv: "Det är en fisk.", en: "It is a fish." },
      reaction: { sv: "Ja! Min fisk!", en: "Yes! My fish!" },
      pitch: 1.4,
    },
    {
      situation: "Erik points at the red rowing boat.",
      speaker: "Erik",
      cue: { sv: "Vad är det?", en: "What is that?" },
      expect: { sv: "Det är en båt.", en: "It is a boat." },
      reaction: { sv: "En fin båt!", en: "A nice boat!" },
      pitch: 0.85,
    },
  ],
};

const stina: Record<string, SceneBeat[]> = {
  "var-ligger-stationen": [
    {
      situation: "You're lost on the mainland. A local stops to help.",
      speaker: "Ingrid",
      cue: { sv: "Hej! Kan jag hjälpa dig?", en: "Hi! Can I help you?" },
      reaction: { sv: "Den ligger där borta, till vänster.", en: "It's over there, on the left." },
      accept: ["\\bvar ligger stationen\\b"],
      pitch: 1.1,
    },
    {
      situation: "Your ferry just landed in Hamnstad and you need the train.",
      speaker: "Karl",
      cue: { sv: "Behöver du hjälp?", en: "Do you need help?" },
      reaction: { sv: "Den ligger bakom kyrkan.", en: "It's behind the church." },
      accept: ["\\bvar ligger stationen\\b"],
      pitch: 0.75,
    },
    {
      situation: "A woman waiting for the bus asks where you're headed.",
      speaker: "Maria",
      cue: { sv: "Vart ska du?", en: "Where are you going?" },
      reaction: { sv: "Stationen? Den ligger nära hamnen.", en: "The station? It's near the harbour." },
      accept: ["\\bvar ligger stationen\\b"],
      pitch: 1.2,
    },
  ],
  "taget-till-stockholm": [
    {
      situation: "A train waits on platform 2. Check with Stina before you get on.",
      speaker: "Stina",
      cue: { sv: "God dag! Biljetter, tack.", en: "Good day! Tickets, please." },
      reaction: { sv: "Ja, det gör det. Trevlig resa!", en: "Yes, it does. Have a nice trip!" },
      departure: "Stockholm",
    },
    {
      situation: "Two trains are waiting. Ask the man next to you about this one.",
      speaker: "Passagerare",
      cue: { sv: "Hej! Ska du också åka?", en: "Hi! Are you travelling too?" },
      reaction: { sv: "Ja, det gör det. Jag ska också dit!", en: "Yes, it does. I'm going there too!" },
      departure: "Stockholm",
      pitch: 0.85,
    },
    {
      situation: "You're visiting a friend in Uppsala. Check this is the right train.",
      speaker: "Stina",
      cue: { sv: "Välkommen ombord!", en: "Welcome aboard!" },
      expect: { sv: "Går det här tåget till Uppsala?", en: "Does this train go to Uppsala?" },
      reaction: { sv: "Ja, till Uppsala. Sätt dig var du vill.", en: "Yes, to Uppsala. Sit wherever you like." },
      departure: "Uppsala",
    },
    {
      situation: "You want Gothenburg, but you're not sure about this train.",
      speaker: "Stina",
      cue: { sv: "Hej! Kan jag hjälpa dig?", en: "Hi! Can I help you?" },
      expect: { sv: "Går det här tåget till Göteborg?", en: "Does this train go to Gothenburg?" },
      reaction: { sv: "Nej, det går till Stockholm. Ditt tåg går från spår tre.", en: "No, it goes to Stockholm. Your train leaves from platform three." },
      departure: "Göteborg",
    },
  ],
  "jag-ska-av-haer": [
    {
      situation: "You're going to Hamnstad. Tell Stina when the train gets there.",
      speaker: "Stina",
      cue: { sv: "Nästa station: Hamnstad.", en: "Next station: Hamnstad." },
      reaction: { sv: "Varsågod, dörren är öppen!", en: "Go ahead, the door is open!" },
      accept: ["^(ursäkta )?jag ska av (här|nu)\\b"],
      ride: "Hamnstad",
    },
    {
      situation: "You're visiting a friend in Uppsala. Speak up when you arrive.",
      speaker: "Stina",
      cue: { sv: "Nästa station: Uppsala.", en: "Next station: Uppsala." },
      reaction: { sv: "Hälsa din vän!", en: "Say hi to your friend!" },
      accept: ["^(ursäkta )?jag ska av (här|nu)\\b"],
      ride: "Uppsala",
    },
    {
      situation: "You want to see the bridge up close. Hop off there.",
      speaker: "Stina",
      cue: { sv: "Nästa: Bron.", en: "Next: the Bridge." },
      reaction: { sv: "Titta på vattnet!", en: "Look at the water!" },
      accept: ["^(ursäkta )?jag ska av (här|nu)\\b"],
      ride: "Bron",
    },
  ],
  "jag-foerstar-inte": [
    {
      situation: "A passenger rattles off a question in fast Swedish. You catch nothing.",
      speaker: "Passagerare",
      cue: { sv: "Ursäkta, vet du om vi byter tåg i Uppsala eller om vi åker direkt?", en: "Excuse me, do you know if we change trains in Uppsala or go straight through?" },
      reaction: { sv: "Förlåt! Byter vi tåg i Uppsala?", en: "Sorry! Do we change trains in Uppsala?" },
      accept: ["\\bjag förstår inte\\b", "\\bjag fattar inte\\b"],
      fast: true,
      pitch: 0.9,
    },
    {
      situation: "Stina reads out the bike rules in a rush.",
      speaker: "Stina",
      cue: { sv: "Inga cyklar i vagnarna mellan sju och nio på morgonen, tack!", en: "No bikes in the carriages between seven and nine in the morning, please!" },
      reaction: { sv: "Förlåt! Inga cyklar på morgonen.", en: "Sorry! No bikes in the morning." },
      accept: ["\\bjag förstår inte\\b", "\\bjag fattar inte\\b"],
      fast: true,
    },
    {
      situation: "An old man on the bench mumbles about the weather.",
      speaker: "Gubben",
      cue: { sv: "Det blir nog regn i eftermiddag, det känner jag i knäna.", en: "It'll probably rain this afternoon, I can feel it in my knees." },
      reaction: { sv: "Regn! Det blir regn idag.", en: "Rain! It's going to rain today." },
      accept: ["\\bjag förstår inte\\b", "\\bjag fattar inte\\b"],
      fast: true,
      pitch: 0.65,
    },
  ],
  "kan-du-upprepa": [
    {
      situation: "Stina tells you your platform, but a train roars past.",
      speaker: "Stina",
      cue: { sv: "Tåget till Göteborg går från spår tre.", en: "The train to Gothenburg leaves from platform three." },
      reaction: { sv: "Spår tre! Tåget till Göteborg går från spår tre.", en: "Platform three! The train to Gothenburg leaves from platform three." },
      accept: ["\\bkan du upprepa\\b"],
      departure: "Göteborg",
      fast: true,
    },
    {
      situation: "Stina shouts a delay over the noise of the platform.",
      speaker: "Stina",
      cue: { sv: "Tåget till Uppsala är tio minuter försenat.", en: "The train to Uppsala is ten minutes late." },
      reaction: { sv: "Tåget till Uppsala är tio minuter sent.", en: "The train to Uppsala is ten minutes late." },
      accept: ["\\bkan du upprepa\\b"],
      departure: "Uppsala",
      fast: true,
    },
    {
      situation: "A passenger tells you their seat number while the doors beep.",
      speaker: "Passagerare",
      cue: { sv: "Jag sitter på plats tjugotre.", en: "I'm in seat twenty-three." },
      reaction: { sv: "Plats tjugotre. Tjugo … tre.", en: "Seat twenty-three. Twenty … three." },
      accept: ["\\bkan du upprepa\\b"],
      fast: true,
      pitch: 1.1,
    },
  ],
  "prata-langsammare": [
    {
      situation: "Stina explains the timetable way too fast.",
      speaker: "Stina",
      cue: { sv: "Tåget går kvart över tio från spår två, men du byter i Uppsala.", en: "The train leaves at quarter past ten from platform two, but you change in Uppsala." },
      reaction: { sv: "Förlåt! Tåget går … kvart över tio.", en: "Sorry! The train leaves … at quarter past ten." },
      accept: ["\\bkan du prata (lite )?(långsammare|långsamt)\\b"],
      fast: true,
    },
    {
      situation: "The ticket seller talks like a waterfall.",
      speaker: "Oskar",
      cue: { sv: "En enkel till Stockholm kostar hundratjugo kronor, eller så köper du ett kort.", en: "A single to Stockholm costs a hundred and twenty kronor, or you buy a card." },
      reaction: { sv: "Förlåt! En biljett … kostar … hundratjugo kronor.", en: "Sorry! A ticket … costs … a hundred and twenty kronor." },
      accept: ["\\bkan du prata (lite )?(långsammare|långsamt)\\b"],
      fast: true,
      pitch: 0.8,
    },
    {
      situation: "A friendly passenger gets very excited about your Swedish.",
      speaker: "Passagerare",
      cue: { sv: "Åh, du lär dig svenska, vad roligt, jag har en kusin i England!", en: "Oh, you're learning Swedish, how fun, I have a cousin in England!" },
      reaction: { sv: "Förlåt! Jag … har … en kusin … i England.", en: "Sorry! I … have … a cousin … in England." },
      accept: ["\\bkan du prata (lite )?(långsammare|långsamt)\\b"],
      fast: true,
      pitch: 1.2,
    },
  ],
  kan: [
    {
      situation: "Stina needs a hand at the station tomorrow. You're free.",
      speaker: "Stina",
      cue: { sv: "Kan du hjälpa mig imorgon?", en: "Can you help me tomorrow?" },
      reaction: { sv: "Tack, vad snällt!", en: "Thanks, how kind!" },
      accept: ["^jag kan (komma|hjälpa)\\b"],
    },
    {
      situation: "Stina is having a party at the station on Friday.",
      speaker: "Stina",
      cue: { sv: "Kan du komma på fest på fredag?", en: "Can you come to a party on Friday?" },
      reaction: { sv: "Vad kul! Ta med kanelbullar!", en: "How fun! Bring cinnamon buns!" },
      accept: ["^jag kan komma\\b"],
    },
    {
      situation: "A passenger drops all their bags at once.",
      speaker: "Passagerare",
      cue: { sv: "Oj, mina väskor!", en: "Oops, my bags!" },
      expect: { sv: "Jag kan hjälpa dig.", en: "I can help you." },
      reaction: { sv: "Tack, vad snällt!", en: "Thanks, how kind!" },
      accept: ["^jag kan hjälpa( dig| till)?\\b"],
      pitch: 1.1,
    },
  ],
  behoever: [
    {
      situation: "It's a long trip and you're thirsty.",
      speaker: "Stina",
      cue: { sv: "Vad behöver du?", en: "What do you need?" },
      reaction: { sv: "Det finns vatten i kiosken.", en: "There's water at the kiosk." },
      accept: ["^jag behöver vatten\\b"],
    },
    {
      situation: "The ticket machine is broken. Tell Stina what you need.",
      speaker: "Stina",
      cue: { sv: "Hej! Vad behöver du?", en: "Hi! What do you need?" },
      expect: { sv: "Jag behöver en biljett.", en: "I need a ticket." },
      reaction: { sv: "En biljett? Jag hjälper dig.", en: "A ticket? I'll help you." },
      accept: ["^jag behöver (en )?biljett\\b"],
    },
    {
      situation: "You can't find your platform anywhere.",
      speaker: "Stina",
      cue: { sv: "Är allt okej?", en: "Is everything okay?" },
      expect: { sv: "Jag behöver hjälp.", en: "I need help." },
      reaction: { sv: "Klart! Vart ska du?", en: "Of course! Where are you going?" },
      accept: ["^jag behöver hjälp\\b"],
    },
  ],
  finns: [
    {
      situation: "A hungry tourist asks you about Lilla Ö.",
      speaker: "Turist",
      cue: { sv: "Finns det ett kafé på ön?", en: "Is there a café on the island?" },
      reaction: { sv: "Toppen, tack!", en: "Great, thanks!" },
      accept: ["^det finns ett kafé\\b"],
      pitch: 0.85,
    },
    {
      situation: "A sailor wants to know where to tie up his boat.",
      speaker: "Seglaren",
      cue: { sv: "Finns det en brygga på ön?", en: "Is there a dock on the island?" },
      expect: { sv: "Det finns en brygga.", en: "There is a dock." },
      reaction: { sv: "Bra, då kommer jag med båten!", en: "Good, then I'll come by boat!" },
      accept: ["^det finns en brygga\\b"],
      pitch: 0.75,
    },
    {
      situation: "Someone on the platform asks how to get to Lilla Ö.",
      speaker: "Maria",
      cue: { sv: "Finns det ett tåg till ön?", en: "Is there a train to the island?" },
      expect: { sv: "Det finns ett tåg.", en: "There is a train." },
      reaction: { sv: "Toppen! Då åker jag imorgon.", en: "Great! Then I'll go tomorrow." },
      accept: ["^det finns ett tåg\\b"],
      pitch: 1.2,
    },
  ],
};

const astrid: Record<string, SceneBeat[]> = {
  "v2-idag": [
    {
      situation: "Astrid asks about your day. You're working from home. Start with “Idag”.",
      speaker: "Astrid",
      cue: { sv: "Vad gör du idag?", en: "What are you doing today?" },
      reaction: { sv: "Hemma? Då kan du komma hit sen!", en: "At home? Then you can come here later!" },
      accept: ["^idag jobbar jag\\b"],
      time: "idag",
    },
    {
      situation: "Astrid hands you a watering can. Tell her your plan, starting with “Idag”.",
      speaker: "Astrid",
      cue: { sv: "Vad gör du idag?", en: "What are you doing today?" },
      expect: { sv: "Idag vattnar jag blommorna.", en: "Today I'm watering the flowers." },
      reaction: { sv: "Tack! De är så törstiga.", en: "Thanks! They're so thirsty." },
      accept: ["^idag vattnar jag\\b"],
      time: "idag",
    },
    {
      situation: "You're meeting Bosse for fika later. Start with “Idag”.",
      speaker: "Astrid",
      cue: { sv: "Vad ska du göra idag?", en: "What are you going to do today?" },
      expect: { sv: "Idag fikar jag med Bosse.", en: "Today I'm having fika with Bosse." },
      reaction: { sv: "Hälsa honom från mig!", en: "Say hi to him from me!" },
      accept: ["^idag fikar jag\\b"],
      time: "idag",
    },
  ],
  negation: [
    {
      situation: "Astrid hopes you'll come to the garden today, but you can't.",
      speaker: "Astrid",
      cue: { sv: "Kommer du till trädgården idag?", en: "Are you coming to the garden today?" },
      reaction: { sv: "Synd! Kanske imorgon då.", en: "Shame! Maybe tomorrow then." },
      accept: ["^(nej )?jag kommer inte\\b"],
      time: "idag",
    },
    {
      situation: "Astrid thinks you're busy, but you have the day off.",
      speaker: "Astrid",
      cue: { sv: "Jobbar du idag?", en: "Are you working today?" },
      expect: { sv: "Jag jobbar inte idag.", en: "I'm not working today." },
      reaction: { sv: "Vad skönt! Då kan du hjälpa mig.", en: "How nice! Then you can help me." },
      accept: ["^(nej )?jag jobbar inte\\b"],
      time: "idag",
    },
    {
      situation: "Astrid offers you a tomato. You don't like tomatoes.",
      speaker: "Astrid",
      cue: { sv: "Vill du ha en tomat?", en: "Do you want a tomato?" },
      expect: { sv: "Jag gillar inte tomater.", en: "I don't like tomatoes." },
      reaction: { sv: "Inte? Mer till mig då!", en: "No? More for me then!" },
      accept: ["^(nej )?(tack )?jag gillar inte tomater\\b"],
    },
  ],
  "past-gick": [
    {
      situation: "Astrid wonders where you went yesterday. You went home.",
      speaker: "Astrid",
      cue: { sv: "Vart gick du igår?", en: "Where did you go yesterday?" },
      reaction: { sv: "Hem? Det låter mysigt.", en: "Home? That sounds cosy." },
      accept: ["^igår gick jag hem\\b"],
      time: "igår",
    },
    {
      situation: "You spent yesterday at Café Kanel.",
      speaker: "Astrid",
      cue: { sv: "Var var du igår?", en: "Where were you yesterday?" },
      expect: { sv: "Igår gick jag till kaféet.", en: "Yesterday I went to the café." },
      reaction: { sv: "Hos Bosse? Åt du en kanelbulle?", en: "At Bosse's? Did you eat a cinnamon bun?" },
      accept: ["^igår gick jag till kaféet\\b"],
      time: "igår",
    },
    {
      situation: "Yesterday you went down to the beach.",
      speaker: "Astrid",
      cue: { sv: "Vad gjorde du igår?", en: "What did you do yesterday?" },
      expect: { sv: "Igår gick jag till stranden.", en: "Yesterday I went to the beach." },
      reaction: { sv: "Var vattnet kallt?", en: "Was the water cold?" },
      accept: ["^igår gick jag till stranden\\b"],
      time: "igår",
    },
  ],
  "perfect-har": [
    {
      situation: "Astrid is curious about the mainland. You've been to Stockholm.",
      speaker: "Astrid",
      cue: { sv: "Har du varit i Stockholm?", en: "Have you been to Stockholm?" },
      reaction: { sv: "Vad spännande! Jag har aldrig varit där.", en: "How exciting! I've never been there." },
      accept: ["^(ja )?jag har varit i stockholm\\b"],
    },
    {
      situation: "Astrid mentions Uppsala. You've been there too!",
      speaker: "Astrid",
      cue: { sv: "Har du varit i Uppsala?", en: "Have you been to Uppsala?" },
      expect: { sv: "Jag har varit i Uppsala.", en: "I have been to Uppsala." },
      reaction: { sv: "Uppsala är så fint på våren.", en: "Uppsala is so lovely in spring." },
      accept: ["^(ja )?jag har varit i uppsala\\b"],
    },
    {
      situation: "Astrid thinks it's your first visit. It isn't.",
      speaker: "Astrid",
      cue: { sv: "Är det första gången du är här?", en: "Is this your first time here?" },
      expect: { sv: "Jag har varit här förut.", en: "I have been here before." },
      reaction: { sv: "Välkommen tillbaka då!", en: "Welcome back then!" },
      accept: ["^(nej )?jag har varit här\\b"],
    },
  ],
  kanske: [
    {
      situation: "Astrid invites you, but you're not sure yet.",
      speaker: "Astrid",
      cue: { sv: "Vill du fika med mig imorgon?", en: "Do you want to have fika with me tomorrow?" },
      reaction: { sv: "Säg till när du vet!", en: "Let me know when you know!" },
      accept: ["^(ja )?kanske\\b"],
      time: "imorgon",
    },
    {
      situation: "You're busy today. Maybe tomorrow works?",
      speaker: "Astrid",
      cue: { sv: "Kan du hjälpa mig i trädgården idag?", en: "Can you help me in the garden today?" },
      expect: { sv: "Kanske imorgon.", en: "Maybe tomorrow." },
      reaction: { sv: "Imorgon passar bra!", en: "Tomorrow suits me fine!" },
      accept: ["^kanske i ?morgon\\b"],
      time: "imorgon",
    },
    {
      situation: "Astrid wants to swim. The water looks very cold…",
      speaker: "Astrid",
      cue: { sv: "Ska vi bada i havet?", en: "Shall we swim in the sea?" },
      reaction: { sv: "Haha, vattnet är varmt, jag lovar!", en: "Haha, the water is warm, I promise!" },
      accept: ["^(ja )?kanske\\b"],
    },
  ],
  "ska-vi-infinitive": [
    {
      situation: "Astrid wants to visit the mainland tomorrow. Suggest the train.",
      speaker: "Astrid",
      cue: { sv: "Jag vill åka till Stockholm imorgon.", en: "I want to go to Stockholm tomorrow." },
      reaction: { sv: "Ja, gärna! Vi tar tåget.", en: "Yes, gladly! We'll take the train." },
      accept: ["^ska vi ta tåget\\b"],
      time: "imorgon",
    },
    {
      situation: "Astrid looks tired after weeding. Suggest a coffee break.",
      speaker: "Astrid",
      cue: { sv: "Jag är så trött.", en: "I'm so tired." },
      expect: { sv: "Ska vi fika?", en: "Shall we have fika?" },
      reaction: { sv: "Ja! Bosse har nybakade bullar.", en: "Yes! Bosse has freshly baked buns." },
      accept: ["^ska vi fika\\b"],
      time: "idag",
    },
    {
      situation: "Astrid wants to see the sea from a boat. Suggest the ferry.",
      speaker: "Astrid",
      cue: { sv: "Jag vill ut på havet.", en: "I want to go out on the sea." },
      expect: { sv: "Ska vi ta båten?", en: "Shall we take the boat?" },
      reaction: { sv: "Gärna! Elin tar oss ut.", en: "Gladly! Elin will take us out." },
      accept: ["^ska vi ta (båten|färjan)\\b"],
    },
  ],
};

export const sceneBeats: Partial<Record<VillagerId, Record<string, SceneBeat[]>>> = { elin, stina, astrid };

// Stable per attempt, different across attempts: repeats land on another variant.
export function pickVariant<T>(variants: readonly T[], key: string) {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return variants[Math.abs(hash) % variants.length];
}

// Did the learner say it right in one of the other accepted ways?
export function acceptsAnswer(patterns: readonly string[] | undefined, answer: string) {
  const text = normalizeSwedish(answer);
  return Boolean(text) && (patterns ?? []).some((p) => new RegExp(p, "u").test(text));
}

// The name the learner introduced themselves with, if they did.
export function nameFrom(answer: string) {
  const match = /(?:jag heter|mitt namn är)\s+(\p{L}+)/iu.exec(answer);
  return match ? match[1].charAt(0).toLocaleUpperCase("sv-SE") + match[1].slice(1) : null;
}

// Pick the reaction that fits what the learner actually said.
export function reactionTo(beat: SceneBeat, answer: string, fallbackName: string): Line {
  const text = normalizeSwedish(answer);
  const chosen = beat.branches?.find((b) => new RegExp(b.when, "u").test(text))?.reaction ?? beat.reaction;
  const name = nameFrom(answer) ?? fallbackName;
  return { sv: chosen.sv.replaceAll("{name}", name), en: chosen.en.replaceAll("{name}", name) };
}

export const guestNames = ["Anna", "Erik", "Sara", "Nils", "Maja", "Olle", "Lars", "Lisa", "Karin", "Leo", "Greta", "Johan"];

// Names in Elin's listening drills ("Hej, jag heter Sara.").
export function nameIn(text: string) {
  return guestNames.find((n) => text.includes(n)) ?? null;
}

// ---------- Listening drills ----------

export const departures = [
  { time: "10:15", to: "Stockholm", track: "2" },
  { time: "10:40", to: "Uppsala", track: "1" },
  { time: "11:05", to: "Göteborg", track: "3" },
];

export const announcements: Array<{ sv: string; en: string; to: string }> = [
  { sv: "Tåget till Stockholm går från spår två.", en: "The train to Stockholm leaves from platform two.", to: "Stockholm" },
  { sv: "Tåget till Uppsala går från spår ett.", en: "The train to Uppsala leaves from platform one.", to: "Uppsala" },
  { sv: "Tåget till Göteborg går från spår tre.", en: "The train to Gothenburg leaves from platform three.", to: "Göteborg" },
  { sv: "Nästa tåg till Stockholm går kvart över tio.", en: "The next train to Stockholm leaves at quarter past ten.", to: "Stockholm" },
  { sv: "Tåget till Uppsala är försenat.", en: "The train to Uppsala is delayed.", to: "Uppsala" },
];

export type SignId = "station" | "toalett" | "buss" | "kafe";
export const signs: Array<{ id: SignId; line: Line }> = [
  { id: "station", line: { sv: "Stationen", en: "The station" } },
  { id: "toalett", line: { sv: "Toaletten", en: "The toilet" } },
  { id: "buss", line: { sv: "Busshållplatsen", en: "The bus stop" } },
  { id: "kafe", line: { sv: "Kaféet", en: "The café" } },
];
export const whereQuestions: Array<{ sv: string; en: string; sign: SignId }> = [
  { sv: "Var ligger stationen?", en: "Where is the station?", sign: "station" },
  { sv: "Var ligger toaletten?", en: "Where is the toilet?", sign: "toalett" },
  { sv: "Var ligger busshållplatsen?", en: "Where is the bus stop?", sign: "buss" },
  { sv: "Var ligger kaféet?", en: "Where is the café?", sign: "kafe" },
  { sv: "Ursäkta, var ligger stationen?", en: "Excuse me, where is the station?", sign: "station" },
];

// Astrid's "when?" drill: hear a sentence, pick the day it's about.
export const whenSentences: Record<string, Array<{ sv: string; en: string; time: SceneTime }>> = {
  "v2-idag": [
    { sv: "Idag jobbar jag hemma.", en: "Today I work at home.", time: "idag" },
    { sv: "Imorgon jobbar hon hemma.", en: "Tomorrow she works at home.", time: "imorgon" },
    { sv: "Igår jobbade jag hemma.", en: "Yesterday I worked at home.", time: "igår" },
    { sv: "Idag vattnar Astrid blommorna.", en: "Today Astrid waters the flowers.", time: "idag" },
  ],
  negation: [
    { sv: "Jag kommer inte idag.", en: "I'm not coming today.", time: "idag" },
    { sv: "Hon jobbar inte imorgon.", en: "She isn't working tomorrow.", time: "imorgon" },
    { sv: "Jag var inte hemma igår.", en: "I wasn't home yesterday.", time: "igår" },
  ],
  "past-gick": [
    { sv: "Igår gick jag hem.", en: "Yesterday I went home.", time: "igår" },
    { sv: "Idag går jag till kaféet.", en: "Today I'm going to the café.", time: "idag" },
    { sv: "Imorgon går vi till stranden.", en: "Tomorrow we're going to the beach.", time: "imorgon" },
    { sv: "Igår gick hon till skolan.", en: "Yesterday she went to school.", time: "igår" },
  ],
  kanske: [
    { sv: "Kanske imorgon.", en: "Maybe tomorrow.", time: "imorgon" },
    { sv: "Kanske idag, om solen skiner.", en: "Maybe today, if the sun shines.", time: "idag" },
  ],
  "ska-vi-infinitive": [
    { sv: "Ska vi ta tåget imorgon?", en: "Shall we take the train tomorrow?", time: "imorgon" },
    { sv: "Ska vi fika idag?", en: "Shall we have fika today?", time: "idag" },
  ],
};

export const journey = ["Lilla Ö", "Bron", "Hamnstad", "Uppsala", "Stockholm"];

export const sceneLines = {
  youCanSay: { sv: "Du kan svara:", en: "You can answer:" },
  answer: { sv: "Svara!", en: "Answer!" },
  whoIsTalking: { sv: "Vem pratar?", en: "Who is talking?" },
  whatDoYouSay: { sv: "Vad svarar du?", en: "What do you answer?" },
  whichSign: { sv: "Vilken skylt?", en: "Which sign?" },
  whichTrain: { sv: "Vilket tåg?", en: "Which train?" },
  when: { sv: "När?", en: "When?" },
  puzzle: { sv: "Dialogpussel", en: "Dialogue puzzle" },
  puzzleHelp: { sv: "Tryck i rätt ordning!", en: "Tap in the right order!" },
  guestBook: { sv: "Gästbok", en: "Guest book" },
  departures: { sv: "Avgångar", en: "Departures" },
  journey: { sv: "Resan", en: "The journey" },
  riding: { sv: "Tåget rullar…", en: "The train is rolling…" },
  keepTalking: { sv: "Svara om du vill…", en: "Reply if you like…" },
  you: { sv: "Du", en: "You" },
} satisfies Record<string, Line>;

export const calendar: Array<{ id: SceneTime; line: Line }> = [
  { id: "igår", line: { sv: "Igår", en: "Yesterday" } },
  { id: "idag", line: { sv: "Idag", en: "Today" } },
  { id: "imorgon", line: { sv: "Imorgon", en: "Tomorrow" } },
];
