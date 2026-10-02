import type { JobLessons } from "@/lib/game/job-lesson";

// The little lesson before each job in Tannenau: how it plays, its words, and
// the grammar it leans on. Explanations are in English, like grammar tips;
// examples are lines the job really says.

export const jobLessons: JobLessons = {
  labels: {
    badge: { t: "Mini-Lektion", en: "Mini lesson" },
    open: { t: "Vorbereitung", en: "Get ready" },
    newAtLevel: { t: "Neu!", en: "New!" },
  },
  jobs: {
    cafe: {
      cards: [
        {
          kind: "how",
          title: { t: "So geht's", en: "How it works" },
          steps: [
            "Guests come to the counter and order out loud.",
            "Click a drink behind the counter to put it on your tray, then click the guest to serve it.",
            "Pretzels and cake come from the kitchen: tell Franz what you need, by typing or saying it.",
            "Didn't catch it? Press “Wie bitte?” to hear the order again, slowly.",
          ],
        },
        { kind: "words", title: { t: "Die Karte", en: "The menu" }, slugs: ["kaffee", "tee", "saft", "milch", "wasser", "brezel", "kuchen"] },
        {
          kind: "grammar",
          title: { t: "Ich hätte gern …", en: "I'd like …" },
          body: "Guests order with “Ich hätte gern …” or “Ich möchte …”. What they order is the object, so der words change: ein Kaffee becomes einen Kaffee. Die and das words stay the same.",
          examples: [
            { t: "Ich hätte gern einen Kaffee.", en: "I'd like a coffee." },
            { t: "Ich möchte eine Brezel, bitte.", en: "I'd like a pretzel, please." },
            { t: "Ein Wasser, bitte.", en: "A water, please." },
          ],
        },
        {
          kind: "grammar",
          from: 1,
          title: { t: "Mit Milch", en: "With milk" },
          body: "From now on some guests order two things at once, joined with “und”, and some want their coffee or tea “mit Milch”. Put the milk on the tray as well.",
          examples: [
            { t: "Einen Tee mit Milch und eine Brezel, bitte.", en: "A tea with milk and a pretzel, please." },
            { t: "Ich hätte gern einen Kaffee mit Milch.", en: "I'd like a coffee with milk." },
          ],
        },
        {
          kind: "grammar",
          from: 2,
          title: { t: "Zwei Kaffee", en: "Two coffees" },
          body: "Now guests order two of something. At a café counter you say “zwei Kaffee” and “zwei Tee” without a plural ending, but “zwei Brezeln” and “zwei Säfte”.",
          examples: [
            { t: "Zwei Kaffee, bitte.", en: "Two coffees, please." },
            { t: "Ich möchte zwei Brezeln, bitte.", en: "I'd like two pretzels, please." },
          ],
        },
        {
          kind: "how",
          from: 3,
          title: { t: "Gut zuhören!", en: "Listen closely!" },
          steps: ["Orders are only heard now; the words show after “Wie bitte?”.", "Some guests change their mind: “… ach nein, doch lieber …” means “oh no, … instead”. Serve the second thing."],
        },
      ],
      checks: [
        {
          question: "Which order is right?",
          options: ["Ich hätte gern einen Kaffee.", "Ich hätte gern ein Kaffee.", "Ich hätte gern eine Kaffee."],
          answer: "Ich hätte gern einen Kaffee.",
          why: "der Kaffee is a der word, so after “hätte gern” it becomes einen Kaffee.",
        },
        {
          from: 3,
          question: "“Einen Saft, bitte … ach nein, doch lieber einen Tee!” What do you serve?",
          options: ["Tee", "Saft", "Saft und Tee"],
          answer: "Tee",
          why: "“doch lieber” means “… instead”: the guest wants the tea, not the juice.",
        },
      ],
    },

    home: {
      cards: [
        {
          kind: "how",
          title: { t: "So geht's", en: "How it works" },
          steps: [
            "Hilde asks for one of her things and says where it is.",
            "Click it: you walk over, pick it up and bring it to her.",
            "Often there are two of the same thing. Where she says it is tells you which one she means.",
            "Every thing has a soft glowing ring under it, so you can spot it in the room.",
          ],
        },
        { kind: "words", title: { t: "Wo?", en: "Where?" }, slugs: ["auf", "unter", "neben", "in"] },
        {
          kind: "words",
          title: { t: "Im Haus", en: "In the house" },
          slugs: ["der-tisch", "der-stuhl", "das-bett", "das-sofa", "der-schrank", "der-herd", "der-kuehlschrank", "das-fenster", "die-tuer", "die-lampe"],
        },
        { kind: "words", title: { t: "Hildes Sachen", en: "Hilde's things" }, slugs: ["die-katze", "der-hund", "der-schluessel", "die-tasse", "die-tasche", "das-buch", "die-uhr", "die-blume"] },
        {
          kind: "grammar",
          title: { t: "auf dem Tisch", en: "on the table" },
          body: "When you say where something is, auf, unter, neben and in are followed by the dative: der and das become dem, die becomes der. In dem is shortened to im.",
          examples: [
            { t: "Die Tasse ist auf dem Tisch.", en: "The cup is on the table." },
            { t: "Der Hund ist unter dem Bett.", en: "The dog is under the bed." },
            { t: "Die Blume ist neben der Lampe.", en: "The flower is next to the lamp." },
            { t: "Der Schlüssel ist im Schrank.", en: "The key is in the cupboard." },
          ],
        },
        {
          kind: "how",
          from: 2,
          title: { t: "Wo ist …?", en: "Where is …?" },
          steps: [
            "Now Hilde sometimes asks “Wo ist …?” Look around the room and tell her where it is, by typing or saying it.",
            "She goes and looks exactly where you said, so say the right place.",
            "The answer box slides down with its tab, so you can see the whole room, and back up when you're ready to answer.",
          ],
        },
        {
          kind: "grammar",
          from: 2,
          title: { t: "Er ist im Schrank.", en: "It's in the cupboard." },
          body: "You can answer with just the place, or a whole sentence. For der words say er, for die words sie, for das words es.",
          examples: [
            { t: "Unter dem Bett.", en: "Under the bed." },
            { t: "Er ist im Schrank.", en: "It's in the cupboard." },
            { t: "Sie ist auf dem Stuhl.", en: "It's on the chair." },
          ],
        },
        {
          kind: "how",
          from: 3,
          title: { t: "Gut zuhören!", en: "Listen closely!" },
          steps: ["Hilde's words only show after “Wie bitte?” now. Listen for the place, then look."],
        },
      ],
      checks: [
        {
          question: "The lamp is die Lampe. Which is right?",
          options: ["neben der Lampe", "neben dem Lampe", "neben die Lampe"],
          answer: "neben der Lampe",
          why: "Saying where something is, die becomes der: neben der Lampe.",
        },
        {
          from: 2,
          question: "“Wo ist mein Schlüssel?” It's in the cupboard (der Schrank). What do you say?",
          options: ["Im Schrank.", "In der Schrank.", "In den Schrank."],
          answer: "Im Schrank.",
          why: "der Schrank → in dem Schrank → im Schrank.",
        },
      ],
    },

    clinic: {
      cards: [
        {
          kind: "how",
          title: { t: "So geht's", en: "How it works" },
          steps: [
            "A patient tells you what hurts. Click that spot on them.",
            "Then Aylin reads out a recipe for their potion: so many spoons of which herbs, and hot or cold water. Make it in the cauldron.",
            "Press “Wie bitte?” to hear anything again.",
          ],
        },
        { kind: "words", title: { t: "Der Körper", en: "The body" }, slugs: ["der-kopf", "das-auge", "das-ohr", "die-nase", "der-zahn", "der-hals", "der-arm", "die-hand", "der-bauch", "das-bein", "der-fuss"] },
        {
          kind: "grammar",
          title: { t: "… tut weh", en: "… hurts" },
          body: "“Mein … tut weh” says what hurts: mein for der and das words, meine for die words. Some pains have their own word with -schmerzen.",
          examples: [
            { t: "Mein Kopf tut weh.", en: "My head hurts." },
            { t: "Meine Nase tut weh.", en: "My nose hurts." },
            { t: "Ich habe Bauchschmerzen.", en: "I have a stomach ache." },
          ],
        },
        { kind: "words", title: { t: "Das Rezept", en: "The recipe" }, slugs: ["rot", "gelb", "gruen", "blau"] },
        {
          kind: "grammar",
          from: 1,
          title: { t: "Keine Sorge!", en: "Don't worry!" },
          body: "Now patients also tell you how they feel. Answer like a friend: “Keine Sorge!” when they're worried, “Das tut mir leid.” when they're sad, “Wie schön!” when they're happy.",
          examples: [
            { t: "Ich bin so nervös.", en: "I'm so nervous." },
            { t: "Keine Sorge!", en: "Don't worry!" },
            { t: "Ich bin traurig. Mein Hund ist krank.", en: "I'm sad. My dog is ill." },
            { t: "Das tut mir leid.", en: "I'm sorry to hear that." },
          ],
        },
        {
          kind: "grammar",
          from: 2,
          title: { t: "Du musst …", en: "You have to …" },
          body: "Patients now ask what to do. Look at the picture and tell them with “Du musst …”: the other verb goes to the very end.",
          examples: [
            { t: "Du musst im Bett bleiben.", en: "You have to stay in bed." },
            { t: "Du musst viel trinken.", en: "You have to drink a lot." },
            { t: "Du musst dich ausruhen.", en: "You have to rest." },
          ],
        },
      ],
      checks: [
        {
          question: "die Hand: which is right?",
          options: ["Meine Hand tut weh.", "Mein Hand tut weh."],
          answer: "Meine Hand tut weh.",
          why: "die Hand is a die word, so it's meine Hand.",
        },
        {
          from: 2,
          question: "A patient has a cold. What do you tell them?",
          options: ["Du musst viel trinken.", "Du musst trinken viel.", "Du trinken musst viel."],
          answer: "Du musst viel trinken.",
          why: "With “du musst”, the other verb goes to the end: … viel trinken.",
        },
      ],
    },

    clock: {
      cards: [
        {
          kind: "how",
          title: { t: "So geht's", en: "How it works" },
          steps: ["Customers bring their stopped clocks and say what time to set.", "Drag the small hand and the big hand, then press “Fertig!”."],
        },
        { kind: "words", title: { t: "Die Uhrzeit", en: "Telling the time" }, slugs: ["es-ist-uhr", "halb", "viertel-nach", "viertel-vor", "wie-spaet"] },
        {
          kind: "grammar",
          title: { t: "halb vier", en: "half past three" },
          body: "Careful: German counts half hours towards the next hour. “Halb vier” is half way to four, so 3:30, not 4:30.",
          examples: [
            { t: "Es ist drei Uhr.", en: "It's three o'clock. (3:00)" },
            { t: "Es ist halb vier.", en: "It's half past three. (3:30)" },
          ],
        },
        {
          kind: "grammar",
          from: 1,
          title: { t: "Viertel nach, Viertel vor", en: "Quarter past, quarter to" },
          body: "Quarters work like in English: “Viertel nach drei” is 3:15, “Viertel vor vier” is 3:45. Now some customers also ask what time it is: say it in words, not numbers.",
          examples: [
            { t: "Es ist Viertel nach drei.", en: "It's quarter past three. (3:15)" },
            { t: "Es ist Viertel vor vier.", en: "It's quarter to four. (3:45)" },
          ],
        },
        {
          kind: "grammar",
          from: 2,
          title: { t: "Passt es dir?", en: "Does it suit you?" },
          body: "Now customers ask when they can collect their clock. Look at the week in the calendar: if Jonas is free then, say “Das passt gut.”; if not, “Das geht leider nicht.”",
          examples: [
            { t: "Passt es dir am Freitag um zwei Uhr?", en: "Does Friday at two suit you?" },
            { t: "Das passt gut.", en: "That works well." },
            { t: "Das geht leider nicht.", en: "Unfortunately that doesn't work." },
          ],
        },
      ],
      checks: [
        {
          question: "A customer says “Stell sie bitte auf halb fünf.” What time do you set?",
          options: ["4:30", "5:30", "5:00"],
          answer: "4:30",
          why: "halb fünf is half way to five: 4:30.",
        },
        {
          from: 1,
          question: "It's 6:45. How do you say it?",
          options: ["Viertel vor sieben", "Viertel nach sechs", "halb sieben"],
          answer: "Viertel vor sieben",
          why: "6:45 is a quarter before seven: Viertel vor sieben.",
        },
      ],
    },

    ferry: {
      cards: [
        {
          kind: "how",
          title: { t: "So geht's", en: "How it works" },
          steps: [
            "Passengers queue on the landing stage. Greet each one for the time of day the sky shows.",
            "Fill in the passenger list from how they introduce themselves.",
            "Then say goodbye as they walk up the gangway.",
            "“Wie bitte?”, “Langsamer” and “Wie schreibt man das?” ask to hear it again, slowly, or spelled.",
          ],
        },
        { kind: "words", title: { t: "Grüßen", en: "Greetings" }, slugs: ["guten-morgen", "guten-tag", "guten-abend", "hallo", "tschuess", "auf-wiedersehen"] },
        {
          kind: "grammar",
          title: { t: "Guten Morgen!", en: "Good morning!" },
          body: "Look at the sky: in the morning say “Guten Morgen!”, in the day “Guten Tag!”, in the evening “Guten Abend!”. “Hallo!” works any time.",
          examples: [
            { t: "Guten Morgen!", en: "Good morning!" },
            { t: "Guten Abend!", en: "Good evening!" },
            { t: "Ich heiße Anna.", en: "My name is Anna." },
          ],
        },
        {
          kind: "grammar",
          from: 1,
          title: { t: "du oder Sie?", en: "du or Sie?" },
          body: "Now you ask each passenger's name. Say du to children and Sie to adults. With Sie the verb changes too, and say “Auf Wiedersehen!” to adults instead of “Tschüss!”.",
          examples: [
            { t: "Wie heißt du?", en: "What's your name? (to a child)" },
            { t: "Wie heißen Sie?", en: "What's your name? (to an adult)" },
          ],
        },
        {
          kind: "words",
          from: 1,
          title: { t: "Sich vorstellen", en: "Introducing yourself" },
          slugs: ["ich-heisse", "ich-komme-aus", "ich-wohne-in", "ich-spreche", "wie-heisst-du", "wie-heissen-sie"],
        },
      ],
      checks: [
        {
          question: "The sky is dark and the lamps are lit. How do you greet a passenger?",
          options: ["Guten Abend!", "Guten Morgen!", "Gute Nacht!"],
          answer: "Guten Abend!",
          why: "In the evening it's “Guten Abend!”. “Gute Nacht!” is only for going to bed.",
        },
        {
          from: 1,
          question: "An old man is next in the queue. How do you ask his name?",
          options: ["Wie heißen Sie?", "Wie heißt du?"],
          answer: "Wie heißen Sie?",
          why: "Adults get Sie, and with Sie it's “heißen”.",
        },
      ],
    },

    market: {
      cards: [
        {
          kind: "how",
          title: { t: "So geht's", en: "How it works" },
          steps: [
            "Customers ask for fruit and vegetables. Fill the basket from the crates.",
            "Ask “Sonst noch etwas?” until they say that's all, then hand it over.",
            "Press “Wie bitte?” to hear an order again.",
          ],
        },
        {
          kind: "words",
          title: { t: "Obst und Gemüse", en: "Fruit and vegetables" },
          slugs: ["der-apfel", "die-birne", "die-banane", "die-zwiebel", "die-kirsche", "die-erdbeere", "die-tomate", "die-kartoffel", "die-karotte"],
        },
        {
          kind: "grammar",
          title: { t: "Ich nehme drei Äpfel.", en: "I'll take three apples." },
          body: "Apples, pears, bananas and onions are sold by the piece, with a number and the plural. “Sonst noch etwas?” asks if they want anything else.",
          examples: [
            { t: "Ich nehme drei Äpfel.", en: "I'll take three apples." },
            { t: "Sonst noch etwas?", en: "Anything else?" },
            { t: "Nein, danke. Das ist alles.", en: "No, thanks. That's all." },
          ],
        },
        {
          kind: "grammar",
          from: 1,
          title: { t: "Ein Kilo, bitte.", en: "A kilo, please." },
          body: "Cherries, strawberries, tomatoes, potatoes and carrots are sold by the kilo: ein Kilo, zwei Kilo, ein halbes Kilo. At the end say the price on the till in words.",
          examples: [
            { t: "Haben Sie Kirschen? Ein halbes Kilo, bitte.", en: "Do you have cherries? Half a kilo, please." },
            { t: "Das kostet vier Euro.", en: "That costs four euros." },
          ],
        },
        {
          kind: "grammar",
          from: 2,
          title: { t: "einen roten Pullover", en: "a red sweater" },
          body: "Some customers now want clothes in a colour. The colour gets the same ending as the article: einen roten Pullover, eine rote Jacke, ein rotes Hemd. They also say whether they pay cash or by card.",
          examples: [
            { t: "Ich suche einen roten Pullover.", en: "I'm looking for a red sweater." },
            { t: "Ich zahle bar.", en: "I'll pay cash." },
            { t: "Kann ich mit Karte zahlen?", en: "Can I pay by card?" },
          ],
        },
        {
          kind: "grammar",
          from: 3,
          title: { t: "zu klein, zu groß", en: "too small, too big" },
          body: "Now what you hand over might not fit. If it's “zu klein”, give a bigger size; if it's “zu groß”, a smaller one.",
          examples: [
            { t: "Hmm, er ist zu klein.", en: "Hmm, it's too small." },
            { t: "Hmm, sie ist zu groß.", en: "Hmm, it's too big." },
          ],
        },
      ],
      checks: [
        {
          question: "A customer says “Ich nehme zwei Birnen.” What goes in the basket?",
          options: ["2 Birnen", "2 Kilo Birnen", "1 Birne"],
          answer: "2 Birnen",
          why: "Pears are sold by the piece: zwei Birnen is two pears.",
        },
        {
          from: 2,
          question: "der Pullover in blue: what does the customer say?",
          options: ["Ich suche einen blauen Pullover.", "Ich suche einen blau Pullover.", "Ich suche eine blaue Pullover."],
          answer: "Ich suche einen blauen Pullover.",
          why: "der Pullover → einen blauen Pullover: the colour takes an ending too.",
        },
      ],
    },

    forest: {
      cards: [
        {
          kind: "how",
          title: { t: "So geht's", en: "How it works" },
          steps: [
            "Lost hikers call Sepp on the radio and say where they are.",
            "Find that place on the map and click it, so Sepp can go and fetch them.",
            "Didn't catch it? Press “Wie bitte?” to hear the call again, slowly.",
          ],
        },
        { kind: "words", title: { t: "Die Karte", en: "The map" }, slugs: ["der-see", "die-wiese", "der-wald", "der-berg", "der-fluss"] },
        {
          kind: "grammar",
          title: { t: "Ich bin im Wald.", en: "I'm in the forest." },
          body: "Saying where you are takes the dative, just like at Hilde's: der and das become dem, die becomes der. Am is an dem, im is in dem.",
          examples: [
            { t: "Ich bin am See.", en: "I'm by the lake." },
            { t: "Ich bin auf der Wiese.", en: "I'm in the meadow." },
            { t: "Ich bin auf dem Berg.", en: "I'm on the mountain." },
          ],
        },
        { kind: "words", from: 1, title: { t: "Das Wetter", en: "The weather" }, slugs: ["sonnig", "bewoelkt", "es-regnet", "es-schneit", "neblig", "windig", "das-gewitter"] },
        {
          kind: "grammar",
          from: 1,
          title: { t: "Hier regnet es.", en: "It's raining here." },
          body: "Now the map has two of some places, each with its own weather. The caller tells you theirs. After “hier” the verb comes second, so es moves behind it: Es regnet → Hier regnet es. Sepp will also ask you what the weather is like where he's driving: look at the map and tell him.",
          examples: [
            { t: "Hier regnet es.", en: "It's raining here." },
            { t: "Hier ist es neblig.", en: "It's foggy here." },
            { t: "Wie ist das Wetter am See?", en: "What's the weather like by the lake?" },
            { t: "Es schneit.", en: "It's snowing." },
          ],
        },
        { kind: "words", from: 2, title: { t: "Die Tiere", en: "The animals" }, slugs: ["das-reh", "der-fuchs", "der-igel", "das-eichhoernchen", "das-pferd", "der-vogel", "die-ente", "die-kuh", "das-schaf"] },
        {
          kind: "grammar",
          from: 2,
          title: { t: "Ich sehe einen Fuchs.", en: "I can see a fox." },
          body: "Callers now also say which animal they can see, and you only hear them (“Wie bitte?” shows the words). What you see is the object, so der words change: ein Fuchs becomes einen Fuchs. Die and das words stay the same.",
          examples: [
            { t: "Ich sehe einen Fuchs.", en: "I can see a fox." },
            { t: "Ich sehe eine Ente.", en: "I can see a duck." },
            { t: "Ich sehe ein Reh.", en: "I can see a deer." },
          ],
        },
      ],
      checks: [
        {
          question: "A hiker says “Ich bin am Fluss.” Where do you click?",
          options: ["der Fluss", "der See", "der Wald"],
          answer: "der Fluss",
          why: "am Fluss is “by the river”: der Fluss.",
        },
        {
          from: 1,
          question: "Snow is falling on the mountain. Sepp asks “Wie ist das Wetter auf dem Berg?”",
          options: ["Es schneit.", "Es regnet.", "Es ist sonnig."],
          answer: "Es schneit.",
          why: "Snow falling is “Es schneit.”",
        },
        {
          from: 2,
          question: "der Vogel: what does the caller say?",
          options: ["Ich sehe einen Vogel.", "Ich sehe ein Vogel.", "Ich sehe eine Vogel."],
          answer: "Ich sehe einen Vogel.",
          why: "der Vogel is a der word, so after “ich sehe” it's einen Vogel.",
        },
      ],
    },

    station: {
      cards: [
        {
          kind: "how",
          title: { t: "So geht's", en: "How it works" },
          steps: [
            "Travellers come to the kiosk and ask for a ticket.",
            "Ask “Einfach oder hin und zurück?” and make the ticket up the way they answer.",
            "Press “Wie bitte?” to hear them again.",
          ],
        },
        { kind: "words", title: { t: "Am Bahnhof", en: "At the station" }, slugs: ["die-fahrkarte", "einfach", "hin-und-zurueck", "das-gleis"] },
        {
          kind: "grammar",
          title: { t: "Eine Fahrkarte nach …", en: "A ticket to …" },
          body: "Travelling to a town is “nach”: eine Fahrkarte nach Freiburg. “Einfach” is one way; “hin und zurück” is there and back.",
          examples: [
            { t: "Eine Fahrkarte nach Titisee, bitte.", en: "A ticket to Titisee, please." },
            { t: "Einfach oder hin und zurück?", en: "One way or return?" },
          ],
        },
        {
          kind: "grammar",
          from: 1,
          title: { t: "Gleis drei", en: "Platform three" },
          body: "Now travellers ask which platform. Look at the timetable and say it in words.",
          examples: [{ t: "Gleis drei.", en: "Platform three." }],
        },
        { kind: "words", from: 2, title: { t: "Der Weg", en: "The way" }, slugs: ["links", "rechts", "geradeaus", "die-ampel", "die-erste-strasse"] },
        {
          kind: "grammar",
          from: 2,
          title: { t: "An der Ampel rechts.", en: "Right at the lights." },
          body: "Some people now ask the way. Lena gives directions one step at a time; carry the suitcase through the streets with the arrow buttons, turning where she says.",
          examples: [
            { t: "Geh geradeaus.", en: "Go straight ahead." },
            { t: "An der Ampel rechts.", en: "Right at the traffic lights." },
            { t: "Die Post ist rechts.", en: "The post office is on the right." },
          ],
        },
      ],
      checks: [
        {
          question: "A traveller wants to go to Konstanz and come back. What ticket?",
          options: ["hin und zurück", "einfach"],
          answer: "hin und zurück",
          why: "Going and coming back is “hin und zurück”.",
        },
        {
          from: 2,
          question: "Lena says “An der Ampel links.” What do you do at the traffic lights?",
          options: ["links", "rechts", "geradeaus"],
          answer: "links",
          why: "links is left.",
        },
      ],
    },
  },
};
