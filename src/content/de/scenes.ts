import type { DrillKind, SceneBeat, SceneExtras } from "@/lib/game/scenes";

// Key phrases of the German course, played out as small exchanges around
// Tannenau. Franz teaches at his café counter instead (see ./cafe). Phrases
// without a scene here are still taught, through the standard activities.

const HALLO = ["^(hallo|hi|hey|grüß dich|grüß gott|servus|moin|guten (morgen|tag|abend))\\b"];
const NAME = ["^(hallo )?(ich heiße|mein name ist|ich bin) \\p{L}+"];
const TSCHUESS = ["^(tschüss|tschau|ciao|auf wiedersehen|bis bald|bis dann|bis morgen|ade)\\b"];

const greta: Record<string, SceneBeat[]> = {
  hallo: [
    {
      situation: "A hiker steps off the boat and waves at you.",
      speaker: "Anna",
      cue: { t: "Hallo!", en: "Hi!" },
      reaction: { t: "Was für eine schöne Insel!", en: "What a lovely island!" },
      accept: HALLO,
      pitch: 1.2,
    },
    {
      situation: "A boy races past you down the landing stage.",
      speaker: "Max",
      cue: { t: "Hallo, hallo!", en: "Hi, hi!" },
      reaction: { t: "Hallo! Ich gehe schwimmen!", en: "Hi! I'm going swimming!" },
      accept: HALLO,
      pitch: 1.45,
    },
    {
      situation: "The boat captain leans out of the wheelhouse window.",
      speaker: "Kapitän",
      cue: { t: "Grüß Gott!", en: "Hello there!" },
      reaction: { t: "Bis zum nächsten Mal an Bord!", en: "See you on board next time!" },
      accept: HALLO,
      pitch: 0.7,
    },
  ],
  danke: [
    {
      situation: "Lukas picks up the bag you dropped and hands it back.",
      speaker: "Lukas",
      cue: { t: "Hier, deine Tasche!", en: "Here, your bag!" },
      reaction: { t: "Gern geschehen!", en: "You're welcome!" },
      accept: ["\\b(danke|vielen dank|danke schön)\\b"],
      pitch: 0.85,
    },
    {
      situation: "Greta hands you a little map of the island.",
      speaker: "Greta",
      cue: { t: "Hier ist eine Karte von Tannenau.", en: "Here's a map of Tannenau." },
      reaction: { t: "Bitte schön! Viel Spaß!", en: "You're welcome! Have fun!" },
      accept: ["\\b(danke|vielen dank|danke schön)\\b"],
    },
    {
      situation: "A woman offers you a cherry from her basket.",
      speaker: "Emma",
      cue: { t: "Möchtest du eine Kirsche?", en: "Would you like a cherry?" },
      reaction: { t: "Bitte schön! Sie sind ganz süß.", en: "Here you go! They're really sweet." },
      branches: [{ when: "\\bnein\\b", reaction: { t: "Okay, dann esse ich sie!", en: "Okay, then I'll eat it!" } }],
      accept: ["\\b(danke|ja gern)\\b"],
      notWith: ["ja", "nein"],
      pitch: 1.15,
    },
  ],
  ja: [
    {
      situation: "Greta looks at your big backpack.",
      speaker: "Greta",
      cue: { t: "Bist du neu hier?", en: "Are you new here?" },
      reaction: { t: "Toll! Willkommen!", en: "Great! Welcome!" },
      accept: ["^ja\\b"],
    },
    {
      situation: "A tourist holds up her camera and smiles at you.",
      speaker: "Sophie",
      cue: { t: "Machst du ein Foto von mir?", en: "Will you take a photo of me?" },
      reaction: { t: "Super, danke!", en: "Great, thanks!" },
      accept: ["^(ja|klar|gern)\\b"],
      pitch: 1.2,
    },
  ],
  nein: [
    {
      situation: "Max offers you a very squashed sandwich.",
      speaker: "Max",
      cue: { t: "Willst du mein Brot?", en: "Do you want my sandwich?" },
      reaction: { t: "Okay, dann esse ich es!", en: "Okay, then I'll eat it!" },
      accept: ["^nein\\b"],
      pitch: 1.45,
    },
    {
      situation: "A man with a map looks at you, confused.",
      speaker: "Felix",
      cue: { t: "Bist du Greta?", en: "Are you Greta?" },
      reaction: { t: "Oh, Entschuldigung!", en: "Oh, sorry!" },
      accept: ["^nein\\b"],
      pitch: 0.9,
    },
  ],
  tschuess: [
    {
      situation: "The boat is about to leave. Anna waves from the deck.",
      speaker: "Anna",
      cue: { t: "Tschüss! Bis bald!", en: "Bye! See you soon!" },
      reaction: { t: "Bis zum nächsten Mal!", en: "Until next time!" },
      accept: TSCHUESS,
      pitch: 1.2,
    },
    {
      situation: "Greta locks up her little hut for the evening.",
      speaker: "Greta",
      cue: { t: "Ich gehe jetzt nach Hause.", en: "I'm going home now." },
      reaction: { t: "Gute Nacht!", en: "Good night!" },
      accept: TSCHUESS,
    },
  ],
  "wie-gehts": [
    {
      situation: "You meet Greta on the landing stage in the morning.",
      speaker: "Greta",
      cue: { t: "Hallo! Schön, dich zu sehen!", en: "Hi! Nice to see you!" },
      reaction: { t: "Mir geht's gut, danke! Und dir?", en: "I'm good, thanks! And you?" },
      accept: ["\\bwie geht(s| es)( dir| ihnen)?\\b"],
    },
    {
      situation: "Your friend Lukas looks a bit tired.",
      speaker: "Lukas",
      cue: { t: "Hallo …", en: "Hi …" },
      reaction: { t: "Ach, ich bin nur müde.", en: "Oh, I'm just tired." },
      accept: ["\\bwie geht(s| es)( dir| ihnen)?\\b"],
      pitch: 0.85,
    },
  ],
  "gut-danke": [
    {
      situation: "Greta smiles at you.",
      speaker: "Greta",
      cue: { t: "Wie geht's?", en: "How are you?" },
      reaction: { t: "Schön! Mir auch.", en: "Nice! Me too." },
      accept: ["^(gut|sehr gut|super|prima|ganz gut|mir geht(s| es) gut)\\b"],
    },
    {
      situation: "The captain waves from his boat.",
      speaker: "Kapitän",
      cue: { t: "Na, wie geht es dir heute?", en: "So, how are you today?" },
      reaction: { t: "Das freut mich!", en: "Glad to hear it!" },
      accept: ["^(gut|sehr gut|super|prima|ganz gut|mir geht(s| es) gut)\\b"],
      pitch: 0.7,
    },
  ],
  entschuldigung: [
    {
      situation: "You bump into someone on the landing stage.",
      speaker: "Felix",
      cue: { t: "Au!", en: "Ouch!" },
      reaction: { t: "Kein Problem!", en: "No problem!" },
      accept: ["^(entschuldigung|sorry|tut mir leid|es tut mir leid|verzeihung)\\b"],
      pitch: 0.9,
    },
    {
      situation: "You need to get past a man with a huge suitcase.",
      speaker: "Jan",
      cue: { t: "Oh, der Koffer ist so schwer …", en: "Oh, the suitcase is so heavy …" },
      reaction: { t: "Oh, bitte schön!", en: "Oh, go ahead!" },
      accept: ["^(entschuldigung|sorry|verzeihung)\\b"],
      pitch: 0.8,
    },
  ],
  "ich-heisse": [
    {
      situation: "A new visitor steps off the boat and smiles at you.",
      speaker: "Emma",
      cue: { t: "Hallo! Ich heiße Emma. Und du?", en: "Hi! My name is Emma. And you?" },
      reaction: { t: "Was für ein schöner Name, {name}!", en: "What a lovely name, {name}!" },
      accept: NAME,
      pitch: 1.2,
    },
    {
      situation: "The boat captain checks the list of passengers.",
      speaker: "Kapitän",
      cue: { t: "Wie heißt du?", en: "What's your name?" },
      reaction: { t: "Willkommen an Bord, {name}!", en: "Welcome aboard, {name}!" },
      accept: NAME,
      pitch: 0.7,
    },
    {
      situation: "Max stops his football and looks at you.",
      speaker: "Max",
      cue: { t: "Ich bin Max! Wer bist du?", en: "I'm Max! Who are you?" },
      reaction: { t: "Hallo {name}! Spielst du mit?", en: "Hi {name}! Want to play?" },
      accept: NAME,
      pitch: 1.45,
    },
  ],
  "wie-heisst-du": [
    {
      situation: "A little girl is hiding behind Greta and peeking at you.",
      speaker: "?",
      guest: "Mia",
      cue: { t: "Hallo …", en: "Hi …" },
      reaction: { t: "Ich heiße Mia!", en: "My name is Mia!" },
      accept: ["\\bwie heißt du\\b", "\\bwie ist dein name\\b"],
      pitch: 1.5,
    },
    {
      situation: "A man with a fishing rod nods at you.",
      speaker: "?",
      guest: "Tom",
      cue: { t: "Hallo! Ich bin neu hier.", en: "Hi! I'm new here." },
      reaction: { t: "Ich heiße Tom. Freut mich!", en: "My name is Tom. Nice to meet you!" },
      accept: ["\\bwie heißt du\\b", "\\bwie heißen sie\\b", "\\bwie ist dein name\\b"],
      pitch: 0.8,
    },
  ],
  "freut-mich": [
    {
      situation: "A woman introduces herself on the landing stage.",
      speaker: "Sophie",
      cue: { t: "Hallo, ich heiße Sophie.", en: "Hi, my name is Sophie." },
      reaction: { t: "Freut mich auch!", en: "Nice to meet you too!" },
      accept: ["^(freut mich|schön dich kennenzulernen|sehr erfreut)\\b"],
      pitch: 1.2,
    },
    {
      situation: "Greta's brother comes over to say hello.",
      speaker: "Lukas",
      cue: { t: "Ich bin Lukas, Gretas Bruder.", en: "I'm Lukas, Greta's brother." },
      reaction: { t: "Ebenfalls!", en: "Likewise!" },
      accept: ["^(freut mich|schön dich kennenzulernen|sehr erfreut)\\b"],
      pitch: 0.85,
    },
  ],
  "woher-kommst-du": [
    {
      situation: "A woman with a big backpack sits down next to you.",
      speaker: "?",
      guest: "Klara",
      cue: { t: "Ich bin nicht von hier.", en: "I'm not from here." },
      reaction: { t: "Ich komme aus Österreich, aus Wien.", en: "I'm from Austria, from Vienna." },
      accept: ["^woher kommst du\\b", "^woher kommen sie\\b"],
      pitch: 1.1,
    },
    {
      situation: "A man in hiking boots is looking at the lake.",
      speaker: "Ben",
      cue: { t: "Hallo! Ich mache hier Urlaub.", en: "Hi! I'm on holiday here." },
      reaction: { t: "Ich komme aus Hamburg. Und du?", en: "I'm from Hamburg. And you?" },
      accept: ["^woher kommst du\\b", "^woher kommen sie\\b"],
      pitch: 0.85,
    },
  ],
  "ich-komme-aus": [
    {
      situation: "Greta asks where you're from.",
      speaker: "Greta",
      cue: { t: "Woher kommst du?", en: "Where are you from?" },
      reaction: { t: "Toll! Da war ich noch nie.", en: "Great! I've never been there." },
    },
    {
      situation: "Emma is curious about you.",
      speaker: "Emma",
      cue: { t: "Und woher kommst du?", en: "And where are you from?" },
      reaction: { t: "Ah, interessant!", en: "Ah, interesting!" },
      pitch: 1.2,
    },
  ],
  "ich-wohne-in": [
    {
      situation: "Greta asks where you live now.",
      speaker: "Greta",
      cue: { t: "Und wo wohnst du?", en: "And where do you live?" },
      reaction: { t: "Schön! Ich wohne hier auf der Insel.", en: "Nice! I live here on the island." },
    },
    {
      situation: "Ben wants to know if you're a local.",
      speaker: "Ben",
      cue: { t: "Wohnst du hier in Tannenau?", en: "Do you live here in Tannenau?" },
      reaction: { t: "Ach so! Ich wohne in Hamburg.", en: "I see! I live in Hamburg." },
      branches: [{ when: "tannenau", reaction: { t: "Oh, dann sind wir Nachbarn!", en: "Oh, then we're neighbours!" } }],
      pitch: 0.85,
    },
  ],
  "sprichst-du": [
    {
      situation: "A tourist asks you something very fast in German.",
      speaker: "Jan",
      cue: { t: "Wissen Sie, wann das nächste Boot fährt?", en: "Do you know when the next boat leaves?" },
      reaction: { t: "Ja, ein bisschen. Das Boot fährt um drei.", en: "Yes, a little. The boat leaves at three." },
      accept: ["\\bsprichst du englisch\\b", "\\bsprechen sie englisch\\b"],
      fast: true,
      pitch: 0.8,
    },
    {
      situation: "A woman is struggling to explain something to you.",
      speaker: "Sophie",
      cue: { t: "Ich spreche nur Deutsch und Französisch.", en: "I only speak German and French." },
      reaction: { t: "Nein, leider nicht.", en: "No, unfortunately not." },
      accept: ["\\bsprichst du englisch\\b", "\\bsprechen sie englisch\\b"],
      pitch: 1.2,
    },
  ],
  "wie-bitte": [
    {
      situation: "The wind is loud. Greta shouts something from the boat.",
      speaker: "Greta",
      cue: { t: "Das Boot kommt um drei!", en: "The boat comes at three!" },
      reaction: { t: "Das Boot kommt um drei!", en: "The boat comes at three!" },
      accept: ["^(wie bitte|was|noch einmal|nochmal)\\b"],
      fast: true,
    },
    {
      situation: "The captain mumbles something into his beard.",
      speaker: "Kapitän",
      cue: { t: "Die Fahrkarte kostet vier Euro.", en: "The ticket costs four euros." },
      reaction: { t: "Vier Euro, bitte!", en: "Four euros, please!" },
      accept: ["^(wie bitte|was|noch einmal|nochmal)\\b"],
      fast: true,
      pitch: 0.7,
    },
  ],
  "ich-verstehe-nicht": [
    {
      situation: "An old man greets you in thick Black Forest dialect.",
      speaker: "Opa Karl",
      cue: { t: "Hit isch s Wetter schee, gell?", en: "The weather's nice today, isn't it? (dialect)" },
      reaction: { t: "Ach so! Heute ist das Wetter schön!", en: "I see! The weather is nice today!" },
      accept: ["\\b(ich verstehe (das )?nicht|wie bitte)\\b"],
      fast: true,
      pitch: 0.65,
    },
    {
      situation: "Max explains a very complicated game very quickly.",
      speaker: "Max",
      cue: { t: "Du musst den Ball über den Baum werfen und dann schnell zum Brunnen laufen!", en: "You have to throw the ball over the tree and then run quickly to the fountain!" },
      reaction: { t: "Okay, ich sage es noch einmal.", en: "Okay, I'll say it again." },
      accept: ["\\b(ich verstehe (das )?nicht|wie bitte)\\b"],
      fast: true,
      pitch: 1.45,
    },
  ],
  langsamer: [
    {
      situation: "Greta is in a hurry and talks very fast.",
      speaker: "Greta",
      cue: { t: "Ich habe heute keine Zeit, weil ich zum Boot muss!", en: "I don't have time today because I have to get to the boat!" },
      reaction: { t: "Oh, Entschuldigung! Ich habe heute keine Zeit.", en: "Oh, sorry! I don't have time today." },
      accept: ["\\blangsam(er)?\\b"],
      fast: true,
    },
    {
      situation: "The captain rattles off the timetable.",
      speaker: "Kapitän",
      cue: { t: "Das Boot fährt um drei, aber heute vielleicht erst um vier.", en: "The boat leaves at three, but today maybe not until four." },
      reaction: { t: "Klar! Das Boot fährt um drei.", en: "Sure! The boat leaves at three." },
      accept: ["\\blangsam(er)?\\b"],
      fast: true,
      pitch: 0.7,
    },
  ],
};

const jonas: Record<string, SceneBeat[]> = {
  "wie-alt-bist-du": [
    {
      situation: "A girl proudly shows you her new watch.",
      speaker: "Mia",
      cue: { t: "Das ist meine Geburtstagsuhr!", en: "This is my birthday watch!" },
      reaction: { t: "Ich bin heute acht Jahre alt!", en: "I'm eight years old today!" },
      accept: ["^wie alt bist du\\b"],
      pitch: 1.5,
    },
    {
      situation: "Jonas shows you a clock he built as a boy.",
      speaker: "Jonas",
      cue: { t: "Diese Uhr habe ich mit zehn gebaut.", en: "I built this clock when I was ten." },
      reaction: { t: "Ich bin vierzig. Die Uhr ist dreißig!", en: "I'm forty. The clock is thirty!" },
      accept: ["^wie alt bist du\\b"],
    },
  ],
  "ich-bin-jahre-alt": [
    {
      situation: "Jonas asks your age for his customer book.",
      speaker: "Jonas",
      cue: { t: "Wie alt bist du?", en: "How old are you?" },
      reaction: { t: "Danke! Ich schreibe es auf.", en: "Thanks! I'll write it down." },
    },
    {
      situation: "Mia is curious about you.",
      speaker: "Mia",
      cue: { t: "Ich bin acht. Und du? Wie alt bist du?", en: "I'm eight. And you? How old are you?" },
      reaction: { t: "Wow, du bist alt!", en: "Wow, you're old!" },
      pitch: 1.5,
    },
  ],
  "wie-spaet": [
    {
      situation: "You need to catch the boat, but your phone is dead.",
      speaker: "Jonas",
      cue: { t: "Kann ich dir helfen?", en: "Can I help you?" },
      reaction: { t: "Es ist Viertel nach zwei.", en: "It's quarter past two." },
      accept: ["^(entschuldigung )?wie spät ist es\\b", "^wie viel uhr ist es\\b"],
    },
    {
      situation: "You meet Emma on the market square.",
      speaker: "Emma",
      cue: { t: "Hallo!", en: "Hi!" },
      reaction: { t: "Es ist genau zwölf Uhr.", en: "It's exactly twelve o'clock." },
      accept: ["^(hallo )?(entschuldigung )?wie spät ist es\\b", "^wie viel uhr ist es\\b"],
      pitch: 1.2,
    },
  ],
  "es-ist-uhr": [
    {
      situation: "Jonas points at a clock showing ten o'clock.",
      speaker: "Jonas",
      cue: { t: "Wie spät ist es?", en: "What time is it?" },
      reaction: { t: "Genau! Zeit für einen Kaffee.", en: "Exactly! Time for a coffee." },
    },
    {
      situation: "The cuckoo clock in the window shows three o'clock.",
      speaker: "Mia",
      cue: { t: "Wie spät ist es jetzt?", en: "What time is it now?" },
      expect: { t: "Es ist drei Uhr.", en: "It's three o'clock." },
      reaction: { t: "Oh nein, ich muss nach Hause!", en: "Oh no, I have to go home!" },
      accept: ["^es ist (drei|3)( uhr)?\\b"],
      pitch: 1.5,
    },
  ],
  "v2-heute": [
    {
      situation: "Jonas asks about your plans. You're working at home today. Start with “Heute”.",
      speaker: "Jonas",
      cue: { t: "Was machst du heute?", en: "What are you doing today?" },
      reaction: { t: "Ah, dann hast du keine Zeit für Uhren.", en: "Ah, then you've no time for clocks." },
      time: "today",
    },
    {
      situation: "You're going shopping today. Start with “Heute”.",
      speaker: "Jonas",
      cue: { t: "Was machst du heute?", en: "What are you doing today?" },
      expect: { t: "Heute gehe ich einkaufen.", en: "Today I'm going shopping." },
      reaction: { t: "Bring mir eine Brezel mit!", en: "Bring me a pretzel!" },
      accept: ["^heute gehe ich\\b"],
      time: "today",
    },
  ],
  "passt-es": [
    {
      situation: "Jonas needs a day to repair your watch. Suggest Friday.",
      speaker: "Jonas",
      cue: { t: "Wann kann ich deine Uhr reparieren?", en: "When can I repair your watch?" },
      reaction: { t: "Ja, Freitag passt gut!", en: "Yes, Friday suits me fine!" },
    },
    {
      situation: "Lena wants to meet up. Suggest Friday.",
      speaker: "Lena",
      cue: { t: "Wir müssen uns bald mal treffen!", en: "We have to meet up soon!" },
      reaction: { t: "Ja, das geht!", en: "Yes, that works!" },
      pitch: 1.1,
    },
  ],
  "hier-ist": [
    {
      situation: "You're calling the clockmaker's workshop.",
      speaker: "Jonas",
      cue: { t: "Hallo? Uhrmacherei Jonas.", en: "Hello? Jonas's clock workshop." },
      reaction: { t: "Ach, hallo {name}! Wie geht's?", en: "Oh, hi {name}! How are you?" },
    },
    {
      situation: "You're calling Greta at the landing stage.",
      speaker: "Greta",
      cue: { t: "Ja, hallo? Wer ist da?", en: "Yes, hello? Who's there?" },
      reaction: { t: "Hallo {name}! Schön, dass du anrufst!", en: "Hi {name}! Nice of you to call!" },
    },
  ],
  "alles-gute": [
    {
      situation: "It's Mia's birthday today.",
      speaker: "Mia",
      cue: { t: "Heute ist mein Geburtstag!", en: "Today is my birthday!" },
      reaction: { t: "Danke schön!", en: "Thank you!" },
      accept: ["\\balles gute\\b", "\\bherzlichen glückwunsch\\b"],
      pitch: 1.5,
    },
    {
      situation: "Jonas has a party hat on.",
      speaker: "Jonas",
      cue: { t: "Ich bin heute einundvierzig!", en: "I'm forty-one today!" },
      reaction: { t: "Danke! Möchtest du Kuchen?", en: "Thanks! Would you like some cake?" },
      accept: ["\\balles gute\\b", "\\bherzlichen glückwunsch\\b"],
    },
  ],
};

const hilde: Record<string, SceneBeat[]> = {
  "ich-habe": [
    {
      situation: "Hilde shows you a photo of her family and asks about yours.",
      speaker: "Hilde",
      cue: { t: "Hast du Geschwister?", en: "Do you have siblings?" },
      reaction: { t: "Schön! Ich habe vier Brüder.", en: "Nice! I have four brothers." },
      accept: ["^(ja )?ich habe\\b"],
    },
    {
      situation: "Hilde's cat rubs against your legs.",
      speaker: "Hilde",
      cue: { t: "Hast du ein Haustier?", en: "Do you have a pet?" },
      expect: { t: "Ich habe eine Katze.", en: "I have a cat." },
      reaction: { t: "Eine Katze! Wir haben drei auf dem Hof.", en: "A cat! We have three on the farm." },
      accept: ["^(ja )?ich habe\\b"],
    },
  ],
  "hast-du": [
    {
      situation: "Hilde mentions her grandchildren. Ask if she has children.",
      speaker: "Hilde",
      cue: { t: "Ich habe fünf Enkel.", en: "I have five grandchildren." },
      reaction: { t: "Ja, zwei Töchter!", en: "Yes, two daughters!" },
      accept: ["^hast du\\b", "^haben sie\\b"],
    },
    {
      situation: "You hear barking behind the barn. Ask if Hilde has a dog.",
      speaker: "Hilde",
      cue: { t: "Hörst du das?", en: "Can you hear that?" },
      expect: { t: "Hast du einen Hund?", en: "Do you have a dog?" },
      reaction: { t: "Ja, er heißt Bello!", en: "Yes, his name is Bello!" },
      accept: ["^hast du .*hund", "^haben sie .*hund"],
    },
  ],
  kein: [
    {
      situation: "Hilde asks about children. You don't have any.",
      speaker: "Hilde",
      cue: { t: "Hast du Kinder?", en: "Do you have children?" },
      expect: { t: "Nein, ich habe keine Kinder.", en: "No, I don't have any children." },
      reaction: { t: "Noch nicht, oder?", en: "Not yet, eh?" },
      accept: ["\\bkeine kinder\\b"],
    },
    {
      situation: "Hilde asks if you drove here. You don't have a car.",
      speaker: "Hilde",
      cue: { t: "Hast du ein Auto?", en: "Do you have a car?" },
      expect: { t: "Nein, ich habe kein Auto.", en: "No, I don't have a car." },
      reaction: { t: "Hier braucht man auch kein Auto!", en: "You don't need a car here anyway!" },
      accept: ["\\bkein auto\\b"],
    },
  ],
  "wo-ist": [
    {
      situation: "Hilde's cat Mimi has disappeared again.",
      speaker: "Hilde",
      cue: { t: "Mimi! Mimi!", en: "Mimi! Mimi!" },
      expect: { t: "Wo ist die Katze?", en: "Where's the cat?" },
      reaction: { t: "Ich weiß nicht! Vielleicht in der Küche?", en: "I don't know! Maybe in the kitchen?" },
      accept: ["^wo ist\\b"],
    },
    {
      situation: "Hilde needs the key to the barn.",
      speaker: "Hilde",
      cue: { t: "Ich suche meinen Schlüssel.", en: "I'm looking for my key." },
      expect: { t: "Wo ist der Schlüssel?", en: "Where's the key?" },
      reaction: { t: "Ach, er ist in meiner Tasche!", en: "Oh, it's in my bag!" },
      accept: ["^wo ist\\b"],
    },
  ],
  "perfekt-habe-gemacht": [
    {
      situation: "Hilde asks about yesterday. You did your homework.",
      speaker: "Hilde",
      cue: { t: "Was hast du gestern gemacht?", en: "What did you do yesterday?" },
      reaction: { t: "Fleißig, fleißig!", en: "Hard-working!" },
      time: "yesterday",
    },
    {
      situation: "You baked a cake at the weekend.",
      speaker: "Hilde",
      cue: { t: "Was hast du am Wochenende gemacht?", en: "What did you do at the weekend?" },
      expect: { t: "Ich habe einen Kuchen gemacht.", en: "I made a cake." },
      reaction: { t: "Mmm! Hast du noch ein Stück?", en: "Mmm! Is there a piece left?" },
      accept: ["^ich habe .*kuchen gemacht"],
      time: "yesterday",
    },
  ],
  "perfekt-bin-gegangen": [
    {
      situation: "Yesterday you went to Franz's café.",
      speaker: "Hilde",
      cue: { t: "Wo warst du gestern?", en: "Where were you yesterday?" },
      reaction: { t: "Bei Franz? Seine Brezeln sind die besten!", en: "At Franz's? His pretzels are the best!" },
      time: "yesterday",
    },
    {
      situation: "After the market you went straight home.",
      speaker: "Hilde",
      cue: { t: "Was hast du nach dem Markt gemacht?", en: "What did you do after the market?" },
      expect: { t: "Ich bin nach Hause gegangen.", en: "I went home." },
      reaction: { t: "Gut so. Ausruhen ist wichtig.", en: "Good. Resting is important." },
      accept: ["^ich bin nach hause gegangen"],
      time: "yesterday",
    },
  ],
  "wollen-wir": [
    {
      situation: "Hilde is bored. Suggest going to the café.",
      speaker: "Hilde",
      cue: { t: "Was machen wir heute?", en: "What shall we do today?" },
      reaction: { t: "Gute Idee! Ich hole meine Jacke.", en: "Good idea! I'll get my jacket." },
      time: "today",
    },
    {
      situation: "It's sunny. Suggest going hiking.",
      speaker: "Hilde",
      cue: { t: "Die Sonne scheint so schön!", en: "The sun is shining so nicely!" },
      expect: { t: "Wollen wir wandern?", en: "Shall we go hiking?" },
      reaction: { t: "Ja, aber nicht zu weit!", en: "Yes, but not too far!" },
      accept: ["^wollen wir .*wandern"],
      time: "today",
    },
  ],
  "hast-du-lust": [
    {
      situation: "Hilde has the afternoon off. Ask if she fancies a coffee.",
      speaker: "Hilde",
      cue: { t: "Heute Nachmittag habe ich frei.", en: "I have this afternoon off." },
      reaction: { t: "Oh ja, sehr gern!", en: "Oh yes, I'd love to!" },
      time: "today",
    },
    {
      situation: "Greta is finishing work. Ask if she fancies a coffee.",
      speaker: "Greta",
      cue: { t: "Endlich Feierabend!", en: "Finally, home time!" },
      reaction: { t: "Immer! Gehen wir zu Franz.", en: "Always! Let's go to Franz's." },
      time: "today",
    },
  ],
};

const lena: Record<string, SceneBeat[]> = {
  "faehrt-dieser-zug": [
    {
      situation: "A train is waiting at platform two. You need Freiburg.",
      speaker: "Lena",
      cue: { t: "Hallo! Kann ich dir helfen?", en: "Hi! Can I help you?" },
      reaction: { t: "Ja, er fährt nach Freiburg. Gute Reise!", en: "Yes, it goes to Freiburg. Have a good trip!" },
      departure: "Freiburg",
    },
    {
      situation: "You want to go to Titisee, but you're not sure about this train.",
      speaker: "Lena",
      cue: { t: "Einsteigen, bitte!", en: "All aboard, please!" },
      expect: { t: "Fährt dieser Zug nach Titisee?", en: "Does this train go to Titisee?" },
      reaction: { t: "Ja, nach Titisee. Steig ein!", en: "Yes, to Titisee. Get on!" },
      accept: ["^fährt (dieser|der) zug nach titisee"],
      departure: "Titisee",
    },
  ],
  "ich-muss-aussteigen": [
    {
      situation: "The train stops at Titisee, your stop. A man is blocking the door.",
      speaker: "Ben",
      cue: { t: "Oh, ist das schon Titisee?", en: "Oh, is this Titisee already?" },
      reaction: { t: "Oh, Entschuldigung!", en: "Oh, sorry!" },
      accept: ["\\b(ich muss|ich möchte) (hier )?aussteigen\\b"],
      ride: "Titisee",
      pitch: 0.85,
    },
    {
      situation: "Your stop, Hinterzarten, is coming up. A woman offers you her seat.",
      speaker: "Emma",
      cue: { t: "Möchtest du meinen Platz?", en: "Would you like my seat?" },
      reaction: { t: "Ach so, tschüss!", en: "Oh I see, bye!" },
      accept: ["\\b(ich muss|ich möchte) (hier )?aussteigen\\b"],
      ride: "Hinterzarten",
      pitch: 1.2,
    },
  ],
  "ich-brauche": [
    {
      situation: "You're at the ticket counter.",
      speaker: "Lena",
      cue: { t: "Guten Tag! Was brauchst du?", en: "Hello! What do you need?" },
      reaction: { t: "Gern. Wohin fährst du?", en: "Sure. Where are you going?" },
      accept: ["^ich brauche\\b"],
    },
    {
      situation: "Your suitcase has burst open on the platform.",
      speaker: "Lena",
      cue: { t: "Oje! Alles okay?", en: "Oh dear! Everything okay?" },
      expect: { t: "Ich brauche Hilfe.", en: "I need help." },
      reaction: { t: "Klar, ich helfe dir!", en: "Sure, I'll help you!" },
      accept: ["^ich brauche( deine)? hilfe"],
    },
  ],
  "hin-und-zurueck": [
    {
      situation: "You want a return ticket to Freiburg.",
      speaker: "Lena",
      cue: { t: "Einfach oder hin und zurück?", en: "One way or return?" },
      reaction: { t: "Das macht zwölf Euro.", en: "That's twelve euros." },
      accept: ["\\bhin und zurück\\b"],
    },
    {
      situation: "Lena checks your ticket. You'll be coming back tonight.",
      speaker: "Lena",
      cue: { t: "Nach Freiburg. Nur hin?", en: "To Freiburg. Just one way?" },
      reaction: { t: "Gut, hin und zurück. Hier, bitte.", en: "Okay, return. Here you are." },
      accept: ["\\bhin und zurück\\b"],
    },
  ],
  "wo-ist-der-bahnhof": [
    {
      situation: "You need to find the station.",
      speaker: "Felix",
      cue: { t: "Kann ich helfen?", en: "Can I help?" },
      reaction: { t: "Der Bahnhof? Geradeaus und dann rechts.", en: "The station? Straight ahead and then right." },
      pitch: 0.9,
    },
    {
      situation: "You really need the toilet.",
      speaker: "Lena",
      cue: { t: "Hallo! Alles okay?", en: "Hi! Everything okay?" },
      expect: { t: "Wo ist die Toilette?", en: "Where's the toilet?" },
      reaction: { t: "Da drüben, links!", en: "Over there, on the left!" },
      accept: ["^(entschuldigung )?wo ist die toilette"],
    },
  ],
  "wie-komme-ich": [
    {
      situation: "You want to get to the market square.",
      speaker: "Lena",
      cue: { t: "Brauchst du Hilfe?", en: "Do you need help?" },
      reaction: { t: "Zum Marktplatz? Geradeaus, fünf Minuten.", en: "To the market square? Straight ahead, five minutes." },
    },
    {
      situation: "You're at the landing stage and need the station.",
      speaker: "Greta",
      cue: { t: "Kann ich dir helfen?", en: "Can I help you?" },
      expect: { t: "Wie komme ich zum Bahnhof?", en: "How do I get to the station?" },
      reaction: { t: "Immer geradeaus und dann links.", en: "Straight on and then left." },
      accept: ["^wie komme ich zum bahnhof"],
    },
  ],
};

const marie: Record<string, SceneBeat[]> = {
  "ich-nehme": [
    {
      situation: "Marie shows you her apples.",
      speaker: "Marie",
      cue: { t: "Die Äpfel sind heute super!", en: "The apples are great today!" },
      reaction: { t: "Gute Wahl! Ein Kilo?", en: "Good choice! A kilo?" },
    },
    {
      situation: "The cherries look perfect.",
      speaker: "Marie",
      cue: { t: "Und die Kirschen sind ganz frisch!", en: "And the cherries are really fresh!" },
      expect: { t: "Ich nehme die Kirschen.", en: "I'll take the cherries." },
      reaction: { t: "Die sind so süß!", en: "They're so sweet!" },
      accept: ["^ich nehme .*kirschen"],
    },
  ],
  "was-kostet-das": [
    {
      situation: "You'd like a basket of strawberries.",
      speaker: "Marie",
      cue: { t: "Frische Erdbeeren!", en: "Fresh strawberries!" },
      reaction: { t: "Drei Euro das Kilo.", en: "Three euros a kilo." },
      accept: ["^(was|wie viel) kostet\\b"],
    },
    {
      situation: "You're holding a colourful scarf.",
      speaker: "Marie",
      cue: { t: "Der Schal ist schön, oder?", en: "The scarf is pretty, isn't it?" },
      expect: { t: "Was kostet der Schal?", en: "How much is the scarf?" },
      reaction: { t: "Zwanzig Euro. Für dich achtzehn!", en: "Twenty euros. For you, eighteen!" },
      accept: ["^(was|wie viel) kostet (der )?schal"],
    },
  ],
  "das-ist-alles": [
    {
      situation: "You have everything you need.",
      speaker: "Marie",
      cue: { t: "Sonst noch etwas?", en: "Anything else?" },
      reaction: { t: "Gut, das macht fünf Euro.", en: "Okay, that's five euros." },
      accept: ["\\b(das ist alles|nein danke|das wars)\\b"],
    },
    {
      situation: "You don't need any onions.",
      speaker: "Marie",
      cue: { t: "Brauchst du noch Zwiebeln?", en: "Do you need onions too?" },
      reaction: { t: "Okay! Schönen Tag noch!", en: "Okay! Have a nice day!" },
      accept: ["\\b(das ist alles|nein danke|das wars)\\b"],
    },
  ],
  "mit-karte": [
    {
      situation: "You don't have any cash on you.",
      speaker: "Marie",
      cue: { t: "Das macht zwölf Euro.", en: "That's twelve euros." },
      expect: { t: "Kann ich mit Karte zahlen?", en: "Can I pay by card?" },
      reaction: { t: "Ja, natürlich!", en: "Yes, of course!" },
      accept: ["\\bmit karte\\b"],
    },
    {
      situation: "Your wallet only has cards in it.",
      speaker: "Marie",
      cue: { t: "Sieben Euro fünfzig, bitte.", en: "Seven euros fifty, please." },
      expect: { t: "Kann ich mit Karte zahlen?", en: "Can I pay by card?" },
      reaction: { t: "Klar, kein Problem.", en: "Sure, no problem." },
      accept: ["\\bmit karte\\b"],
    },
  ],
  "gefaellt-mir": [
    {
      situation: "Marie holds up a red dress.",
      speaker: "Marie",
      cue: { t: "Wie findest du das Kleid?", en: "What do you think of the dress?" },
      reaction: { t: "Ja? Probier es an!", en: "Yes? Try it on!" },
      accept: ["\\bgefällt mir\\b"],
    },
    {
      situation: "You try on a woolly hat.",
      speaker: "Marie",
      cue: { t: "Und die Mütze?", en: "And the hat?" },
      expect: { t: "Die Mütze gefällt mir.", en: "I like the hat." },
      reaction: { t: "Sie ist warm und schön!", en: "It's warm and pretty!" },
      accept: ["\\bgefällt mir\\b"],
    },
  ],
};

const sepp: Record<string, SceneBeat[]> = {
  "es-regnet": [
    {
      situation: "Sepp wants to go hiking, but it's pouring outside.",
      speaker: "Sepp",
      cue: { t: "Wollen wir wandern gehen?", en: "Shall we go hiking?" },
      reaction: { t: "Stimmt. Dann trinken wir einen Tee.", en: "True. Then let's have a tea." },
      accept: ["^(aber )?es regnet\\b"],
    },
    {
      situation: "Sepp sees you with an umbrella.",
      speaker: "Sepp",
      cue: { t: "Warum hast du einen Regenschirm?", en: "Why do you have an umbrella?" },
      reaction: { t: "Ach so! Ich habe keinen.", en: "Oh, I see! I don't have one." },
      accept: ["\\bes regnet\\b"],
    },
  ],
  "mir-ist-kalt": [
    {
      situation: "Snow is falling and you're shivering.",
      speaker: "Sepp",
      cue: { t: "Alles okay?", en: "Everything okay?" },
      reaction: { t: "Hier, nimm meine Jacke!", en: "Here, take my jacket!" },
      accept: ["^mir ist (so |sehr )?kalt"],
    },
    {
      situation: "Max wants to swim in the lake in October.",
      speaker: "Max",
      cue: { t: "Wollen wir im See schwimmen?", en: "Shall we swim in the lake?" },
      reaction: { t: "Haha, das Wasser ist auch kalt!", en: "Haha, the water's cold too!" },
      accept: ["\\bmir ist (so |sehr )?kalt"],
      pitch: 1.45,
    },
  ],
  "was-machst-du-gern": [
    {
      situation: "Sepp has a day off. Ask what he likes doing.",
      speaker: "Sepp",
      cue: { t: "Heute habe ich frei!", en: "I have the day off today!" },
      reaction: { t: "Ich wandere gern. Und du?", en: "I like hiking. And you?" },
      accept: ["^was machst du gern\\b"],
    },
    {
      situation: "Max is bored. Ask what he likes doing.",
      speaker: "Max",
      cue: { t: "Mir ist langweilig.", en: "I'm bored." },
      reaction: { t: "Ich spiele gern Fußball!", en: "I like playing football!" },
      accept: ["^was machst du gern\\b"],
      pitch: 1.45,
    },
  ],
  "ich-spiele-gern": [
    {
      situation: "Sepp asks about your hobbies.",
      speaker: "Sepp",
      cue: { t: "Was machst du gern?", en: "What do you like doing?" },
      reaction: { t: "Toll! Das mache ich auch gern.", en: "Great! I like doing that too." },
    },
    {
      situation: "Sophie wants to know your hobby.",
      speaker: "Sophie",
      cue: { t: "Was ist dein Hobby?", en: "What's your hobby?" },
      reaction: { t: "Oh, interessant!", en: "Oh, interesting!" },
      pitch: 1.2,
    },
  ],
  "ich-kann": [
    {
      situation: "Sepp wants to swim across the lake. You're a good swimmer.",
      speaker: "Sepp",
      cue: { t: "Kannst du schwimmen?", en: "Can you swim?" },
      expect: { t: "Ja, ich kann gut schwimmen.", en: "Yes, I can swim well." },
      reaction: { t: "Super, dann gehen wir zum See!", en: "Great, then let's go to the lake!" },
      accept: ["\\bich kann\\b"],
    },
    {
      situation: "Sepp holds out a guitar. You can't play.",
      speaker: "Sepp",
      cue: { t: "Kannst du Gitarre spielen?", en: "Can you play the guitar?" },
      expect: { t: "Nein, ich kann nicht Gitarre spielen.", en: "No, I can't play the guitar." },
      reaction: { t: "Paul kann es dir zeigen!", en: "Paul can show you!" },
      accept: ["\\bich kann (nicht|kein)"],
    },
  ],
};

const aylin: Record<string, SceneBeat[]> = {
  "tut-weh": [
    {
      situation: "You fell off your bike and your knee hurts.",
      speaker: "Aylin",
      cue: { t: "Was ist passiert?", en: "What happened?" },
      expect: { t: "Mein Knie tut weh.", en: "My knee hurts." },
      reaction: { t: "Zeig mal. Das ist nicht so schlimm.", en: "Let me see. That's not so bad." },
      accept: ["\\bknie tut (mir )?weh"],
    },
    {
      situation: "You ate far too many cherries at Hilde's.",
      speaker: "Aylin",
      cue: { t: "Was fehlt dir?", en: "What's the matter?" },
      reaction: { t: "Zu viele Kirschen, oder?", en: "Too many cherries, right?" },
    },
  ],
  "mir-geht-es-schlecht": [
    {
      situation: "You wake up feeling awful.",
      speaker: "Aylin",
      cue: { t: "Wie geht es dir heute?", en: "How are you today?" },
      reaction: { t: "Oh nein! Setz dich.", en: "Oh no! Sit down." },
      accept: ["^mir geht(s| es) (so |heute |sehr )?schlecht"],
    },
    {
      situation: "Greta notices you look pale.",
      speaker: "Greta",
      cue: { t: "Du bist so blass!", en: "You're so pale!" },
      reaction: { t: "Geh zu Aylin in die Praxis!", en: "Go and see Aylin at the surgery!" },
      accept: ["^mir geht(s| es) (so |heute |sehr )?schlecht"],
    },
  ],
  "gute-besserung": [
    {
      situation: "Max has a cold.",
      speaker: "Max",
      cue: { t: "Ich bin krank.", en: "I'm ill." },
      reaction: { t: "Danke!", en: "Thanks!" },
      accept: ["\\bgute besserung\\b"],
      pitch: 1.45,
    },
    {
      situation: "Hilde is sniffling.",
      speaker: "Hilde",
      cue: { t: "Ich habe eine Erkältung.", en: "I have a cold." },
      reaction: { t: "Danke, mein Kind!", en: "Thank you, dear!" },
      accept: ["\\bgute besserung\\b"],
    },
  ],
  "was-ist-los": [
    {
      situation: "Lukas is sitting alone on a bench, looking sad.",
      speaker: "Lukas",
      cue: { t: "Ach …", en: "Oh …" },
      reaction: { t: "Mein Hund ist krank.", en: "My dog is ill." },
      accept: ["^was ist (denn )?los\\b"],
      pitch: 0.85,
    },
    {
      situation: "Mia is crying on the market square.",
      speaker: "Mia",
      cue: { t: "Buhuu!", en: "Boo-hoo!" },
      reaction: { t: "Mein Eis ist runtergefallen!", en: "My ice cream fell down!" },
      accept: ["^was ist (denn )?los\\b"],
      pitch: 1.5,
    },
  ],
  "keine-sorge": [
    {
      situation: "Emma is worried about tomorrow.",
      speaker: "Emma",
      cue: { t: "Ich habe morgen eine Prüfung!", en: "I have an exam tomorrow!" },
      reaction: { t: "Danke, du bist lieb.", en: "Thanks, you're sweet." },
      accept: ["\\bkeine sorge\\b"],
      pitch: 1.2,
    },
    {
      situation: "Lukas has just missed his train.",
      speaker: "Lukas",
      cue: { t: "Ich habe den Zug verpasst!", en: "I missed the train!" },
      reaction: { t: "Stimmt, der nächste kommt bald.", en: "True, the next one comes soon." },
      accept: ["\\bkeine sorge\\b"],
      pitch: 0.85,
    },
  ],
  weil: [
    {
      situation: "Aylin asks why you're learning German. You live in Germany.",
      speaker: "Aylin",
      cue: { t: "Warum lernst du Deutsch?", en: "Why are you learning German?" },
      expect: { t: "Weil ich in Deutschland wohne.", en: "Because I live in Germany." },
      reaction: { t: "Ah, das ist ein guter Grund!", en: "Ah, that's a good reason!" },
      accept: ["^weil\\b"],
    },
    {
      situation: "You look exhausted. You worked a lot.",
      speaker: "Aylin",
      cue: { t: "Warum bist du so müde?", en: "Why are you so tired?" },
      expect: { t: "Weil ich viel gearbeitet habe.", en: "Because I worked a lot." },
      reaction: { t: "Dann ruh dich aus!", en: "Then get some rest!" },
      accept: ["^weil\\b"],
    },
  ],
};

const paul: Record<string, SceneBeat[]> = {
  "was-bist-du-von-beruf": [
    {
      situation: "A new neighbour mentions work. Ask what he does.",
      speaker: "Jan",
      cue: { t: "Ich arbeite in Freiburg.", en: "I work in Freiburg." },
      reaction: { t: "Ich bin Ingenieur.", en: "I'm an engineer." },
      accept: ["^was bist du von beruf\\b", "^was machst du beruflich\\b", "^was sind sie von beruf\\b"],
      pitch: 0.8,
    },
    {
      situation: "Klara mentions the hospital. Ask what she does.",
      speaker: "Klara",
      cue: { t: "Ich arbeite im Krankenhaus.", en: "I work at the hospital." },
      reaction: { t: "Ich bin Ärztin.", en: "I'm a doctor." },
      accept: ["^was bist du von beruf\\b", "^was machst du beruflich\\b", "^was sind sie von beruf\\b"],
      pitch: 1.1,
    },
  ],
  "ich-bin-von-beruf": [
    {
      situation: "Paul asks about your job.",
      speaker: "Paul",
      cue: { t: "Was bist du von Beruf?", en: "What do you do for a living?" },
      reaction: { t: "Interessant! Gefällt dir die Arbeit?", en: "Interesting! Do you like the work?" },
    },
    {
      situation: "Hilde asks what you do.",
      speaker: "Hilde",
      cue: { t: "Und was machst du beruflich?", en: "And what do you do for work?" },
      reaction: { t: "Das ist ein schöner Beruf!", en: "That's a nice job!" },
    },
  ],
  "ich-finde": [
    {
      situation: "Paul asks what you think of a book you both read.",
      speaker: "Paul",
      cue: { t: "Wie findest du das Buch?", en: "What do you think of the book?" },
      expect: { t: "Ich finde das Buch spannend.", en: "I find the book exciting." },
      reaction: { t: "Ich auch! Das Ende ist super.", en: "Me too! The ending is great." },
      accept: ["^ich finde\\b"],
    },
    {
      situation: "Paul asks what you think of the island.",
      speaker: "Paul",
      cue: { t: "Wie findest du Tannenau?", en: "What do you think of Tannenau?" },
      expect: { t: "Ich finde Tannenau schön.", en: "I think Tannenau is beautiful." },
      reaction: { t: "Das freut mich!", en: "I'm glad!" },
      accept: ["^ich finde\\b"],
    },
  ],
  "das-stimmt": [
    {
      situation: "Paul says German isn't that hard. You agree.",
      speaker: "Paul",
      cue: { t: "Deutsch ist gar nicht so schwer, oder?", en: "German isn't that hard, is it?" },
      reaction: { t: "Siehst du!", en: "You see!" },
      accept: ["^(das stimmt|stimmt|genau|richtig)\\b"],
    },
    {
      situation: "Paul praises Franz's pretzels. You agree.",
      speaker: "Paul",
      cue: { t: "Die Brezeln von Franz sind die besten!", en: "Franz's pretzels are the best!" },
      reaction: { t: "Ja, finde ich auch!", en: "Yes, I think so too!" },
      accept: ["^(das stimmt|stimmt|genau|richtig)\\b"],
    },
  ],
  dass: [
    {
      situation: "Paul asks your opinion of German. Say you think it's beautiful.",
      speaker: "Paul",
      cue: { t: "Was denkst du über die deutsche Sprache?", en: "What do you think about the German language?" },
      expect: { t: "Ich finde, dass Deutsch schön ist.", en: "I think that German is beautiful." },
      reaction: { t: "Das finde ich auch!", en: "I think so too!" },
      accept: ["\\bdass\\b"],
    },
    {
      situation: "Paul asks about the weather. Say you think it'll rain.",
      speaker: "Paul",
      cue: { t: "Wird es heute schön?", en: "Will it be nice today?" },
      expect: { t: "Ich glaube, dass es regnet.", en: "I think it's going to rain." },
      reaction: { t: "Dann nehme ich einen Regenschirm mit.", en: "Then I'll take an umbrella." },
      accept: ["\\bdass\\b"],
    },
  ],
};

export const scenes: Record<string, Record<string, SceneBeat[]>> = { greta, jonas, hilde, lena, marie, sepp, aylin, paul };

// Greta checks introductions by name; Lena points at signs and boards.
export const drills: Record<string, DrillKind> = {
  "ich-heisse": "who",
  "wo-ist-der-bahnhof": "sign",
  "faehrt-dieser-zug": "board",
  "wann-faehrt": "board",
};

export const sceneExtras: SceneExtras = {
  lines: {
    youCanSay: { t: "Du kannst antworten:", en: "You can answer:" },
    answer: { t: "Antworte!", en: "Answer!" },
    whoIsTalking: { t: "Wer spricht?", en: "Who is talking?" },
    whatDoYouSay: { t: "Was antwortest du?", en: "What do you answer?" },
    whichSign: { t: "Welches Schild?", en: "Which sign?" },
    whichTrain: { t: "Welcher Zug?", en: "Which train?" },
    when: { t: "Wann?", en: "When?" },
    puzzle: { t: "Dialog-Puzzle", en: "Dialogue puzzle" },
    puzzleHelp: { t: "Tipp in der richtigen Reihenfolge!", en: "Tap in the right order!" },
    guestBook: { t: "Gästebuch", en: "Guest book" },
    departures: { t: "Abfahrt", en: "Departures" },
    journey: { t: "Die Reise", en: "The journey" },
    riding: { t: "Der Zug fährt …", en: "The train is rolling …" },
    keepTalking: { t: "Antworte, wenn du willst …", en: "Reply if you like …" },
    you: { t: "Du", en: "You" },
    stamps: { t: "Stempel", en: "Stamps" },
  },
  guestNames: ["Anna", "Lukas", "Sophie", "Max", "Emma", "Felix", "Mia", "Tom", "Klara", "Ben", "Jan", "Lea"],
  speakers: {
    Anna: "woman", Sophie: "woman", Emma: "woman", Mia: "woman", Klara: "woman", Lea: "woman",
    Lukas: "man", Max: "man", Felix: "man", Tom: "man", Ben: "man", Jan: "man", Kapitän: "man", "Opa Karl": "man",
  },
  nameTag: "Hallo! Ich heiße",
  namePattern: "(?:ich heiße|mein name ist)\\s+(\\p{L}+)",
  departures: [
    { time: "10:15", to: "Freiburg", track: "2" },
    { time: "10:40", to: "Titisee", track: "1" },
    { time: "11:05", to: "Konstanz", track: "3" },
  ],
  track: { t: "Gleis {n}", en: "platform {n}" },
  announcements: [
    { t: "Der Zug nach Freiburg fährt von Gleis zwei ab.", en: "The train to Freiburg leaves from platform two.", to: "Freiburg" },
    { t: "Der Zug nach Titisee fährt von Gleis eins ab.", en: "The train to Titisee leaves from platform one.", to: "Titisee" },
    { t: "Der Zug nach Konstanz fährt von Gleis drei ab.", en: "The train to Konstanz leaves from platform three.", to: "Konstanz" },
    { t: "Der nächste Zug nach Freiburg fährt um Viertel nach zehn.", en: "The next train to Freiburg leaves at quarter past ten.", to: "Freiburg" },
    { t: "Der Zug nach Titisee hat zehn Minuten Verspätung.", en: "The train to Titisee is ten minutes late.", to: "Titisee" },
  ],
  signs: [
    { id: "bahnhof", line: { t: "Bahnhof", en: "Station" } },
    { id: "toilette", line: { t: "Toilette", en: "Toilet" } },
    { id: "bushaltestelle", line: { t: "Bushaltestelle", en: "Bus stop" } },
    { id: "cafe", line: { t: "Café", en: "Café" } },
  ],
  whereQuestions: [
    { t: "Wo ist der Bahnhof?", en: "Where is the station?", sign: "bahnhof" },
    { t: "Wo ist die Toilette?", en: "Where is the toilet?", sign: "toilette" },
    { t: "Wo ist die Bushaltestelle?", en: "Where is the bus stop?", sign: "bushaltestelle" },
    { t: "Wo ist das Café?", en: "Where is the café?", sign: "cafe" },
    { t: "Entschuldigung, wo ist der Bahnhof?", en: "Excuse me, where is the station?", sign: "bahnhof" },
  ],
  // Hear a sentence, pick the day it's about.
  whenSentences: {
    "v2-heute": [
      { t: "Heute arbeite ich zu Hause.", en: "Today I'm working at home.", time: "today" },
      { t: "Morgen fährt sie nach Freiburg.", en: "Tomorrow she's going to Freiburg.", time: "tomorrow" },
      { t: "Gestern hat er gearbeitet.", en: "Yesterday he worked.", time: "yesterday" },
      { t: "Heute kocht Franz.", en: "Today Franz is cooking.", time: "today" },
    ],
    "perfekt-habe-gemacht": [
      { t: "Gestern habe ich einen Kuchen gemacht.", en: "Yesterday I made a cake.", time: "yesterday" },
      { t: "Heute mache ich einen Kuchen.", en: "Today I'm making a cake.", time: "today" },
      { t: "Morgen mache ich einen Kuchen.", en: "Tomorrow I'll make a cake.", time: "tomorrow" },
    ],
    "perfekt-bin-gegangen": [
      { t: "Gestern bin ich ins Kino gegangen.", en: "Yesterday I went to the cinema.", time: "yesterday" },
      { t: "Heute gehe ich ins Café.", en: "Today I'm going to the café.", time: "today" },
      { t: "Morgen gehen wir zum See.", en: "Tomorrow we're going to the lake.", time: "tomorrow" },
    ],
    "werden-future": [
      { t: "Morgen werde ich wandern.", en: "Tomorrow I'll go hiking.", time: "tomorrow" },
      { t: "Gestern war ich wandern.", en: "Yesterday I went hiking.", time: "yesterday" },
      { t: "Heute wandere ich nicht.", en: "Today I'm not hiking.", time: "today" },
    ],
  },
  journey: ["Tannenau", "Seebrücke", "Titisee", "Hinterzarten", "Freiburg"],
  calendar: [
    { id: "yesterday", line: { t: "Gestern", en: "Yesterday" } },
    { id: "today", line: { t: "Heute", en: "Today" } },
    { id: "tomorrow", line: { t: "Morgen", en: "Tomorrow" } },
  ],
};
