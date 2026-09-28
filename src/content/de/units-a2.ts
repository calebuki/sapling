import type { UnitSource } from "../dsl";

// German A2: weather, free time, health, work, the past, nature, plans,
// feelings and opinions. Same format as ./units-a1.

export const a2: UnitSource[] = [
  {
    id: "wetter",
    level: "A2",
    villager: "sepp",
    title: { t: "Wetter & Jahreszeiten", en: "Weather & seasons" },
    about: "Talking about the weather, the seasons and the months.",
    items: String.raw`
das-wetter | das Wetter | weather | Wie ist das Wetter heute? = What's the weather like today?
wie-ist-das-wetter | Wie ist das Wetter? | What's the weather like? | Wie ist das Wetter in Hamburg? = What's the weather like in Hamburg?
die-sonne | die Sonne | sun | Die Sonne scheint. = The sun is shining.
es-regnet | Es regnet. | It's raining. | Es regnet schon den ganzen Tag. = It's been raining all day.
es-schneit | Es schneit. | It's snowing. | Im Winter schneit es oft. = In winter it often snows.
der-regen | der Regen | rain | Nach dem Regen kommt die Sonne. = After the rain comes the sun.
der-schnee | der Schnee | snow | Die Kinder spielen im Schnee. = The children are playing in the snow.
der-wind | der Wind | wind | Der Wind ist kalt. = The wind is cold.
die-wolke | die Wolke | cloud | Heute gibt es viele Wolken. = There are lots of clouds today. | forms: Wolken
der-himmel | der Himmel | sky | Der Himmel ist blau. = The sky is blue.
das-gewitter | das Gewitter | thunderstorm | Heute Abend kommt ein Gewitter. = A thunderstorm is coming tonight.
der-nebel | der Nebel | fog | Am Morgen ist oft Nebel am See. = There's often fog on the lake in the morning.
sonnig | sonnig | sunny | Morgen wird es sonnig. = Tomorrow will be sunny.
bewoelkt | bewölkt | cloudy | Heute ist es bewölkt. = It's cloudy today.
windig | windig | windy | Auf dem Berg ist es windig. = It's windy on the mountain.
neblig | neblig | foggy | Es ist neblig. = It's foggy.
es-ist-kalt | Es ist kalt. | It's cold. | Brr, es ist kalt heute! = Brr, it's cold today!
es-ist-warm | Es ist warm. | It's warm. | Im Sommer ist es warm. = In summer it's warm.
mir-ist-kalt | Mir ist kalt. | I'm cold. | Mir ist kalt. Hast du eine Jacke? = I'm cold. Do you have a jacket?
das-grad | das Grad | degree | Heute sind es zwanzig Grad. = It's twenty degrees today.
die-temperatur | die Temperatur | temperature | Die Temperatur fällt. = The temperature is falling.
der-fruehling | der Frühling | spring | Im Frühling blühen die Blumen. = In spring the flowers bloom.
der-sommer | der Sommer | summer | Im Sommer schwimmen wir im See. = In summer we swim in the lake.
der-herbst | der Herbst | autumn | Im Herbst sind die Blätter bunt. = In autumn the leaves are colourful.
der-winter | der Winter | winter | Der Winter ist lang. = Winter is long.
die-jahreszeit | die Jahreszeit | season | Welche Jahreszeit magst du? = Which season do you like? | forms: Jahreszeiten
januar | Januar | January | Im Januar ist es kalt. = In January it's cold.
februar | Februar | February | Im Februar schneit es oft. = It often snows in February.
maerz | März | March | Im März kommt der Frühling. = Spring comes in March.
april | April | April | Das Wetter im April ist launisch. = The weather in April is moody.
mai | Mai | May | Im Mai blühen die Bäume. = The trees blossom in May.
juni | Juni | June | Im Juni ist es warm. = It's warm in June.
juli | Juli | July | Im Juli haben wir Urlaub. = We're on holiday in July.
august | August | August | Im August ist es heiß. = It's hot in August.
september | September | September | Im September beginnt die Schule. = School starts in September.
oktober | Oktober | October | Im Oktober ist Herbst. = In October it's autumn.
november | November | November | Im November ist es neblig. = It's foggy in November.
dezember | Dezember | December | Im Dezember ist Weihnachten. = Christmas is in December.
der-monat | der Monat | month | Welcher Monat ist jetzt? = What month is it now? | forms: Monate
der-wetterbericht | der Wetterbericht | weather forecast | Laut Wetterbericht regnet es morgen. = According to the forecast it'll rain tomorrow.
es-wird | Es wird … | It's getting … | Es wird kalt. = It's getting cold. / Es wird dunkel. = It's getting dark. | construction
der-regenschirm | der Regenschirm | umbrella | Nimm einen Regenschirm mit! = Take an umbrella with you!
scheinen | scheinen | to shine | Heute scheint die Sonne den ganzen Tag. = Today the sun is shining all day.
`,
  },
  {
    id: "freizeit",
    level: "A2",
    villager: "sepp",
    title: { t: "Freizeit & Hobbys", en: "Free time & hobbies" },
    about: "What you like doing, what you can do, and making the most of a day off.",
    items: String.raw`
die-freizeit | die Freizeit | free time | Was machst du in deiner Freizeit? = What do you do in your free time?
das-hobby | das Hobby | hobby | Mein Hobby ist Wandern. = My hobby is hiking. | forms: Hobbys
wandern | wandern | to hike | Am Wochenende wandern wir. = At the weekend we go hiking.
schwimmen | schwimmen | to swim | Im Sommer schwimme ich im See. = In summer I swim in the lake.
spielen | spielen | to play | Die Kinder spielen im Garten. = The children are playing in the garden.
fussball | Fußball | football | Spielst du gern Fußball? = Do you like playing football?
tennis | Tennis | tennis | Wir spielen Tennis. = We're playing tennis.
rad-fahren | Rad fahren | to cycle | Ich fahre gern Rad. = I like cycling.
singen | singen | to sing | Hilde singt gern. = Hilde likes singing.
tanzen | tanzen | to dance | Tanzt du gern? = Do you like dancing?
malen | malen | to paint | Mia malt ein Bild. = Mia is painting a picture.
fotografieren | fotografieren | to take photos | Ich fotografiere gern Tiere. = I like photographing animals.
die-musik | die Musik | music | Ich höre gern Musik. = I like listening to music.
das-instrument | das Instrument | instrument | Spielst du ein Instrument? = Do you play an instrument?
die-gitarre | die Gitarre | guitar | Paul spielt Gitarre. = Paul plays the guitar.
das-klavier | das Klavier | piano | Das Klavier ist alt. = The piano is old.
der-film | der Film | film | Der Film war super. = The film was great. | forms: Filme
das-kino | das Kino | cinema | Gehen wir ins Kino? = Shall we go to the cinema?
das-buch | das Buch | book | Das Buch ist spannend. = The book is exciting. | forms: Bücher
das-spiel | das Spiel | game / match | Das Spiel beginnt um drei. = The game starts at three. | forms: Spiele
der-sport | der Sport | sport | Ich mache jeden Tag Sport. = I do sport every day.
das-schwimmbad | das Schwimmbad | swimming pool | Das Schwimmbad ist im Winter zu. = The pool is closed in winter.
der-verein | der Verein | club | Ich bin im Fußballverein. = I'm in the football club.
spannend | spannend | exciting | Das Spiel ist spannend! = The game is exciting!
langweilig | langweilig | boring | Der Film ist langweilig. = The film is boring.
interessant | interessant | interesting | Das finde ich interessant. = I find that interesting.
toll | toll | great | Das ist toll! = That's great!
lieber | lieber | rather / prefer | Ich lese lieber. = I prefer reading.
am-liebsten | am liebsten | most of all | Am liebsten wandere ich. = Most of all I like hiking.
was-machst-du-gern | Was machst du gern? | What do you like doing? | Was machst du gern am Wochenende? = What do you like doing at the weekend?
ich-spiele-gern | Ich … gern. | I like … (doing) | Ich spiele gern Tennis. = I like playing tennis. / Ich schwimme gern. = I like swimming. | construction | say: Ich wandere gern. = I like hiking. | accept: ^ich \p{L}+ (\p{L}+ )?gern\b
ich-kann | Ich kann … | I can … | Ich kann gut schwimmen. = I can swim well. / Kannst du tanzen? = Can you dance? | construction
ich-will | Ich will … | I want (to) … | Ich will heute wandern. = I want to go hiking today. | construction
der-ausflug | der Ausflug | trip / outing | Wir machen einen Ausflug zum See. = We're going on a trip to the lake.
der-berg | der Berg | mountain | Der Berg ist hoch. = The mountain is high. | forms: Berge
der-see | der See | lake | Der See ist tief. = The lake is deep.
der-spaziergang | der Spaziergang | walk | Wir machen einen Spaziergang. = We're going for a walk.
spazieren-gehen | spazieren gehen | to go for a walk | Ich gehe gern spazieren. = I like going for walks.
treffen | treffen | to meet | Ich treffe meine Freunde. = I'm meeting my friends.
die-party | die Party | party | Kommst du zur Party? = Are you coming to the party?
mitkommen | mitkommen | to come along | Kommst du mit? = Are you coming along?
`,
  },
  {
    id: "gesundheit",
    level: "A2",
    villager: "aylin",
    title: { t: "Körper & Gesundheit", en: "Body & health" },
    about: "Saying what hurts, at the doctor's, and getting well again.",
    items: String.raw`
der-koerper | der Körper | body | Der Körper braucht Wasser. = The body needs water.
der-kopf | der Kopf | head | Mein Kopf tut weh. = My head hurts.
das-auge | das Auge | eye | Sie hat blaue Augen. = She has blue eyes. | forms: Augen
das-ohr | das Ohr | ear | Mein Ohr tut weh. = My ear hurts. | forms: Ohren
die-nase | die Nase | nose | Meine Nase läuft. = My nose is running.
der-mund | der Mund | mouth | Mach bitte den Mund auf. = Please open your mouth.
der-zahn | der Zahn | tooth | Ich habe Zahnschmerzen. = I have toothache. | forms: Zähne
der-hals | der Hals | throat / neck | Mein Hals tut weh. = My throat hurts.
der-arm | der Arm | arm | Mein Arm ist gebrochen. = My arm is broken. | forms: Arme
die-hand | die Hand | hand | Wasch dir die Hände! = Wash your hands! | forms: Hände
das-bein | das Bein | leg | Mein Bein tut weh. = My leg hurts. | forms: Beine
der-fuss | der Fuß | foot | Mein Fuß ist kalt. = My foot is cold. | forms: Füße
der-bauch | der Bauch | belly / stomach | Ich habe Bauchschmerzen. = I have a stomach ache.
der-ruecken | der Rücken | back | Mein Rücken tut weh. = My back hurts.
das-herz | das Herz | heart | Das Herz schlägt schnell. = The heart is beating fast.
tut-weh | … tut weh. | … hurts. | Mein Knie tut weh. = My knee hurts. / Tut das weh? = Does that hurt? | construction | say: Mein Bauch tut weh. = My stomach hurts. | accept: ^(mein|meine) \p{L}+ tut (mir )?weh
die-schmerzen | die Schmerzen | pain | Ich habe starke Schmerzen. = I'm in a lot of pain.
krank | krank | ill / sick | Ich bin krank. = I'm ill.
das-fieber | das Fieber | fever | Das Kind hat Fieber. = The child has a fever.
die-erkaeltung | die Erkältung | cold (illness) | Ich habe eine Erkältung. = I have a cold.
der-husten | der Husten | cough | Der Husten ist schlimm. = The cough is bad.
der-schnupfen | der Schnupfen | runny nose | Ich habe Schnupfen. = I have a runny nose.
muede | müde | tired | Ich bin so müde. = I'm so tired.
der-arzt | der Arzt / die Ärztin | doctor | Ich gehe zum Arzt. = I'm going to the doctor.
die-praxis | die Praxis | doctor's surgery | Die Praxis ist am Marktplatz. = The surgery is on the market square.
der-termin | der Termin | appointment | Ich brauche einen Termin. = I need an appointment. | forms: Termine
das-medikament | das Medikament | medicine | Nimm das Medikament zweimal am Tag. = Take the medicine twice a day. | forms: Medikamente
die-tablette | die Tablette | pill | Eine Tablette nach dem Essen. = One pill after eating. | forms: Tabletten
das-rezept | das Rezept | prescription / recipe | Hier ist Ihr Rezept. = Here's your prescription.
was-fehlt-ihnen | Was fehlt Ihnen? | What seems to be the problem? | Guten Tag! Was fehlt Ihnen? = Hello! What seems to be the problem?
wie-fuehlst-du-dich | Wie fühlst du dich? | How do you feel? | Wie fühlst du dich heute? = How do you feel today?
mir-geht-es-schlecht | Mir geht es schlecht. | I'm not well. | Mir geht es heute schlecht. = I'm not well today.
mir-geht-es-besser | Mir geht es besser. | I'm feeling better. | Danke, mir geht es schon besser. = Thanks, I'm already feeling better.
gute-besserung | Gute Besserung! | Get well soon! | Du bist krank? Gute Besserung! = You're ill? Get well soon!
sich-ausruhen | sich ausruhen | to rest | Du musst dich ausruhen. = You have to rest.
im-bett-bleiben | im Bett bleiben | to stay in bed | Bleib heute im Bett! = Stay in bed today!
der-notfall | der Notfall | emergency | Das ist ein Notfall! = This is an emergency!
hilfe | Hilfe! | Help! | Hilfe! Ich brauche einen Arzt! = Help! I need a doctor!
das-krankenhaus | das Krankenhaus | hospital | Er ist im Krankenhaus. = He's in hospital.
schlimm | schlimm | bad | Ist es schlimm? – Nein, nicht so schlimm. = Is it bad? – No, not so bad.
du-musst | Du musst … | You have to … | Du musst viel trinken. = You have to drink a lot. / Muss ich im Bett bleiben? = Do I have to stay in bed? | construction
du-sollst | Du sollst … | You should … | Du sollst jeden Tag spazieren gehen. = You should go for a walk every day. | construction
`,
  },
  {
    id: "arbeit",
    level: "A2",
    villager: "paul",
    title: { t: "Arbeit & Schule", en: "Work & school" },
    about: "Jobs, workplaces, subjects and exams.",
    items: String.raw`
die-arbeit | die Arbeit | work | Die Arbeit macht Spaß. = The work is fun.
der-beruf | der Beruf | job / profession | Was ist dein Beruf? = What's your job?
was-bist-du-von-beruf | Was bist du von Beruf? | What do you do for a living? | Was bist du von Beruf? – Ich bin Lehrer. = What do you do? – I'm a teacher.
ich-bin-von-beruf | Ich bin … von Beruf. | I'm a … by profession. | Ich bin Ärztin von Beruf. = I'm a doctor. | say: Ich bin Lehrer von Beruf. = I'm a teacher. | accept: ^ich bin \p{L}+( von beruf)?$ ;; ^ich arbeite als \p{L}+
der-lehrer | der Lehrer / die Lehrerin | teacher | Paul ist Lehrer. = Paul is a teacher. | forms: Lehrern
der-baecker | der Bäcker / die Bäckerin | baker | Franz ist Bäcker. = Franz is a baker.
der-koch | der Koch / die Köchin | cook / chef | Der Koch macht Suppe. = The cook is making soup.
der-verkaeufer | der Verkäufer / die Verkäuferin | salesperson | Marie ist Verkäuferin. = Marie is a saleswoman.
der-student | der Student / die Studentin | student (university) | Meine Schwester ist Studentin. = My sister is a student.
der-schueler | der Schüler / die Schülerin | pupil | Die Schüler lernen Mathe. = The pupils are learning maths.
der-ingenieur | der Ingenieur / die Ingenieurin | engineer | Mein Vater ist Ingenieur. = My father is an engineer.
die-krankenschwester | der Krankenpfleger / die Krankenschwester | nurse | Meine Tante ist Krankenschwester. = My aunt is a nurse.
das-buero | das Büro | office | Ich arbeite im Büro. = I work in an office.
die-firma | die Firma | company | Die Firma ist in Freiburg. = The company is in Freiburg.
der-chef | der Chef / die Chefin | boss | Meine Chefin ist nett. = My boss is nice.
der-kollege | der Kollege / die Kollegin | colleague | Meine Kollegen sind lustig. = My colleagues are funny. | forms: Kollegen
der-computer | der Computer | computer | Der Computer ist langsam. = The computer is slow.
die-universitaet | die Universität | university | Ich studiere an der Universität. = I study at the university.
studieren | studieren | to study (at university) | Was studierst du? = What are you studying?
lernen | lernen | to learn / to study | Wir lernen zusammen. = We study together.
das-fach | das Fach | subject | Mein Lieblingsfach ist Kunst. = My favourite subject is art. | forms: Fächer
mathe | Mathe | maths | Mathe ist schwer. = Maths is difficult.
die-klasse | die Klasse | class / year | Mia ist in der fünften Klasse. = Mia is in fifth grade.
die-pruefung | die Prüfung | exam | Morgen habe ich eine Prüfung. = Tomorrow I have an exam.
die-hausaufgaben | die Hausaufgaben | homework | Die Hausaufgaben sind fertig. = The homework is done.
die-pause | die Pause | break | In der Pause essen wir. = We eat during the break.
der-feierabend | der Feierabend | end of the workday | Endlich Feierabend! = Finally home time!
anfangen | anfangen | to begin | Die Arbeit fängt um acht an. = Work starts at eight.
aufhoeren | aufhören | to stop | Um fünf höre ich auf. = I stop at five.
verdienen | verdienen | to earn | Er verdient gut. = He earns well.
ich-suche-arbeit | Ich suche Arbeit. | I'm looking for work. | Ich suche Arbeit als Koch. = I'm looking for work as a cook.
der-job | der Job | job | Ich habe einen neuen Job. = I have a new job.
arbeitslos | arbeitslos | unemployed | Mein Bruder ist arbeitslos. = My brother is unemployed.
die-erfahrung | die Erfahrung | experience | Ich habe viel Erfahrung. = I have a lot of experience.
wichtig | wichtig | important | Die Prüfung ist wichtig. = The exam is important.
leicht | leicht | easy / light | Die Aufgabe ist leicht. = The task is easy.
schwierig | schwierig | difficult | Deutsch ist nicht so schwierig! = German isn't that difficult!
fertig | fertig | finished / ready | Bist du fertig? = Are you finished?
als | als | as | Ich arbeite als Lehrer. = I work as a teacher.
die-besprechung | die Besprechung | meeting | Die Besprechung dauert eine Stunde. = The meeting takes an hour.
die-e-mail | die E-Mail | email | Ich schreibe eine E-Mail. = I'm writing an email.
`,
  },
  {
    id: "vergangenheit",
    level: "A2",
    villager: "hilde",
    title: { t: "Was hast du gemacht?", en: "What did you do?" },
    about: "Talking about the past: haben and sein with past participles, war and hatte.",
    items: String.raw`
perfekt-habe-gemacht | Ich habe … gemacht. | I did … | Ich habe einen Kuchen gemacht. = I made a cake. / Was hast du gestern gemacht? = What did you do yesterday? | construction | say: Ich habe Hausaufgaben gemacht. = I did homework. | accept: ^ich habe .+ gemacht$ | note: For most verbs, talk about the past with haben and a past participle at the end: gemacht, gekauft, gespielt.
perfekt-bin-gegangen | Ich bin … gegangen. | I went … | Ich bin nach Hause gegangen. = I went home. / Wir sind ins Kino gegangen. = We went to the cinema. | construction | say: Ich bin ins Café gegangen. = I went to the café. | accept: ^ich bin .+ gegangen$ | note: Verbs of movement like gehen, fahren and kommen use sein instead of haben.
war | war | was | Gestern war ich müde. = Yesterday I was tired. / Wie war dein Tag? = How was your day?
hatte | hatte | had | Ich hatte keine Zeit. = I didn't have time.
letzte-woche | letzte Woche | last week | Letzte Woche war ich krank. = Last week I was ill.
letztes-jahr | letztes Jahr | last year | Letztes Jahr war ich in Italien. = Last year I was in Italy.
vorgestern | vorgestern | the day before yesterday | Vorgestern hat es geregnet. = It rained the day before yesterday.
frueher | früher | in the past / earlier | Früher hatten wir viele Kühe. = We used to have lots of cows.
schon | schon | already | Ich habe schon gegessen. = I've already eaten.
noch-nicht | noch nicht | not yet | Ich habe das Buch noch nicht gelesen. = I haven't read the book yet.
gemacht | gemacht | done / made | Hast du das gemacht? = Did you do that?
gegessen | gegessen | eaten | Wir haben Pizza gegessen. = We ate pizza.
getrunken | getrunken | drunk | Ich habe zu viel Kaffee getrunken. = I drank too much coffee.
gesehen | gesehen | seen | Hast du den Film gesehen? = Have you seen the film?
gekauft | gekauft | bought | Ich habe Äpfel gekauft. = I bought apples.
gespielt | gespielt | played | Wir haben Karten gespielt. = We played cards.
gearbeitet | gearbeitet | worked | Ich habe lange gearbeitet. = I worked for a long time.
gelernt | gelernt | learned | Heute habe ich viel gelernt. = I learned a lot today.
gelesen | gelesen | read (past) | Ich habe das Buch gelesen. = I've read the book.
geschrieben | geschrieben | written | Hast du die E-Mail geschrieben? = Did you write the email?
geschlafen | geschlafen | slept | Hast du gut geschlafen? = Did you sleep well?
gegangen | gegangen | gone / went | Sie ist nach Hause gegangen. = She went home.
gefahren | gefahren | gone (by vehicle) | Wir sind nach Freiburg gefahren. = We went to Freiburg.
gekommen | gekommen | come / came | Wann bist du gekommen? = When did you come?
geblieben | geblieben | stayed | Ich bin zu Hause geblieben. = I stayed at home.
gewesen | gewesen | been | Ich bin noch nie in Berlin gewesen. = I've never been to Berlin.
aufgestanden | aufgestanden | got up | Ich bin früh aufgestanden. = I got up early.
getroffen | getroffen | met | Ich habe Greta getroffen. = I met Greta.
besucht | besucht | visited | Wir haben Oma besucht. = We visited grandma.
gekocht | gekocht | cooked | Hilde hat Suppe gekocht. = Hilde cooked soup.
gebacken | gebacken | baked | Franz hat Brot gebacken. = Franz baked bread.
erzaehlen | erzählen | to tell | Erzähl mal! = Tell me!
was-ist-passiert | Was ist passiert? | What happened? | Was ist gestern passiert? = What happened yesterday?
dann | dann | then | Dann bin ich nach Hause gegangen. = Then I went home.
danach | danach | after that | Danach haben wir gegessen. = After that we ate.
zuerst | zuerst | first | Zuerst habe ich gefrühstückt. = First I had breakfast.
am-ende | am Ende | in the end | Am Ende war alles gut. = In the end everything was fine.
vor-einer-woche | vor einer Woche | a week ago | Vor einer Woche war ich in Wien. = A week ago I was in Vienna.
schon-mal | schon mal | ever / before | Warst du schon mal in Tannenau? = Have you ever been to Tannenau?
wie-war-das-wochenende | Wie war das Wochenende? | How was the weekend? | Wie war dein Wochenende? – Super! = How was your weekend? – Great!
`,
  },
  {
    id: "natur",
    level: "A2",
    villager: "sepp",
    title: { t: "Natur & Tiere", en: "Nature & animals" },
    about: "The forest, the lake, animals and looking after the environment.",
    items: String.raw`
die-natur | die Natur | nature | Ich bin gern in der Natur. = I like being in nature.
der-wald | der Wald | forest | Der Wald ist dunkel. = The forest is dark. | forms: Wälder
der-baum | der Baum | tree | Der Baum ist sehr alt. = The tree is very old. | forms: Bäume
die-tanne | die Tanne | fir tree | Die Tannen sind hoch. = The firs are tall. | forms: Tannen
die-blume | die Blume | flower | Die Blumen riechen gut. = The flowers smell good. | forms: Blumen
das-gras | das Gras | grass | Das Gras ist nass. = The grass is wet.
das-blatt | das Blatt | leaf | Die Blätter fallen. = The leaves are falling. | forms: Blätter
der-fluss | der Fluss | river | Der Fluss ist kalt. = The river is cold.
das-meer | das Meer | sea | Das Meer ist weit weg. = The sea is far away.
die-insel | die Insel | island | Tannenau ist eine Insel. = Tannenau is an island.
der-stein | der Stein | stone | Der Stein ist schwer. = The stone is heavy. | forms: Steine
das-tier | das Tier | animal | Im Wald leben viele Tiere. = Many animals live in the forest. | forms: Tiere
der-vogel | der Vogel | bird | Der Vogel singt. = The bird is singing. | forms: Vögel
das-reh | das Reh | deer | Das Reh ist scheu. = The deer is shy. | forms: Rehe
der-fuchs | der Fuchs | fox | Der Fuchs ist schlau. = The fox is clever.
der-igel | der Igel | hedgehog | Im Garten wohnt ein Igel. = A hedgehog lives in the garden.
das-eichhoernchen | das Eichhörnchen | squirrel | Das Eichhörnchen sammelt Nüsse. = The squirrel collects nuts.
die-kuh | die Kuh | cow | Die Kuh gibt Milch. = The cow gives milk. | forms: Kühe
das-pferd | das Pferd | horse | Das Pferd ist schnell. = The horse is fast. | forms: Pferde
das-schaf | das Schaf | sheep | Die Schafe sind auf der Wiese. = The sheep are in the meadow. | forms: Schafe
die-ente | die Ente | duck | Die Enten schwimmen auf dem See. = The ducks are swimming on the lake. | forms: Enten
die-wiese | die Wiese | meadow | Die Wiese ist grün. = The meadow is green.
der-pilz | der Pilz | mushroom | Ist der Pilz giftig? = Is the mushroom poisonous? | forms: Pilze
die-luft | die Luft | air | Die Luft ist hier so frisch. = The air here is so fresh.
leben | leben | to live | Der Fuchs lebt im Wald. = The fox lives in the forest.
wachsen | wachsen | to grow | Die Bäume wachsen langsam. = The trees grow slowly.
sehen | sehen | to see | Siehst du das Reh? = Can you see the deer?
riechen | riechen | to smell | Das riecht gut! = That smells good!
still | still | quiet / still | Der See ist ganz still. = The lake is completely still.
wild | wild | wild | Das ist ein wildes Tier. = That's a wild animal.
gefaehrlich | gefährlich | dangerous | Ist der Fuchs gefährlich? = Is the fox dangerous?
tief | tief | deep | Wie tief ist der See? = How deep is the lake?
hoch | hoch | high / tall | Wie hoch ist der Berg? = How high is the mountain?
die-umwelt | die Umwelt | environment | Wir schützen die Umwelt. = We protect the environment.
der-muell | der Müll | rubbish | Bitte keinen Müll im Wald! = No rubbish in the forest, please!
schuetzen | schützen | to protect | Der Förster schützt den Wald. = The forester protects the forest.
der-sonnenaufgang | der Sonnenaufgang | sunrise | Der Sonnenaufgang ist wunderschön. = The sunrise is beautiful.
das-feuer | das Feuer | fire | Kein Feuer im Wald! = No fires in the forest!
der-schatten | der Schatten | shade / shadow | Wir sitzen im Schatten. = We're sitting in the shade.
nass | nass | wet | Meine Schuhe sind nass. = My shoes are wet.
trocken | trocken | dry | Das Holz ist trocken. = The wood is dry.
das-holz | das Holz | wood | Sepp hackt Holz. = Sepp is chopping wood.
`,
  },
  {
    id: "termine",
    level: "A2",
    villager: "jonas",
    title: { t: "Termine & Telefon", en: "Appointments & phone" },
    about: "Phone calls, dates, birthdays and finding a time that suits.",
    items: String.raw`
das-telefon | das Telefon | telephone | Das Telefon klingelt. = The phone is ringing.
das-handy | das Handy | mobile phone | Wo ist mein Handy? = Where's my phone?
anrufen | anrufen | to call (phone) | Ich rufe dich morgen an. = I'll call you tomorrow.
hier-ist | Hier ist … | This is … (on the phone) | Hallo, hier ist Jonas. = Hello, this is Jonas. | say: Hallo, hier ist Caleb. = Hello, this is {name}. | accept: ^(hallo )?hier ist \p{L}+
kann-ich-sprechen | Kann ich mit … sprechen? | Can I speak to …? | Kann ich mit Frau Weber sprechen? = Can I speak to Mrs Weber? | say: Kann ich mit Lena sprechen? = Can I speak to Lena? | accept: ^kann ich (bitte )?mit \p{L}+ .*sprechen
einen-moment | Einen Moment, bitte. | One moment, please. | Einen Moment, bitte, ich hole sie. = One moment please, I'll get her.
die-nachricht | die Nachricht | message | Ich schreibe dir eine Nachricht. = I'll write you a message.
zurueckrufen | zurückrufen | to call back | Kannst du mich zurückrufen? = Can you call me back?
einen-termin-machen | einen Termin machen | to make an appointment | Ich möchte einen Termin machen. = I'd like to make an appointment.
passt-es | Passt es dir am …? | Does … suit you? | Passt es dir am Montag? = Does Monday suit you? | say: Passt es dir am Freitag? = Does Friday suit you? | accept: ^passt (es )?(dir|ihnen) (am )?\p{L}+
das-passt | Das passt gut. | That works well. | Ja, das passt gut! = Yes, that works well!
das-geht-nicht | Das geht leider nicht. | Unfortunately that doesn't work. | Am Montag geht es leider nicht. = Monday doesn't work, unfortunately.
leider | leider | unfortunately | Ich habe leider keine Zeit. = Unfortunately I don't have time.
absagen | absagen | to cancel | Ich muss den Termin absagen. = I have to cancel the appointment.
verschieben | verschieben | to postpone | Können wir den Termin verschieben? = Can we postpone the appointment?
das-datum | das Datum | date | Welches Datum ist heute? = What's the date today?
der-erste | der erste … | the first (of the month) | Heute ist der erste Mai. = Today is the first of May. | say: Heute ist der erste Juni. = Today is the first of June.
am-zweiten | am zweiten … | on the second … | Ich habe am zweiten Juni Geburtstag. = My birthday is on the second of June. | say: am zweiten Mai = on the second of May
der-geburtstag | der Geburtstag | birthday | Wann hast du Geburtstag? = When is your birthday?
alles-gute | Alles Gute zum Geburtstag! | Happy birthday! | Alles Gute zum Geburtstag, Mia! = Happy birthday, Mia!
der-kalender | der Kalender | calendar | Ich schaue in meinen Kalender. = I'll look in my calendar.
wann | wann | when | Wann hast du Zeit? = When do you have time?
um-wie-viel-uhr | Um wie viel Uhr? | At what time? | Um wie viel Uhr treffen wir uns? = What time shall we meet?
von-bis | von … bis … | from … to … | Ich arbeite von acht bis vier. = I work from eight to four. | say: von neun bis fünf = from nine to five | accept: ^von [\p{L}\p{N}]+ bis [\p{L}\p{N}]+
vormittags | vormittags | in the mornings | Vormittags bin ich im Büro. = In the mornings I'm in the office.
nachmittags | nachmittags | in the afternoons | Nachmittags habe ich Zeit. = I have time in the afternoons.
abends | abends | in the evenings | Abends lese ich gern. = I like reading in the evenings.
spaeter | später | later | Ich rufe später an. = I'll call later.
naechste-woche | nächste Woche | next week | Nächste Woche habe ich Urlaub. = Next week I'm on holiday.
uebermorgen | übermorgen | the day after tomorrow | Übermorgen ist Samstag. = The day after tomorrow is Saturday.
die-adresse | die Adresse | address | Wie ist deine Adresse? = What's your address?
die-e-mail-adresse | die E-Mail-Adresse | email address | Schreib mir deine E-Mail-Adresse. = Write me your email address.
erreichen | erreichen | to reach (someone) | Ich kann dich nicht erreichen. = I can't reach you.
klingeln | klingeln | to ring | Es klingelt an der Tür. = Someone's ringing at the door.
die-verabredung | die Verabredung | date / arrangement | Ich habe heute eine Verabredung. = I have a date today.
sich-treffen | sich treffen | to meet (up) | Wir treffen uns um acht. = We're meeting at eight.
vergessen | vergessen | to forget | Ich habe den Termin vergessen! = I forgot the appointment!
bis-dann | Bis dann! | See you then! | Also, bis dann! = Well, see you then!
`,
  },
  {
    id: "reisen",
    level: "A2",
    villager: "lena",
    title: { t: "Reisen & Urlaub", en: "Travel & holidays" },
    about: "Booking a room, countries, sights and telling people about a trip.",
    items: String.raw`
der-urlaub | der Urlaub | holiday / vacation | Ich mache Urlaub in Italien. = I'm on holiday in Italy.
reisen | reisen | to travel | Ich reise gern. = I like travelling.
das-land | das Land | country / countryside | Welche Länder hast du besucht? = Which countries have you visited? | forms: Länder
das-ausland | das Ausland | abroad | Sie arbeitet im Ausland. = She works abroad.
der-pass | der Pass | passport | Hast du deinen Pass? = Do you have your passport?
das-gepaeck | das Gepäck | luggage | Das Gepäck ist schon im Auto. = The luggage is already in the car.
packen | packen | to pack | Ich muss noch packen. = I still have to pack.
buchen | buchen | to book | Ich habe ein Zimmer gebucht. = I've booked a room.
das-doppelzimmer | das Doppelzimmer | double room | Ein Doppelzimmer, bitte. = A double room, please.
das-einzelzimmer | das Einzelzimmer | single room | Haben Sie ein Einzelzimmer frei? = Do you have a single room free?
fuer-zwei-naechte | für zwei Nächte | for two nights | Ein Zimmer für zwei Nächte, bitte. = A room for two nights, please.
mit-fruehstueck | mit Frühstück | with breakfast | Ist das Zimmer mit Frühstück? = Does the room include breakfast?
die-rezeption | die Rezeption | reception | Der Schlüssel ist an der Rezeption. = The key is at reception.
ich-habe-reserviert | Ich habe reserviert. | I have a reservation. | Guten Abend, ich habe ein Zimmer reserviert. = Good evening, I've reserved a room.
der-flughafen | der Flughafen | airport | Wie komme ich zum Flughafen? = How do I get to the airport?
fliegen | fliegen | to fly | Wir fliegen nach Spanien. = We're flying to Spain.
der-strand | der Strand | beach | Wir liegen am Strand. = We're lying on the beach.
das-zelt | das Zelt | tent | Wir schlafen im Zelt. = We're sleeping in a tent.
der-campingplatz | der Campingplatz | campsite | Der Campingplatz ist am See. = The campsite is by the lake.
die-sehenswuerdigkeit | die Sehenswürdigkeit | sight / attraction | Was sind die Sehenswürdigkeiten hier? = What are the sights here? | forms: Sehenswürdigkeiten
besichtigen | besichtigen | to visit (a sight) | Wir besichtigen die Kirche. = We're visiting the church.
der-tourist | der Tourist / die Touristin | tourist | Im Sommer kommen viele Touristen. = Many tourists come in summer. | forms: Touristen
die-postkarte | die Postkarte | postcard | Ich schreibe eine Postkarte. = I'm writing a postcard.
das-andenken | das Andenken | souvenir | Ich kaufe ein Andenken. = I'm buying a souvenir.
die-grenze | die Grenze | border | Die Grenze zur Schweiz ist nah. = The border with Switzerland is close.
die-schweiz | die Schweiz | Switzerland | Wir fahren in die Schweiz. = We're going to Switzerland.
oesterreich | Österreich | Austria | Wien ist in Österreich. = Vienna is in Austria.
frankreich | Frankreich | France | Frankreich ist sehr schön. = France is very beautiful.
italien | Italien | Italy | Im Sommer fahren wir nach Italien. = In summer we're going to Italy.
spanien | Spanien | Spain | In Spanien ist es heiß. = It's hot in Spain.
warst-du-schon-mal | Warst du schon mal in …? | Have you ever been to …? | Warst du schon mal in Wien? = Have you ever been to Vienna? | say: Warst du schon mal in Berlin? = Have you ever been to Berlin? | accept: ^warst du (schon )?(mal )?in \p{L}+
ich-war-in | Ich war in … | I was in … | Ich war letztes Jahr in Spanien. = I was in Spain last year. | say: Ich war in Italien. = I was in Italy. | accept: ^ich war (schon )?(mal )?(letztes jahr )?in \p{L}+
wie-war-die-reise | Wie war die Reise? | How was the trip? | Wie war die Reise? – Lang, aber schön. = How was the trip? – Long, but nice.
die-ferien | die Ferien | school holidays | In den Ferien fahren wir weg. = We're going away in the holidays.
wegfahren | wegfahren | to go away | Fahrt ihr im Sommer weg? = Are you going away in the summer?
wunderschoen | wunderschön | beautiful | Der See ist wunderschön! = The lake is beautiful!
die-landschaft | die Landschaft | landscape | Die Landschaft im Schwarzwald ist toll. = The landscape in the Black Forest is great.
der-schwarzwald | der Schwarzwald | the Black Forest | Tannenau liegt im Schwarzwald. = Tannenau is in the Black Forest.
verpassen | verpassen | to miss | Ich habe den Zug verpasst! = I missed the train!
`,
  },
  {
    id: "plaene",
    level: "A2",
    villager: "hilde",
    title: { t: "Pläne & Einladungen", en: "Plans & invitations" },
    about: "Suggesting things, saying yes and no nicely, and the future.",
    items: String.raw`
der-plan | der Plan | plan | Hast du schon Pläne für heute? = Do you already have plans for today? | forms: Pläne
was-machst-du-am | Was machst du am Wochenende? | What are you doing at the weekend? | Was machst du am Samstag? = What are you doing on Saturday?
hast-du-lust | Hast du Lust …? | Do you feel like …? | Hast du Lust, ins Kino zu gehen? = Do you feel like going to the cinema? | say: Hast du Lust auf Kaffee? = Do you fancy a coffee? | accept: ^hast du lust\b
wollen-wir | Wollen wir …? | Shall we …? | Wollen wir zusammen wandern? = Shall we go hiking together? | construction | say: Wollen wir ins Café gehen? = Shall we go to the café? | accept: ^wollen wir\b
lass-uns | Lass uns … | Let's … | Lass uns zum See gehen! = Let's go to the lake! | construction | say: Lass uns Kuchen essen! = Let's eat cake! | accept: ^lass uns\b
gute-idee | Gute Idee! | Good idea! | Wandern? Gute Idee! = Hiking? Good idea!
ja-gerne | Ja, gerne! | Yes, I'd love to! | Ja, gerne! Wann? = Yes, I'd love to! When?
ich-kann-leider-nicht | Ich kann leider nicht. | Unfortunately I can't. | Ich kann leider nicht, ich muss arbeiten. = Unfortunately I can't, I have to work.
schade | Schade! | What a pity! | Du kannst nicht? Schade! = You can't? What a pity!
ein-andermal | Vielleicht ein andermal. | Maybe another time. | Heute nicht, vielleicht ein andermal. = Not today, maybe another time.
die-einladung | die Einladung | invitation | Danke für die Einladung! = Thanks for the invitation!
einladen | einladen | to invite | Ich lade dich zum Essen ein. = I'm inviting you for dinner.
das-fest | das Fest | festival / party | Am Samstag ist ein Fest im Dorf. = On Saturday there's a festival in the village.
feiern | feiern | to celebrate | Wir feiern meinen Geburtstag. = We're celebrating my birthday.
besuchen | besuchen | to visit | Ich besuche meine Oma. = I'm visiting my grandma.
vorhaben | vorhaben | to plan / have in mind | Was hast du heute vor? = What are you up to today?
werden-future | Ich werde … | I will … | Ich werde morgen wandern. = I'll go hiking tomorrow. / Es wird regnen. = It's going to rain. | construction | say: Ich werde nach Wien fahren. = I will go to Vienna. | accept: ^ich werde .+ \p{L}+en$
morgen-abend | morgen Abend | tomorrow evening | Morgen Abend gehen wir tanzen. = Tomorrow evening we're going dancing.
heute-abend | heute Abend | this evening / tonight | Was machst du heute Abend? = What are you doing tonight?
am-wochenende | am Wochenende | at the weekend | Am Wochenende habe ich Zeit. = I have time at the weekend.
der-treffpunkt | der Treffpunkt | meeting point | Der Treffpunkt ist der Brunnen. = The meeting point is the fountain.
abholen | abholen | to pick up | Ich hole dich um sieben ab. = I'll pick you up at seven.
mitbringen | mitbringen | to bring along | Soll ich etwas mitbringen? = Shall I bring something?
vorschlagen | vorschlagen | to suggest | Was schlägst du vor? = What do you suggest?
einverstanden | einverstanden | agreed | Um acht? – Einverstanden! = At eight? – Agreed!
klar | Klar! | Sure! | Kommst du mit? – Klar! = Are you coming along? – Sure!
wenn | wenn | if / when | Wenn es regnet, bleiben wir zu Hause. = If it rains, we'll stay at home.
ob | ob | whether / if | Ich weiß nicht, ob ich Zeit habe. = I don't know if I have time.
hoffentlich | hoffentlich | hopefully | Hoffentlich scheint die Sonne! = Hopefully the sun will shine!
sicher | sicher | sure / certainly | Bist du sicher? = Are you sure?
wahrscheinlich | wahrscheinlich | probably | Ich komme wahrscheinlich später. = I'll probably come later.
freuen-auf | Ich freue mich auf … | I'm looking forward to … | Ich freue mich auf das Wochenende! = I'm looking forward to the weekend! | say: Ich freue mich auf die Party! = I'm looking forward to the party! | accept: ^ich freue mich (schon )?auf\b
der-traum | der Traum | dream | Mein Traum ist eine Reise nach Japan. = My dream is a trip to Japan.
nachher | nachher | later / afterwards | Bis nachher! = See you later!
`,
  },
  {
    id: "gefuehle",
    level: "A2",
    villager: "aylin",
    title: { t: "Gefühle", en: "Feelings" },
    about: "How you feel, why, and caring about how others feel.",
    items: String.raw`
das-gefuehl | das Gefühl | feeling | Ich habe ein gutes Gefühl. = I have a good feeling. | forms: Gefühle
gluecklich | glücklich | happy | Ich bin heute sehr glücklich. = I'm very happy today.
froh | froh | glad | Ich bin froh, dass du hier bist. = I'm glad you're here.
traurig | traurig | sad | Warum bist du traurig? = Why are you sad?
wuetend | wütend | angry | Mein Vater ist wütend. = My father is angry.
sauer | sauer | annoyed / sour | Bist du sauer auf mich? = Are you annoyed with me?
nervoes | nervös | nervous | Vor der Prüfung bin ich nervös. = I'm nervous before the exam.
aufgeregt | aufgeregt | excited | Die Kinder sind aufgeregt. = The children are excited.
entspannt | entspannt | relaxed | Im Urlaub bin ich entspannt. = I'm relaxed on holiday.
gestresst | gestresst | stressed | Ich bin total gestresst. = I'm totally stressed.
einsam | einsam | lonely | Manchmal bin ich einsam. = Sometimes I'm lonely.
zufrieden | zufrieden | content / satisfied | Bist du zufrieden? = Are you satisfied?
ueberrascht | überrascht | surprised | Ich bin überrascht! = I'm surprised!
die-angst | die Angst | fear | Ich habe Angst vor Hunden. = I'm afraid of dogs.
angst-haben | Ich habe Angst. | I'm afraid. | Ich habe Angst im Dunkeln. = I'm afraid of the dark.
die-freude | die Freude | joy | Das macht mir Freude. = That gives me joy.
die-liebe | die Liebe | love | Liebe ist wichtig. = Love is important.
lachen | lachen | to laugh | Wir lachen viel. = We laugh a lot.
weinen | weinen | to cry | Das Baby weint. = The baby is crying.
laecheln | lächeln | to smile | Sie lächelt immer. = She always smiles.
sich-freuen | sich freuen | to be happy / pleased | Ich freue mich! = I'm so pleased!
sich-aergern | sich ärgern | to be annoyed | Ich ärgere mich über den Regen. = I'm annoyed about the rain.
mir-ist-langweilig | Mir ist langweilig. | I'm bored. | Mir ist so langweilig! = I'm so bored!
warum | warum | why | Warum lachst du? = Why are you laughing?
weil | weil | because | Ich bin froh, weil die Sonne scheint. = I'm glad because the sun is shining. | construction | note: After "weil", the verb goes to the end of the sentence.
deshalb | deshalb | that's why | Es regnet, deshalb bleibe ich zu Hause. = It's raining, that's why I'm staying home.
was-ist-los | Was ist los? | What's wrong? | Was ist los? Du siehst traurig aus. = What's wrong? You look sad.
alles-okay | Alles okay? | Everything okay? | Alles okay bei dir? = Everything okay with you?
keine-sorge | Keine Sorge! | Don't worry! | Keine Sorge, das wird schon! = Don't worry, it'll be fine!
das-tut-mir-leid | Das tut mir leid. | I'm sorry to hear that. | Du bist krank? Das tut mir leid. = You're ill? I'm sorry to hear that.
wie-schoen | Wie schön! | How lovely! | Du hast ein Baby? Wie schön! = You have a baby? How lovely!
schrecklich | schrecklich | terrible | Das Wetter ist schrecklich. = The weather is terrible.
peinlich | peinlich | embarrassing | Das ist mir peinlich. = That's embarrassing for me.
verliebt | verliebt | in love | Sie ist verliebt. = She's in love.
vermissen | vermissen | to miss (someone) | Ich vermisse dich. = I miss you.
hoffen | hoffen | to hope | Ich hoffe, es geht dir gut. = I hope you're well.
glauben | glauben | to believe / to think | Ich glaube dir. = I believe you.
die-laune | die Laune | mood | Du hast gute Laune! = You're in a good mood!
`,
  },
  {
    id: "meinung",
    level: "A2",
    villager: "paul",
    title: { t: "Meinungen", en: "Opinions" },
    about: "Saying what you think, agreeing and disagreeing, and comparing.",
    items: String.raw`
die-meinung | die Meinung | opinion | Was ist deine Meinung? = What's your opinion?
ich-finde | Ich finde … | I think … / I find … | Ich finde das Buch spannend. = I find the book exciting. / Wie findest du das? = What do you think of that? | construction | say: Ich finde den Film gut. = I think the film is good. | accept: ^ich finde\b
ich-denke | Ich denke, … | I think … | Ich denke, das ist richtig. = I think that's right. | construction | say: Ich denke, das ist gut. = I think that's good. | accept: ^ich denke\b
meiner-meinung-nach | meiner Meinung nach | in my opinion | Meiner Meinung nach ist das falsch. = In my opinion that's wrong.
ich-stimme-zu | Ich stimme zu. | I agree. | Da stimme ich dir zu. = I agree with you there.
das-stimmt | Das stimmt. | That's true. | Ja, das stimmt! = Yes, that's true!
das-stimmt-nicht | Das stimmt nicht. | That's not true. | Nein, das stimmt nicht! = No, that's not true!
ich-glaube-nicht | Ich glaube nicht. | I don't think so. | Kommt Sepp? – Ich glaube nicht. = Is Sepp coming? – I don't think so.
dass | dass | that | Ich finde, dass Deutsch schön ist. = I think that German is beautiful. | construction | note: After "dass", the verb goes to the end.
besser | besser | better | Tee ist besser als Kaffee. = Tea is better than coffee.
am-besten | am besten | best | Die Brezeln von Franz sind am besten. = Franz's pretzels are the best.
vergleich-als | … als … | … than … | Der Berg ist höher als die Kirche. = The mountain is higher than the church. | construction | say: Hilde ist älter als Greta. = Hilde is older than Greta. | accept: \p{L}+er als\b
so-wie | so … wie … | as … as … | Jonas ist so groß wie Paul. = Jonas is as tall as Paul. | construction | say: Tee ist so gut wie Kaffee. = Tea is as good as coffee. | accept: \bso \p{L}+ wie\b
mehr-als | mehr als | more than | Ich lese mehr als du. = I read more than you.
groesser | größer | bigger / taller | Mein Bruder ist größer als ich. = My brother is taller than me.
kleiner | kleiner | smaller | Das Dorf ist kleiner als die Stadt. = The village is smaller than the city.
aelter | älter | older | Wer ist älter? = Who is older?
juenger | jünger | younger | Meine Schwester ist jünger als ich. = My sister is younger than me.
schneller | schneller | faster | Der Zug ist schneller als der Bus. = The train is faster than the bus.
recht-haben | Du hast recht. | You're right. | Da hast du recht! = You're right there!
wirklich | wirklich | really | Ist das wirklich wahr? = Is that really true?
wahr | wahr | true | Das ist nicht wahr! = That's not true!
natuerlich | natürlich | of course | Natürlich helfe ich dir! = Of course I'll help you!
eigentlich | eigentlich | actually | Eigentlich habe ich keine Lust. = Actually I don't feel like it.
ziemlich | ziemlich | quite / rather | Das ist ziemlich teuer. = That's quite expensive.
zu | zu | too | Das ist zu schwer für mich. = That's too difficult for me.
gar-nicht | gar nicht | not at all | Das finde ich gar nicht gut. = I don't like that at all.
total | total | totally | Das ist total lustig! = That's totally funny!
der-vorteil | der Vorteil | advantage | Das hat viele Vorteile. = That has many advantages. | forms: Vorteile
der-nachteil | der Nachteil | disadvantage | Ein Nachteil ist der Preis. = One disadvantage is the price.
einerseits | einerseits … andererseits | on the one hand … on the other | Einerseits ist es teuer, andererseits ist es schön. = On the one hand it's expensive, on the other it's beautiful.
zum-beispiel | zum Beispiel | for example | Ich mag Obst, zum Beispiel Äpfel. = I like fruit, for example apples.
die-idee | die Idee | idea | Das ist eine gute Idee. = That's a good idea.
diskutieren | diskutieren | to discuss | Wir diskutieren über Politik. = We're discussing politics.
erklaeren | erklären | to explain | Kannst du das erklären? = Can you explain that?
der-grund | der Grund | reason | Was ist der Grund? = What's the reason?
trotzdem | trotzdem | nevertheless | Es regnet, trotzdem gehen wir spazieren. = It's raining, but we're going for a walk anyway.
oder | oder | or | Kaffee oder Tee? = Coffee or tea?
sondern | sondern | but (rather) | Nicht heute, sondern morgen. = Not today, but tomorrow.
denn | denn | because | Ich bleibe zu Hause, denn ich bin krank. = I'm staying at home, because I'm ill.
`,
  },
];
