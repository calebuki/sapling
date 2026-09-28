import type { UnitSource } from "../dsl";

// Swedish A2, after Astrid's "Planer": weather, free time, health and work,
// telling what happened, nature, meeting up, travel, feelings, the future and
// opinions.
// Format: slug | target | English | example = English / … | options (see ../dsl).

export const a2: UnitSource[] = [
  {
    id: "vaedret",
    level: "A2",
    villager: "nils",
    title: { t: "Vädret", en: "The weather" },
    about: "Sun, rain and wind, the seasons, and dressing for them.",
    items: String.raw`
hur-aer-vaedret | Hur är vädret? | What's the weather like? | Hur är vädret idag? = What's the weather like today?
vaedret | vädret | the weather | Vädret är fint idag. = The weather is nice today. | forms: väder
det-regnar | Det regnar. | It's raining. | Det regnar igen! = It's raining again!
solen-skiner | Solen skiner. | The sun is shining. | Solen skiner idag! = The sun is shining today!
det-blaaser | Det blåser. | It's windy. | Det blåser mycket på havet. = It's very windy on the sea.
det-snoear | Det snöar. | It's snowing. | Titta, det snöar! = Look, it's snowing!
det-aer-kallt | Det är kallt. | It's cold. | Det är kallt ute. = It's cold outside.
det-aer-varmt | Det är varmt. | It's warm. | Det är varmt idag, ska vi bada? = It's warm today, shall we swim?
molnigt | molnigt | cloudy | Det är molnigt idag. = It's cloudy today.
dimma | dimma | fog | Det är dimma över havet. = There's fog over the sea. | forms: dimman
en-storm | en storm | a storm | En storm kommer ikväll. = A storm is coming tonight. | forms: stormen, stormar
aaska | åska | thunder | Jag hör åska! = I can hear thunder! | forms: åskan
grader | grader | degrees | Det är tjugo grader. = It's twenty degrees. | forms: grad
minus | minus | minus | Det är minus fem grader. = It's minus five.
ute | ute | outside | Det är fint ute. = It's nice outside.
inne | inne | inside | Vi stannar inne idag. = We're staying in today.
vaaren | våren | spring | På våren kommer fåglarna tillbaka. = In spring the birds come back. | forms: vår
sommaren | sommaren | summer | På sommaren badar vi varje dag. = In summer we swim every day. | forms: sommar
hoesten | hösten | autumn | På hösten plockar vi svamp. = In autumn we pick mushrooms. | forms: höst
vintern | vintern | winter | Vintern är lång och mörk. = Winter is long and dark. | forms: vinter
paa-sommaren | på sommaren | in summer | På sommaren är det ljust hela natten. = In summer it's light all night.
det-ska-bli | Det ska bli … | It's going to be … | Imorgon ska det bli sol. = Tomorrow it's going to be sunny. / Det ska bli regn ikväll. = It's going to rain tonight. | construction
ett-paraply | ett paraply | an umbrella | Ta med ett paraply! = Bring an umbrella! | forms: paraplyet
havet | havet | the sea | Havet är lugnt idag. = The sea is calm today. | forms: hav
vaagor | vågor | waves | Stora vågor idag! = Big waves today! | forms: våg, vågorna
det-aer-halt | Det är halt. | It's slippery. | Försiktigt, det är halt! = Careful, it's slippery!
jag-fryser | Jag fryser. | I'm cold. | Brr, jag fryser! = Brr, I'm cold! | note: Swedes say "I freeze" to mean they feel cold.
det-aer-foer-varmt | Det är för varmt. | It's too hot. | Puh, det är för varmt! = Phew, it's too hot!
vilket-fint-vaeder | Vilket fint väder! | What lovely weather! | Hej! Vilket fint väder! = Hi! What lovely weather!
vilket-hemskt-vaeder | Vilket hemskt väder! | What awful weather! | Usch, vilket hemskt väder! = Ugh, what awful weather!
inget-daaligt-vaeder | Det finns inget dåligt väder, bara dåliga kläder. | There's no bad weather, only bad clothes. | Det finns inget dåligt väder, bara dåliga kläder! = There's no bad weather, only bad clothes! | note: A saying every Swede grows up with.
`,
  },
  {
    id: "fritid",
    level: "A2",
    villager: "leo",
    title: { t: "Fritid", en: "Free time" },
    about: "Hobbies, sports and music, what you like doing and how often.",
    items: String.raw`
vad-goer-du-paa-fritiden | Vad gör du på fritiden? | What do you do in your free time? | Vad gör du på fritiden, Leo? = What do you do in your free time, Leo?
jag-gillar-att | Jag gillar att … | I like … (doing) | Jag gillar att läsa. = I like reading. / Jag gillar att simma. = I like swimming. | construction
jag-tycker-om | Jag tycker om … | I like … | Jag tycker om musik. = I like music. / Jag tycker om att fiska. = I like fishing. | construction
laesa | läsa | read | Leo läser en bok. = Leo is reading a book. | forms: läser, läste, läst
simma | simma | swim | Kan du simma? = Can you swim? | forms: simmar, simmade
bada | bada | go swimming | Vi badar i havet. = We swim in the sea. | forms: badar, badade | note: Bada is going for a swim (or a bath); simma is the swimming itself.
spela | spela | play | Jag spelar fotboll. = I play football. / Spelar du gitarr? = Do you play the guitar? | forms: spelar, spelade
fotboll | fotboll | football | Vi spelar fotboll på stranden. = We play football on the beach. | forms: fotbollen
gitarr | gitarr | guitar | Leo spelar gitarr. = Leo plays the guitar. | forms: gitarren
dansa | dansa | dance | Vi dansar på midsommar. = We dance at midsummer. | forms: dansar, dansade
sjunga | sjunga | sing | Jag sjunger i en kör. = I sing in a choir. | forms: sjunger, sjöng
titta-paa-film | titta på film | watch a film | Ska vi titta på film ikväll? = Shall we watch a film tonight?
lyssna-paa-musik | lyssna på musik | listen to music | Jag lyssnar på musik varje dag. = I listen to music every day.
promenera | promenera | go for a walk | Vi promenerar till fyren. = We're walking to the lighthouse. | forms: promenerar
cykla | cykla | cycle | Jag cyklar till skolan. = I cycle to school. | forms: cyklar, cyklade
fiska | fiska | fish | Nils fiskar varje morgon. = Nils fishes every morning. | forms: fiskade
maala | måla | paint | Jag målar gärna. = I like painting. | forms: målar, målade
traena | träna | work out / train | Jag tränar tre gånger i veckan. = I work out three times a week. | forms: tränar
ofta | ofta | often | Jag läser ofta. = I read often.
ibland | ibland | sometimes | Ibland fiskar jag med Nils. = Sometimes I fish with Nils.
aldrig | aldrig | never | Jag dansar aldrig! = I never dance!
varje-dag | varje dag | every day | Jag simmar varje dag. = I swim every day.
paa-helgerna | på helgerna | at weekends | På helgerna spelar vi fotboll. = At weekends we play football.
det-aer-roligt | Det är roligt! | It's fun! | Det är roligt att dansa! = Dancing is fun!
traakigt | tråkigt | boring | Det är tråkigt att städa. = Cleaning is boring.
jag-aer-bra-paa | Jag är bra på … | I'm good at … | Jag är bra på att simma. = I'm good at swimming. / Jag är inte bra på fotboll. = I'm not good at football. | construction
spelar-du | Spelar du …? | Do you play …? | Spelar du fotboll? = Do you play football? | construction
en-bok | en bok | a book | Boken är spännande. = The book is exciting. | forms: boken, böcker, böckerna
en-film | en film | a film | En rolig film. = A funny film. | forms: filmen, filmer
ett-spel | ett spel | a game | Ska vi spela ett spel? = Shall we play a game? | forms: spelet
paa-bio | på bio | at the cinema | Ska vi gå på bio? = Shall we go to the cinema?
ett-intresse | ett intresse | an interest | Musik är mitt största intresse. = Music is my biggest interest. | forms: intresset, intressen
`,
  },
  {
    id: "haelsa",
    level: "A2",
    villager: "karin",
    title: { t: "Hälsa", en: "Health" },
    about: "Feeling ill, what hurts, the body, and seeing the doctor.",
    items: String.raw`
jag-maar-inte-bra | Jag mår inte bra. | I don't feel well. | Förlåt, jag mår inte bra idag. = Sorry, I don't feel well today.
jag-aer-sjuk | Jag är sjuk. | I'm ill. | Jag är sjuk, jag stannar hemma. = I'm ill, I'm staying home.
jag-har-ont-i | Jag har ont i … | My … hurts. | Jag har ont i huvudet. = I have a headache. / Jag har ont i magen. = I have a stomach ache. | construction | accept: ^jag har ont i \p{L}+
det-goer-ont | Det gör ont. | It hurts. | Aj, det gör ont! = Ouch, it hurts!
aj | Aj! | Ouch! | Aj, min fot! = Ouch, my foot!
huvudet | huvudet | the head | Jag har ont i huvudet. = I have a headache. | forms: huvud
magen | magen | the stomach | Jag har ont i magen. = My stomach hurts. | forms: mage
halsen | halsen | the throat / neck | Jag har ont i halsen. = I have a sore throat. | forms: hals
ryggen | ryggen | the back | Min rygg gör ont. = My back hurts. | forms: rygg
armen | armen | the arm | Jag har ont i armen. = My arm hurts. | forms: arm, armar
benet | benet | the leg | Benet gör ont. = My leg hurts. | forms: ben
foten | foten | the foot | Jag har ont i foten. = My foot hurts. | forms: fot, fötter
handen | handen | the hand | Tvätta händerna! = Wash your hands! | forms: hand, händer, händerna
oegat | ögat | the eye | Något i ögat. = Something in my eye. | forms: öga, ögon, ögonen
oerat | örat | the ear | Jag har ont i örat. = I have an earache. | forms: öra, öron, öronen
tanden | tanden | the tooth | Jag har ont i en tand. = I have a toothache. | forms: tand, tänder
feber | feber | a fever | Jag har feber. = I have a fever. | forms: febern
foerkyld | förkyld | have a cold | Jag är förkyld. = I have a cold.
hosta | hosta | cough | Jag hostar mycket. = I'm coughing a lot. | forms: hostar
trott | trött | tired | Jag är så trött. = I'm so tired. | forms: trötta
en-laekare | en läkare | a doctor | Jag behöver en läkare. = I need a doctor. | forms: läkaren
vaardcentralen | vårdcentralen | the health centre | Karin jobbar på vårdcentralen. = Karin works at the health centre. | forms: vårdcentral
apoteket | apoteket | the chemist's | Du kan köpa det på apoteket. = You can buy it at the chemist's. | forms: apotek
medicin | medicin | medicine | Ta din medicin! = Take your medicine! | forms: medicinen
boka-en-tid | Jag vill boka en tid. | I'd like to book an appointment. | Hej, jag vill boka en tid. = Hi, I'd like to book an appointment.
jag-maaste | Jag måste … | I have to … | Jag måste gå till läkaren. = I have to go to the doctor. / Jag måste vila. = I have to rest. | construction
du-borde | Du borde … | You should … | Du borde vila. = You should rest. / Du borde dricka mycket vatten. = You should drink lots of water. | construction
vila | vila | rest | Du måste vila idag. = You need to rest today. | forms: vilar
hur-laenge | Hur länge? | How long? | Hur länge har du haft feber? = How long have you had a fever?
sedan-igaar | sedan igår | since yesterday | Jag har haft ont sedan igår. = It's been hurting since yesterday.
det-blir-baettre | Det blir bättre. | It's getting better. | Tack, det blir bättre nu. = Thanks, it's getting better now.
krya-paa-dig | Krya på dig! | Get well soon! | Stackars dig! Krya på dig! = Poor you! Get well soon!
hjaelp | Hjälp! | Help! | Hjälp! Ring en läkare! = Help! Call a doctor!
ring-112 | Ring 112! | Call 112! | Ring 112, snabbt! = Call 112, quick! | note: 112 is the emergency number in Sweden, as all over Europe.
`,
  },
  {
    id: "jobb",
    level: "A2",
    villager: "karin",
    title: { t: "Jobbet", en: "Work" },
    about: "Jobs and workplaces, hours, colleagues and time off.",
    items: String.raw`
vad-jobbar-du-med | Vad jobbar du med? | What do you do (for work)? | Vad jobbar du med, Karin? = What do you do, Karin?
jag-jobbar-som | Jag jobbar som … | I work as … | Jag jobbar som lärare. = I work as a teacher. / Jag jobbar som sjuksköterska. = I work as a nurse. | construction | accept: ^jag jobbar (som|på|med) \p{L}+
jag-jobbar-paa | Jag jobbar på … | I work at … | Jag jobbar på ett kafé. = I work at a café. / Jag jobbar på en skola. = I work at a school. | construction
ett-jobb | ett jobb | a job | Jag har ett nytt jobb! = I have a new job! | forms: jobbet
en-laerare | en lärare | a teacher | Min mamma är lärare. = My mum is a teacher. | forms: läraren, lärarna
en-sjukskoeterska | en sjuksköterska | a nurse | Karin är sjuksköterska. = Karin is a nurse. | forms: sjuksköterskan
en-fiskare | en fiskare | a fisherman | Nils är fiskare. = Nils is a fisherman. | forms: fiskaren
en-kock | en kock | a cook / chef | Bosse är en bra kock. = Bosse is a good cook. | forms: kocken
en-bonde | en bonde | a farmer | Min farfar var bonde. = My grandpa was a farmer. | forms: bonden, bönder
en-student | en student | a student | Jag är student. = I'm a student. | forms: studenten, studenter
pensionaer | pensionär | retired | Olle är pensionär. = Olle is retired. | forms: pensionären
arbetsloes | arbetslös | out of work | Jag är arbetslös just nu. = I'm out of work right now.
ett-kontor | ett kontor | an office | Jag jobbar på ett kontor. = I work in an office. | forms: kontoret
en-kollega | en kollega | a colleague | Min kollega heter Sara. = My colleague's name is Sara. | forms: kollegan, kollegor
en-chef | en chef | a boss | Min chef är snäll. = My boss is nice. | forms: chefen
en-skola | en skola | a school | Leo går i skolan. = Leo goes to school. | forms: skolan, skolor
jag-boerjar | Jag börjar … | I start … | Jag börjar klockan åtta. = I start at eight. | construction
jag-slutar | Jag slutar … | I finish … | Jag slutar klockan fem. = I finish at five. | construction
heltid | heltid | full time | Jag jobbar heltid. = I work full time.
deltid | deltid | part time | Jag jobbar deltid på kaféet. = I work part time at the café.
jag-jobbar-hemifraan | Jag jobbar hemifrån. | I work from home. | Idag jobbar jag hemifrån. = Today I'm working from home.
ledig | ledig | off (work) / free | Jag är ledig idag! = I'm off today! | forms: ledigt, lediga
semester | semester | holiday (from work) | Jag har semester i juli. = I'm on holiday in July. | forms: semestern | note: Most Swedes take four or five weeks off in summer.
stressigt | stressigt | stressful | Det är stressigt på jobbet. = It's stressful at work.
plugga | plugga | study | Jag pluggar svenska. = I'm studying Swedish. | forms: pluggar, pluggade
jag-laer-mig-att | Jag lär mig att … | I'm learning to … | Jag lär mig att köra båt. = I'm learning to drive a boat. | construction
en-lon | en lön | a salary | En bra lön. = A good salary. | forms: lönen
mitt-jobb-aer | Mitt jobb är … | My job is … | Mitt jobb är roligt. = My job is fun. / Mitt jobb är ganska stressigt. = My job is quite stressful. | construction
vi-fikar | Vi fikar. | We're having a coffee break. | Klockan tre fikar vi på jobbet. = At three we have a coffee break at work. | note: Fika at work is almost a rule in Sweden.
`,
  },
  {
    id: "igaar",
    level: "A2",
    villager: "olle",
    title: { t: "Igår", en: "Yesterday" },
    about: "Saying what happened: was, had, did, saw, went, and how long ago.",
    items: String.raw`
vad-gjorde-du-igaar | Vad gjorde du igår? | What did you do yesterday? | Hej Olle! Vad gjorde du igår? = Hi Olle! What did you do yesterday?
jag-var | Jag var … | I was … | Jag var hemma igår. = I was at home yesterday. / Jag var så trött. = I was so tired. | construction
det-var | Det var … | It was … | Det var kul! = It was fun! / Det var kallt igår. = It was cold yesterday. | construction
jag-hade | Jag hade … | I had … | Jag hade en hund när jag var liten. = I had a dog when I was little. | construction
jag-gjorde | Jag gjorde … | I did / made … | Jag gjorde en kaka. = I made a cake. | construction
jag-aat | Jag åt … | I ate … | Jag åt fisk igår. = I ate fish yesterday. | construction
jag-drack | Jag drack … | I drank … | Jag drack te hos Astrid. = I had tea at Astrid's. | construction
jag-saag | Jag såg … | I saw … | Jag såg en säl! = I saw a seal! | construction
jag-traeffade | Jag träffade … | I met … | Jag träffade Elin på bryggan. = I met Elin on the dock. | construction
jag-pratade-med | Jag pratade med … | I talked to … | Jag pratade med Bosse. = I talked to Bosse. | construction
jag-sov | Jag sov … | I slept … | Jag sov länge idag. = I slept in today. | construction
jag-kom | Jag kom … | I came … | Jag kom till Lilla Ö i måndags. = I came to Lilla Ö last Monday. | construction
jag-aakte | Jag åkte … | I went (travelled) … | Jag åkte till Stockholm. = I went to Stockholm. | construction
jag-bodde | Jag bodde … | I lived … | Jag bodde i London förut. = I used to live in London. | construction
vad-haende | Vad hände? | What happened? | Vad hände sedan? = What happened next?
och-sen | Och sen? | And then? | Och sen? Vad gjorde du? = And then? What did you do?
foerra-veckan | förra veckan | last week | Förra veckan var jag i Göteborg. = Last week I was in Gothenburg.
foerra-aaret | förra året | last year | Förra året var sommaren varm. = Last year the summer was warm.
i-maandags | i måndags | last Monday | I måndags regnade det. = Last Monday it rained. | note: I måndags is last Monday; på måndag is next Monday.
foer-sedan | för … sedan | … ago | för tio år sedan = ten years ago / för en vecka sedan = a week ago
naer-jag-var-liten | när jag var liten | when I was little | När jag var liten bodde jag här. = When I was little I lived here.
foerut | förut | before / used to | Förut var fyren röd. = The lighthouse used to be red.
en-gaang | en gång | once | Det var en gång en fiskare … = Once upon a time there was a fisherman …
har-du-varit-i | Har du varit i …? | Have you been to …? | Har du varit i Stockholm? = Have you been to Stockholm? | construction
jag-har-aldrig | Jag har aldrig … | I've never … | Jag har aldrig sett en säl. = I've never seen a seal. | construction
jag-har-redan | Jag har redan … | I've already … | Jag har redan ätit. = I've already eaten. | construction
en-saal | en säl | a seal | Sälen ligger på stenen. = The seal is lying on the rock. | forms: sälen, sälar
`,
  },
  {
    id: "naturen",
    level: "A2",
    villager: "astrid",
    title: { t: "Naturen", en: "Nature" },
    about: "Forest, sea and garden, animals and plants, and the right to roam.",
    items: String.raw`
naturen | naturen | nature | Jag älskar naturen. = I love nature. | forms: natur
en-skog | en skog | a forest | Vi går i skogen. = We're walking in the forest. | forms: skogen, skogar
ett-traed | ett träd | a tree | Ett stort träd. = A big tree. | forms: trädet, träden
en-blomma | en blomma | a flower | Vilken fin blomma! = What a pretty flower! | forms: blomman, blommor, blommorna
en-sjoe | en sjö | a lake | Vi badar i sjön. = We swim in the lake. | forms: sjön, sjöar
ett-berg | ett berg | a hill / mountain | Fyren står på berget. = The lighthouse stands on the hill. | forms: berget
en-oe | en ö | an island | Sverige har många öar. = Sweden has lots of islands. | forms: ön, öar
en-faagel | en fågel | a bird | Hör du fågeln? = Can you hear the bird? | forms: fågeln, fåglar, fåglarna
en-maas | en mås | a seagull | Måsen tar din macka! = The seagull is taking your sandwich! | forms: måsen, måsar
en-aelg | en älg | an elk | Titta, en älg! = Look, an elk! | forms: älgen, älgar
en-raev | en räv | a fox | En räv i trädgården! = A fox in the garden! | forms: räven, rävar
en-igelkott | en igelkott | a hedgehog | Igelkotten sover under busken. = The hedgehog sleeps under the bush. | forms: igelkotten
svamp | svamp | mushrooms | Vi plockar svamp i skogen. = We pick mushrooms in the forest. | forms: svampen, svampar
blaabaer | blåbär | blueberries | Blåbär i skogen! = Blueberries in the forest! | forms: blåbären
plocka | plocka | pick | Ska vi plocka blåbär? = Shall we pick blueberries? | forms: plockar, plockade
allemansraetten | allemansrätten | the right to roam | Tack vare allemansrätten får alla gå i skogen. = Thanks to the right to roam, everyone may walk in the forest. | note: In Sweden anyone may walk, camp and pick berries in nature, as long as they take care of it.
vacker | vacker | beautiful | Vilken vacker utsikt! = What a beautiful view! | forms: vackert, vackra
en-utsikt | en utsikt | a view | Utsikten från fyren är fantastisk. = The view from the lighthouse is fantastic. | forms: utsikten
en-stig | en stig | a path | Följ stigen till fyren. = Follow the path to the lighthouse. | forms: stigen
vandra | vandra | hike | Vi vandrar i skogen. = We're hiking in the forest. | forms: vandrar
taelta | tälta | camp (in a tent) | Får man tälta här? = Is camping allowed here? | forms: tältar
graes | gräs | grass | Sitt i gräset. = Sit on the grass. | forms: gräset
en-sten | en sten | a stone / rock | En stor sten vid vattnet. = A big rock by the water. | forms: stenen, stenar
solen | solen | the sun | Solen går ner. = The sun is going down. | forms: sol
maanen | månen | the moon | Titta på månen! = Look at the moon! | forms: måne
stjaernor | stjärnor | stars | Så många stjärnor! = So many stars! | forms: stjärna, stjärnorna
titta | Titta! | Look! | Titta, en älg! = Look, an elk!
lyssna | Lyssna! | Listen! | Lyssna, en fågel! = Listen, a bird!
vaexer | växer | grows | Tomaterna växer. = The tomatoes are growing. | forms: växa
vattna | vattna | water (plants) | Kan du vattna blommorna? = Can you water the flowers? | forms: vattnar
`,
  },
  {
    id: "traeffas",
    level: "A2",
    villager: "leo",
    title: { t: "Ses vi?", en: "Meeting up" },
    about: "Inviting people, saying yes or no nicely, and agreeing when and where.",
    items: String.raw`
vill-du | Vill du …? | Do you want to …? | Vill du fika? = Do you want to get a coffee? / Vill du följa med? = Do you want to come along? | construction
foelja-med | följa med | come along | Vill du följa med till stranden? = Do you want to come to the beach? | forms: följer, följde
har-du-tid | Har du tid? | Do you have time? | Har du tid imorgon? = Do you have time tomorrow?
ska-vi-ses | Ska vi ses …? | Shall we meet …? | Ska vi ses imorgon? = Shall we meet tomorrow? | construction
naer-ses-vi | När ses vi? | When shall we meet? | Okej! När ses vi? = Okay! When shall we meet?
var-ses-vi | Var ses vi? | Where shall we meet? | Var ses vi? – Vid bryggan! = Where shall we meet? – At the dock!
vi-ses-vid | Vi ses vid …! | See you at …! | Vi ses vid bryggan! = See you at the dock! / Vi ses vid kaféet klockan tre! = See you at the café at three! | construction
passar-det | Passar det …? | Does … suit you? | Passar det på fredag? = Does Friday suit you? | construction
det-passar-bra | Det passar bra. | That suits me fine. | Klockan tre? Det passar bra. = Three o'clock? That suits me fine.
ja-gaerna | Ja, gärna! | Yes, I'd love to! | Vill du följa med? – Ja, gärna! = Do you want to come along? – Yes, I'd love to!
jag-kan-inte | Jag kan inte. | I can't. | Förlåt, jag kan inte idag. = Sorry, I can't today.
tyvaerr | tyvärr | unfortunately | Tyvärr kan jag inte. = Unfortunately I can't.
en-annan-gaang | Kanske en annan gång? | Maybe another time? | Jag kan inte idag. Kanske en annan gång? = I can't today. Maybe another time?
jag-aer-upptagen | Jag är upptagen. | I'm busy. | Förlåt, jag är upptagen ikväll. = Sorry, I'm busy tonight.
jag-hinner-inte | Jag hinner inte. | I won't have time. | Jag hinner inte idag. = I won't have time today. | note: Hinna means having time to do something, or making it in time.
jag-bjuder | Jag bjuder! | It's on me! | Kom, vi fikar. Jag bjuder! = Come on, let's have coffee. It's on me!
en-fest | en fest | a party | Jag har fest på lördag. = I'm having a party on Saturday. | forms: festen, fester
kom-paa | Kom på …! | Come to …! | Kom på min fest! = Come to my party! | construction
ett-kalas | ett kalas | a (birthday) party | Leo har kalas på söndag. = Leo is having a party on Sunday. | forms: kalaset
foedelsedag | födelsedag | birthday | Grattis på födelsedagen! = Happy birthday! | forms: födelsedagen
vad-ska-vi-goera | Vad ska vi göra? | What shall we do? | Vad ska vi göra ikväll? = What shall we do tonight?
vi-kan | Vi kan … | We can … | Vi kan gå till stranden. = We can go to the beach. / Vi kan titta på film. = We can watch a film. | construction
jag-ringer-dig | Jag ringer dig. | I'll call you. | Jag ringer dig ikväll! = I'll call you tonight!
jag-skickar-ett-sms | Jag skickar ett sms. | I'll send a text. | Jag skickar ett sms när jag är där. = I'll text you when I'm there.
jag-kommer | Jag kommer! | I'm coming! | Vänta, jag kommer! = Wait, I'm coming!
vaenta | Vänta! | Wait! | Vänta på mig! = Wait for me!
`,
  },
  {
    id: "resa",
    level: "A2",
    villager: "stina",
    title: { t: "På resa", en: "Travelling" },
    about: "Tickets, bookings, delays and changes, and getting around Sweden.",
    items: String.raw`
en-biljett | en biljett | a ticket | En biljett till Uppsala, tack. = A ticket to Uppsala, please. | forms: biljetten, biljetter
tur-och-retur | tur och retur | return | En biljett tur och retur till Göteborg. = A return ticket to Gothenburg.
en-enkel-biljett | en enkel biljett | a single ticket | En enkel biljett till Stockholm, tack. = A single to Stockholm, please.
jag-vill-boka | Jag vill boka … | I'd like to book … | Jag vill boka ett rum. = I'd like to book a room. / Jag vill boka två biljetter. = I'd like to book two tickets. | construction
ett-hotell | ett hotell | a hotel | Hotellet ligger nära stationen. = The hotel is near the station. | forms: hotellet
har-ni-lediga-rum | Har ni lediga rum? | Do you have any free rooms? | Hej! Har ni lediga rum ikväll? = Hi! Do you have any free rooms tonight?
hur-laang-tid-tar-det | Hur lång tid tar det? | How long does it take? | Hur lång tid tar det till Stockholm? = How long does it take to Stockholm?
det-tar | Det tar … | It takes … | Det tar två timmar. = It takes two hours. | construction
avgaar | avgår | departs | Tåget avgår från spår två. = The train departs from platform two.
ett-spaar | ett spår | a platform (track) | Tåget går från spår tre. = The train leaves from platform three. | forms: spåret
foersenat | försenat | delayed | Tåget är försenat. = The train is delayed. | forms: försenad
installt | inställt | cancelled | Tåget är inställt idag. = The train is cancelled today. | forms: inställd
byta | byta | change | Du måste byta i Uppsala. = You have to change in Uppsala. | forms: byter, bytte
en-plats | en plats | a seat / place | Är den här platsen ledig? = Is this seat free? | forms: platsen
aer-platsen-ledig | Är den här platsen ledig? | Is this seat free? | Ursäkta, är den här platsen ledig? = Excuse me, is this seat free?
aaka | åka | go (by vehicle) | Jag åker buss. = I'm taking the bus. / Vi åker till Göteborg. = We're going to Gothenburg. | forms: åker | note: Gå is to walk. Going by bus, train, boat or car is åka.
med-taaget | med tåget | by train | Jag åker med tåget. = I'm going by train.
bussen | bussen | the bus | Bussen kommer om fem minuter. = The bus comes in five minutes. | forms: buss, bussar
flyget | flyget | the flight | Flyget går klockan sju. = The flight leaves at seven. | forms: flyg
flygplatsen | flygplatsen | the airport | Hur kommer jag till flygplatsen? = How do I get to the airport? | forms: flygplats
en-resvaeska | en resväska | a suitcase | Min resväska är tung. = My suitcase is heavy. | forms: resväskan
ett-pass | ett pass | a passport | Glöm inte passet! = Don't forget your passport! | forms: passet
utomlands | utomlands | abroad | Jag reser utomlands i sommar. = I'm travelling abroad this summer.
jag-ska-resa-till | Jag ska resa till … | I'm going to travel to … | Jag ska resa till Norge. = I'm going to travel to Norway. | construction
trevlig-resa | Trevlig resa! | Have a good trip! | Hej då och trevlig resa! = Bye and have a good trip!
vaelkommen-tillbaka | Välkommen tillbaka! | Welcome back! | Välkommen tillbaka till Lilla Ö! = Welcome back to Lilla Ö!
`,
  },
  {
    id: "kaenslor",
    level: "A2",
    villager: "olle",
    title: { t: "Känslor", en: "Feelings" },
    about: "How you feel and why, missing and loving, and comforting someone.",
    items: String.raw`
hur-kaenner-du-dig | Hur känner du dig? | How do you feel? | Hur känner du dig idag? = How do you feel today?
jag-kaenner-mig | Jag känner mig … | I feel … | Jag känner mig glad. = I feel happy. / Jag känner mig lite ensam. = I feel a bit lonely. | construction
glad | glad | happy | Varför är du så glad? = Why are you so happy? | forms: glatt, glada
ledsen | ledsen | sad | Är du ledsen? = Are you sad? | forms: ledset, ledsna
arg | arg | angry | Bosse är arg på måsen. = Bosse is angry with the seagull. | forms: argt, arga
raedd | rädd | scared | Jag är rädd för åska. = I'm scared of thunder. | forms: rädda
nervoes | nervös | nervous | Jag är lite nervös. = I'm a bit nervous. | forms: nervöst, nervösa
ensam | ensam | lonely / alone | Olle bor ensam i fyren. = Olle lives alone in the lighthouse. | forms: ensamt, ensamma
lugn | lugn | calm | Havet är lugnt, och jag är lugn. = The sea is calm, and so am I. | forms: lugnt, lugna
stolt | stolt | proud | Jag är stolt över dig! = I'm proud of you! | forms: stolta
foervaanad | förvånad | surprised | Jag blev så förvånad! = I was so surprised!
kaer | kär | in love | Olle är kär! = Olle is in love! | forms: kära
varfoer | varför | why | Varför är du ledsen? = Why are you sad?
eftersom | eftersom | because | Jag är glad eftersom solen skiner. = I'm happy because the sun is shining.
foer-att | för att | because | Jag är trött för att jag sov dåligt. = I'm tired because I slept badly.
jag-saknar | Jag saknar … | I miss … | Jag saknar min familj. = I miss my family. | construction
jag-aelskar | Jag älskar … | I love … | Jag älskar havet. = I love the sea. / Jag älskar dig. = I love you. | construction
jag-hatar | Jag hatar … | I hate … | Jag hatar regn! = I hate rain! | construction
oroa-dig-inte | Oroa dig inte! | Don't worry! | Oroa dig inte, det blir bra! = Don't worry, it'll be fine!
vad-synd | Vad synd! | What a shame! | Du kan inte komma? Vad synd! = You can't come? What a shame!
vad-roligt | Vad roligt! | How lovely! | Du har ett nytt jobb? Vad roligt! = You have a new job? How lovely!
vad-har-haent | Vad har hänt? | What's happened? | Du ser ledsen ut. Vad har hänt? = You look sad. What's happened?
det-aer-okej | Det är okej. | It's okay. | Det är okej, ingen fara. = It's okay, no worries.
en-kram | en kram | a hug | Kom hit, en kram! = Come here, a hug! | forms: kramen, kramar
det-aer-skoent | Det är skönt. | That feels good. | Det är skönt att vara hemma. = It's nice to be home. | note: Skönt is anything that feels good: a warm bath, a day off, finally sitting down.
lagom | lagom | just right | Inte för mycket, inte för lite – lagom! = Not too much, not too little – just right! | note: Lagom means just the right amount. Swedes use it all the time.
haerligt | härligt | lovely | Vad härligt! = How lovely!
`,
  },
  {
    id: "framtid",
    level: "A2",
    villager: "astrid",
    title: { t: "Framtiden", en: "The future" },
    about: "Plans, hopes and dreams, and what will happen if.",
    items: String.raw`
jag-ska | Jag ska … | I'm going to … | Jag ska plantera tomater. = I'm going to plant tomatoes. / Jag ska resa i sommar. = I'm going to travel this summer. | construction
jag-kommer-att | Jag kommer att … | I will … | Jag kommer att sakna dig. = I will miss you. | construction | note: Kommer att is for what will happen; ska is for what you plan to do.
jag-taenker | Jag tänker … | I'm planning to … | Jag tänker flytta hit. = I'm planning to move here. | construction
jag-vill-bli | Jag vill bli … | I want to be … | Jag vill bli läkare. = I want to be a doctor. | construction
jag-hoppas | Jag hoppas … | I hope … | Jag hoppas att det blir sol. = I hope it'll be sunny. | construction
har-du-naagra-planer | Har du några planer? | Do you have any plans? | Har du några planer i sommar? = Do you have any plans this summer?
en-plan | en plan | a plan | Jag har en plan! = I have a plan! | forms: planen
i-sommar | i sommar | this summer | I sommar ska jag bada varje dag. = This summer I'm going to swim every day.
naesta-vecka | nästa vecka | next week | Nästa vecka åker jag till Stockholm. = Next week I'm going to Stockholm.
naesta-aar | nästa år | next year | Nästa år vill jag bo här. = Next year I want to live here.
om-ett-aar | om ett år | in a year | Om ett år pratar jag bra svenska! = In a year I'll speak good Swedish!
snart | snart | soon | Vi ses snart! = See you soon!
senare | senare | later | Vi pratar senare. = We'll talk later.
en-droem | en dröm | a dream | Min dröm är att bo vid havet. = My dream is to live by the sea. | forms: drömmen, drömmar
droemma | drömma | dream | Jag drömmer om en båt. = I dream of a boat. | forms: drömmer
flytta | flytta | move (house) | Jag vill flytta till Sverige. = I want to move to Sweden. | forms: flyttar
plantera | plantera | plant | Vi planterar potatis i maj. = We plant potatoes in May. | forms: planterar
bygga | bygga | build | Vi ska bygga ett hus. = We're going to build a house. | forms: bygger
om | om | if | Om det regnar stannar vi hemma. = If it rains, we'll stay home. | note: After an om-clause, the verb comes first: "stannar vi", not "vi stannar".
foerhoppningsvis | förhoppningsvis | hopefully | Förhoppningsvis blir det sol. = Hopefully it'll be sunny.
saekert | säkert | surely / probably | Det blir säkert bra! = It'll surely be fine!
det-blir-fint | Det blir fint! | It'll be lovely! | Imorgon? Det blir fint! = Tomorrow? It'll be lovely!
vi-faar-se | Vi får se. | We'll see. | Kanske. Vi får se! = Maybe. We'll see!
naer-jag-blir-stor | när jag blir stor | when I grow up | När jag blir stor vill jag bli fiskare. = When I grow up I want to be a fisherman.
`,
  },
  {
    id: "aasikter",
    level: "A2",
    villager: "olle",
    title: { t: "Vad tycker du?", en: "What do you think?" },
    about: "Opinions, agreeing and disagreeing, and comparing things.",
    items: String.raw`
vad-tycker-du | Vad tycker du? | What do you think? | Vad tycker du om kaffet? = What do you think of the coffee?
jag-tycker-att | Jag tycker att … | I think that … | Jag tycker att det är fint här. = I think it's nice here. / Jag tycker att svenska är roligt. = I think Swedish is fun. | construction
jag-tror | Jag tror … | I think (believe) … | Jag tror att det blir regn. = I think it's going to rain. | construction | note: Tycker is your opinion; tror is what you believe is true.
jag-haaller-med | Jag håller med. | I agree. | Ja, jag håller med! = Yes, I agree!
jag-haaller-inte-med | Jag håller inte med. | I don't agree. | Nej, jag håller inte med. = No, I don't agree.
det-staemmer | Det stämmer. | That's right. | Det stämmer, fyren är hundra år. = That's right, the lighthouse is a hundred years old.
det-beror-paa | Det beror på. | It depends. | Kaffe eller te? – Det beror på. = Coffee or tea? – It depends.
enligt-mig | enligt mig | in my opinion | Enligt mig är sommaren bäst. = In my opinion, summer is best.
baettre | bättre | better | Te är bättre än kaffe. = Tea is better than coffee.
baest | bäst | best | Bosses kanelbullar är bäst! = Bosse's cinnamon buns are the best!
saemre | sämre | worse | Vädret är sämre idag. = The weather is worse today.
aen | än | than | Fyren är högre än huset. = The lighthouse is taller than the house.
stoerre | större | bigger | Stockholm är större än Lilla Ö. = Stockholm is bigger than Lilla Ö.
mindre | mindre | smaller | Lilla Ö är mindre än Gotland. = Lilla Ö is smaller than Gotland.
mest | mest | most | Vad gillar du mest? = What do you like most?
viktig | viktig | important | Det är viktigt. = It's important. | forms: viktigt, viktiga
intressant | intressant | interesting | Vad intressant! = How interesting! | forms: intressanta
konstig | konstig | strange | Vilken konstig fisk! = What a strange fish! | forms: konstigt, konstiga
laett | lätt | easy | Det är lätt! = It's easy! | forms: lätta
svaar | svår | difficult | Svenska är lite svårt. = Swedish is a bit difficult. | forms: svårt, svåra
absolut | absolut | absolutely | Håller du med? – Absolut! = Do you agree? – Absolutely!
inte-alls | inte alls | not at all | Det är inte alls svårt. = It's not difficult at all.
ganska | ganska | quite | Det är ganska bra. = It's quite good.
jaettebra | jättebra | really good | Det var jättebra! = It was really good! | note: Jätte- (giant) makes almost any word stronger: jättebra, jättekul, jättestor.
daerfoer | därför | that's why | Det regnar, därför stannar jag hemma. = It's raining, that's why I'm staying home.
aa-ena-sidan | å ena sidan … å andra sidan | on the one hand … on the other | Å ena sidan är det kallt, å andra sidan är det vackert. = On the one hand it's cold, on the other it's beautiful.
`,
  },
];
