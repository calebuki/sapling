import type { UnitSource } from "../dsl";

// Swedish A1, around the island's first four chapters (./course): greetings
// and introductions, numbers, family and food, then time, shopping, home,
// directions and clothes.
// Format: slug | target | English | example = English / … | options (see ../dsl).

export const a1: UnitSource[] = [
  {
    id: "hejsan",
    level: "A1",
    villager: "elin",
    title: { t: "Hej då!", en: "Bye!" },
    about: "Hello and goodbye at any time of day, and the small polite words.",
    items: String.raw`
hejsan | Hejsan! | Hi there! | Hejsan, Elin! = Hi there, Elin! / Hejsan, hur är det? = Hi there, how's it going?
hej-daa | Hej då! | Bye! | Hej då, vi ses imorgon! = Bye, see you tomorrow! / Hej då, Bosse! = Bye, Bosse!
god-morgon | God morgon! | Good morning! | God morgon, Stina! = Good morning, Stina! / God morgon! Har du sovit gott? = Good morning! Did you sleep well?
god-dag | God dag! | Good day! (formal) | God dag och välkommen! = Good day and welcome!
god-kvaell | God kväll! | Good evening! | God kväll, Astrid! = Good evening, Astrid!
god-natt | God natt! | Good night! | God natt, sov gott! = Good night, sleep well!
tjena | Tjena! | Hey! (casual) | Tjena, Leo! = Hey, Leo! / Tjena! Läget? = Hey! What's up?
vi-ses | Vi ses! | See you! | Vi ses imorgon! = See you tomorrow! / Hej då, vi ses! = Bye, see you!
ha-det-bra | Ha det bra! | Take care! | Hej då, ha det bra! = Bye, take care!
hur-maar-du | Hur mår du? | How are you? | Hej Elin, hur mår du? = Hi Elin, how are you?
hur-aer-det | Hur är det? | How's it going? | Tjena! Hur är det? = Hey! How's it going?
bra-tack | Bra, tack! | Good, thanks! | Jag mår bra, tack! = I'm well, thanks! | accept: ^(jag mår )?(bra|jättebra|fint)( tack)?
och-du | Och du? | And you? | Bra, tack. Och du? = Good, thanks. And you?
tack-saa-mycket | Tack så mycket! | Thank you very much! | Tack så mycket för hjälpen! = Thanks a lot for the help!
varsaagod | Varsågod! | Here you go! / You're welcome! | Varsågod, här är ditt kaffe! = Here you go, here's your coffee!
ingen-orsak | Ingen orsak! | You're welcome! | Tack! – Ingen orsak! = Thanks! – You're welcome!
det-var-saa-lite | Det var så lite! | Don't mention it! | Tack för hjälpen! – Det var så lite! = Thanks for the help! – Don't mention it!
foerlaat | Förlåt! | Sorry! | Förlåt, jag är sen! = Sorry, I'm late! / Förlåt, det var inte meningen. = Sorry, I didn't mean to.
ursaekta | Ursäkta! | Excuse me! | Ursäkta, var är kaféet? = Excuse me, where is the café?
ingen-fara | Ingen fara! | No worries! | Förlåt! – Ingen fara! = Sorry! – No worries!
vaelkommen | Välkommen! | Welcome! | Välkommen till Lilla Ö! = Welcome to Lilla Ö!
gaerna | gärna | gladly / I'd love to | Ja, gärna! = Yes, I'd love to! / Kaffe? – Gärna! = Coffee? – Yes, please!
okej | okej | okay | Okej, vi ses sen! = Okay, see you later!
precis | precis | exactly | Ja, precis! = Yes, exactly!
sjaelvklart | självklart | of course | Självklart kan du komma! = Of course you can come!
visst | visst | sure | Visst, inga problem! = Sure, no problem!
kul | kul | fun / nice | Vad kul! = How fun! / Det var kul att ses! = It was nice to see you!
bra | bra | good / well | Det är bra! = That's good! / Bra jobbat! = Good job!
lycka-till | Lycka till! | Good luck! | Lycka till idag! = Good luck today!
grattis | Grattis! | Congratulations! | Grattis på födelsedagen! = Happy birthday!
`,
  },
  {
    id: "vem",
    level: "A1",
    villager: "elin",
    title: { t: "Vem är du?", en: "Who are you?" },
    about: "Where you're from, where you live, the languages you speak and the people around you.",
    items: String.raw`
jag-aer | Jag är … | I am … | Jag är Elin. = I'm Elin. / Jag är trött. = I'm tired. | construction
du-aer | du är | you are | Du är så snäll! = You're so kind!
var-kommer-du-ifraan | Var kommer du ifrån? | Where are you from? | Hej! Var kommer du ifrån? = Hi! Where are you from?
jag-kommer-fraan | Jag kommer från … | I'm from … | Jag kommer från England. = I'm from England. / Jag kommer från Göteborg. = I'm from Gothenburg. | accept: ^jag kommer från \p{L}+
var-bor-du | Var bor du? | Where do you live? | Och var bor du nu? = And where do you live now?
jag-bor-i | Jag bor i … | I live in … | Jag bor i Stockholm. = I live in Stockholm. / Jag bor på Lilla Ö. = I live on Lilla Ö. | accept: ^jag bor (i|på) \p{L}+
pratar-du-engelska | Pratar du engelska? | Do you speak English? | Ursäkta, pratar du engelska? = Excuse me, do you speak English?
jag-pratar | Jag pratar … | I speak … | Jag pratar engelska och lite svenska. = I speak English and a little Swedish. / Jag pratar inte tyska. = I don't speak German. | construction
lite-svenska | lite svenska | a little Swedish | Jag pratar bara lite svenska. = I only speak a little Swedish.
svenska | svenska | Swedish (language) | Jag lär mig svenska. = I'm learning Swedish.
engelska | engelska | English (language) | Min engelska är bra. = My English is good.
sverige | Sverige | Sweden | Lilla Ö ligger i Sverige. = Lilla Ö is in Sweden.
jag-laer-mig | Jag lär mig … | I'm learning … | Jag lär mig svenska. = I'm learning Swedish. / Jag lär mig lite varje dag. = I learn a little every day. | construction
vem-aer-det | Vem är det? | Who is that? | Vem är det? – Det är Bosse. = Who is that? – That's Bosse.
vad-aer-det | Vad är det? | What is that? | Vad är det? – Det är en fyr. = What is that? – It's a lighthouse.
det-haer-aer | Det här är … | This is … | Det här är Leo. = This is Leo. / Det här är min vän Maja. = This is my friend Maja. | construction
hon-heter | Hon heter … | Her name is … | Hon heter Maja. = Her name is Maja. | accept: ^hon heter \p{L}+
han-heter | Han heter … | His name is … | Han heter Nils. = His name is Nils. | accept: ^han heter \p{L}+
en-man | en man | a man | Mannen heter Olle. = The man's name is Olle. | forms: mannen, män, männen
en-kvinna | en kvinna | a woman | Kvinnan heter Karin. = The woman's name is Karin. | forms: kvinnan, kvinnor, kvinnorna
ett-barn | ett barn | a child | Barnet heter Leo. = The child's name is Leo. | forms: barnet, barnen
en-vaen | en vän | a friend | Maja är min vän. = Maja is my friend. | forms: vännen, vänner, vännerna
en-kompis | en kompis | a mate | Leo är min kompis. = Leo is my mate. | forms: kompisen, kompisar
jag | jag | I | Jag heter Elin. = My name is Elin.
du | du | you | Vad heter du? = What's your name?
han | han | he | Han bor här. = He lives here.
hon | hon | she | Hon pratar svenska. = She speaks Swedish.
vi | vi | we | Vi bor på ön. = We live on the island.
ni | ni | you (plural) | Var bor ni? = Where do you all live?
de | de | they | De kommer från Norge. = They come from Norway. | note: Written de, but almost always said "dom".
ocksaa | också | also / too | Jag bor också här. = I live here too.
vad-goer-du-haer | Vad gör du här? | What are you doing here? | Hej! Vad gör du här? = Hi! What are you doing here?
jag-aer-turist | Jag är turist. | I'm a tourist. | Jag är turist, jag bor på hotellet. = I'm a tourist, I'm staying at the hotel.
`,
  },
  {
    id: "siffror",
    level: "A1",
    villager: "nils",
    title: { t: "Siffror", en: "Numbers" },
    about: "Counting to a thousand, ages, prices and how many.",
    items: String.raw`
noll | noll | zero | Det är noll grader. = It's zero degrees.
ett | ett | one | Ett, två, tre! = One, two, three! | note: One is en or ett, like the word for "a": en fisk, ett barn.
tvaa | två | two | Två kaffe, tack. = Two coffees, please.
tre | tre | three | Båten kommer klockan tre. = The boat comes at three.
fyra | fyra | four | Jag har fyra fiskar. = I have four fish.
fem | fem | five | Vänta fem minuter! = Wait five minutes!
sex | sex | six | Nils fiskar klockan sex. = Nils goes fishing at six.
sju | sju | seven | En vecka har sju dagar. = A week has seven days.
aatta | åtta | eight | Jag vaknar klockan åtta. = I wake up at eight.
nio | nio | nine | Leo är nio år. = Leo is nine.
tio | tio | ten | Tio fiskar! = Ten fish!
elva | elva | eleven | Klockan är elva. = It's eleven o'clock.
tolv | tolv | twelve | Vi äter lunch klockan tolv. = We have lunch at twelve.
tretton | tretton | thirteen | Tretton båtar i hamnen. = Thirteen boats in the harbour.
fjorton | fjorton | fourteen | Fjorton dagar. = Fourteen days.
femton | femton | fifteen | Leo är femton år. = Leo is fifteen.
tjugo | tjugo | twenty | Det kostar tjugo kronor. = It costs twenty kronor.
tjugofem | tjugofem | twenty-five | Kaffet kostar tjugofem kronor. = The coffee costs twenty-five kronor.
trettio | trettio | thirty | Jag är trettio år. = I'm thirty.
fyrtio | fyrtio | forty | Fyrtio minuter till Stockholm. = Forty minutes to Stockholm.
femtio | femtio | fifty | Femtio kronor, tack. = Fifty kronor, please.
sextio | sextio | sixty | En timme har sextio minuter. = An hour has sixty minutes.
hundra | hundra | a hundred | Det kostar hundra kronor. = It costs a hundred kronor. / Fyren är hundra år gammal. = The lighthouse is a hundred years old.
tusen | tusen | a thousand | Tusen tack! = Thanks a thousand!
hur-maanga | Hur många? | How many? | Hur många fiskar har du? = How many fish do you have?
hur-gammal-aer-du | Hur gammal är du? | How old are you? | Hej Leo! Hur gammal är du? = Hi Leo! How old are you?
jag-aer-aar | Jag är … år. | I'm … years old. | Jag är trettio år. = I'm thirty. / Jag är femton år gammal. = I'm fifteen years old. | accept: ^jag är (\p{N}+|\p{L}+) år
vad-kostar-det | Vad kostar det? | How much is it? | Ursäkta, vad kostar det? = Excuse me, how much is it?
det-kostar | Det kostar … | It costs … | Det kostar tjugo kronor. = It costs twenty kronor. / Det kostar ingenting. = It costs nothing. | construction
kronor | kronor | kronor (Swedish money) | Femtio kronor, tack. = Fifty kronor, please. | forms: krona, kronan
vad-aer-ditt-nummer | Vad är ditt nummer? | What's your number? | Vad är ditt telefonnummer? = What's your phone number?
mitt-nummer-aer | Mitt nummer är … | My number is … | Mitt nummer är noll sju noll, ett två tre. = My number is zero seven zero, one two three.
foersta | första | first | Första gången på Lilla Ö! = First time on Lilla Ö!
andra | andra | second / other | Den andra båten. = The second boat.
tredje | tredje | third | Tredje gången gillt! = Third time lucky!
maanga | många | many | Många fiskar idag! = Lots of fish today!
naagra | några | some / a few | Några dagar. = A few days.
mycket | mycket | a lot / very | Tack så mycket! = Thanks a lot!
alla | alla | all / everyone | Alla fiskar är borta! = All the fish are gone!
en-fisk | en fisk | a fish | Fisken är stor! = The fish is big! | forms: fisken, fiskar, fiskarna
`,
  },
  {
    id: "familj",
    level: "A1",
    villager: "karin",
    title: { t: "Familjen", en: "Family" },
    about: "Parents, brothers and sisters, grandparents, pets, and my / your / his / her.",
    items: String.raw`
min-familj | min familj | my family | Det här är min familj. = This is my family. | forms: familj, familjen
en-mamma | en mamma | a mum | Min mamma heter Karin. = My mum's name is Karin. | forms: mamman, mammor
en-pappa | en pappa | a dad | Min pappa är fiskare. = My dad is a fisherman. | forms: pappan, pappor
foeraeldrar | föräldrar | parents | Mina föräldrar bor i Malmö. = My parents live in Malmö. | forms: föräldrarna
en-bror | en bror | a brother | Jag har en bror. = I have a brother. | forms: brodern, bröder, bröderna
en-syster | en syster | a sister | Min syster heter Maja. = My sister's name is Maja. | forms: systern, systrar, systrarna
syskon | syskon | brothers and sisters | Jag har tre syskon. = I have three brothers and sisters. | forms: syskonen
har-du-syskon | Har du syskon? | Do you have brothers or sisters? | Har du syskon? – Ja, en bror. = Do you have brothers or sisters? – Yes, a brother.
en-son | en son | a son | Karin har en son. = Karin has a son. | forms: sonen, söner
en-dotter | en dotter | a daughter | Hon har två döttrar. = She has two daughters. | forms: dottern, döttrar
mormor | mormor | grandma (mum's mum) | Min mormor är åttio år. = My grandma is eighty. | note: Swedish says which side: mormor is your mother's mother, farmor your father's mother.
farfar | farfar | grandpa (dad's dad) | Min farfar fiskar varje dag. = My grandpa fishes every day. | note: Farfar is your father's father, morfar your mother's father.
min-man | min man | my husband | Min man heter Olle. = My husband's name is Olle.
min-fru | min fru | my wife | Min fru jobbar på kaféet. = My wife works at the café.
en-sambo | en sambo | a partner (you live with) | Jag bor med min sambo. = I live with my partner. | note: Sambo is short for "samboende": the partner you live with. Very common in Sweden.
en-kusin | en kusin | a cousin | Min kusin bor i Uppsala. = My cousin lives in Uppsala. | forms: kusinen, kusiner
har-du-barn | Har du barn? | Do you have children? | Har du barn? – Ja, två. = Do you have children? – Yes, two.
jag-har-barn | Jag har … barn. | I have … children. | Jag har två barn. = I have two children. / Jag har inga barn. = I don't have any children. | accept: ^jag har (\p{N}+|\p{L}+) barn
min-mitt-mina | min / mitt / mina | my | Min bror, mitt barn, mina föräldrar. = My brother, my child, my parents. | note: Min goes with en-words, mitt with ett-words, mina with plurals.
din-ditt-dina | din / ditt / dina | your | Är det din hund? = Is that your dog?
hans | hans | his | Hans syster heter Maja. = His sister's name is Maja.
hennes | hennes | her | Hennes son heter Leo. = Her son's name is Leo.
vaar | vår | our | Vår katt är gammal. = Our cat is old. | forms: vårt, våra
en-hund | en hund | a dog | Vi har en hund. = We have a dog. | forms: hunden, hundar, hundarna
en-katt | en katt | a cat | Katten heter Misse. = The cat's name is Misse. | forms: katten, katter, katterna
gift | gift | married | Är du gift? = Are you married?
ung | ung | young | Hon är ung. = She is young. | forms: unga
gammal | gammal | old | Min hund är gammal. = My dog is old. | forms: gammalt, gamla
stor | stor | big | Min familj är stor. = My family is big. | forms: stort, stora
liten | liten | small | Vi har en liten familj. = We have a small family. | forms: litet, små
snaell | snäll | kind | Min mormor är så snäll. = My grandma is so kind. | forms: snällt, snälla
vi-bor-tillsammans | Vi bor tillsammans. | We live together. | Jag och min sambo bor tillsammans. = My partner and I live together.
vad-heter-hon | Vad heter hon? | What's her name? | Din syster, vad heter hon? = Your sister, what's her name?
`,
  },
  {
    id: "mat",
    level: "A1",
    villager: "bosse",
    title: { t: "Mat", en: "Food" },
    about: "Meals, everyday food, hungry and thirsty, and thanking the cook.",
    items: String.raw`
frukost | frukost | breakfast | Vad äter du till frukost? = What do you have for breakfast? | forms: frukosten
lunch | lunch | lunch | Vi äter lunch klockan tolv. = We have lunch at twelve. | forms: lunchen
middag | middag | dinner | Vad blir det till middag? = What's for dinner? | forms: middagen
jag-aeter | Jag äter … | I eat … | Jag äter fisk. = I'm eating fish. / Jag äter frukost klockan sju. = I have breakfast at seven. | construction
jag-dricker | Jag dricker … | I drink … | Jag dricker kaffe varje morgon. = I drink coffee every morning. | construction
jag-aer-hungrig | Jag är hungrig. | I'm hungry. | Jag är så hungrig! = I'm so hungry!
jag-aer-toerstig | Jag är törstig. | I'm thirsty. | Jag är törstig, kan jag få vatten? = I'm thirsty, can I have some water?
det-smakar-gott | Det smakar gott! | It tastes good! | Mmm, det smakar gott! = Mmm, it tastes good!
smaklig-maaltid | Smaklig måltid! | Enjoy your meal! | Varsågod, smaklig måltid! = Here you go, enjoy your meal!
tack-foer-maten | Tack för maten! | Thanks for the meal! | Tack för maten, det var jättegott! = Thanks for the meal, it was delicious! | note: Swedes say this to whoever cooked, every time.
kan-jag-faa | Kan jag få …? | Can I have …? | Kan jag få lite vatten? = Can I have some water? / Kan jag få menyn? = Can I have the menu? | construction
vad-vill-du-aeta | Vad vill du äta? | What do you want to eat? | Jag är hungrig. – Vad vill du äta? = I'm hungry. – What do you want to eat?
broed | bröd | bread | Jag köper bröd. = I'm buying bread. | forms: brödet
smoer | smör | butter | Bröd med smör. = Bread with butter. | forms: smöret
ost | ost | cheese | En macka med ost. = A sandwich with cheese. | forms: osten
en-macka | en macka | a sandwich | Jag vill ha en macka. = I'd like a sandwich. | forms: mackan, mackor
ett-aegg | ett ägg | an egg | Två ägg, tack. = Two eggs, please. | forms: ägget, äggen
potatis | potatis | potatoes | Fisk och potatis. = Fish and potatoes. | forms: potatisen
koettbullar | köttbullar | meatballs | Köttbullar med potatis! = Meatballs with potatoes! | forms: köttbulle, köttbullarna
kyckling | kyckling | chicken | Jag äter kyckling. = I'm eating chicken. | forms: kycklingen
koett | kött | meat | Jag äter inte kött. = I don't eat meat. | forms: köttet
lax | lax | salmon | Lax med potatis. = Salmon with potatoes. | forms: laxen
groensaker | grönsaker | vegetables | Jag äter mycket grönsaker. = I eat a lot of vegetables. | forms: grönsak, grönsakerna
ett-aepple | ett äpple | an apple | Ett äpple om dagen. = An apple a day. | forms: äpplet, äpplen
en-banan | en banan | a banana | Leo äter en banan. = Leo is eating a banana. | forms: bananen, bananer
soppa | soppa | soup | Soppan är varm. = The soup is hot. | forms: soppan
sallad | sallad | salad | En sallad, tack. = A salad, please. | forms: salladen
juice | juice | juice | Ett glas juice. = A glass of juice. | forms: juicen
socker | socker | sugar | Kaffe utan socker. = Coffee without sugar. | forms: sockret
utan | utan | without | Te utan mjölk, tack. = Tea without milk, please.
glass | glass | ice cream | En glass, tack! = An ice cream, please! | note: Careful: glass is ice cream. A drinking glass is ett glas.
ett-glas | ett glas | a glass | Ett glas vatten, tack. = A glass of water, please. | forms: glaset
en-kopp | en kopp | a cup | En kopp te? = A cup of tea? | forms: koppen, koppar
en-kaka | en kaka | a biscuit / cake | Vill du ha en kaka? = Would you like a biscuit? | forms: kakan, kakor
jag-aer-vegetarian | Jag är vegetarian. | I'm a vegetarian. | Jag är vegetarian, jag äter inte kött. = I'm a vegetarian, I don't eat meat.
god | god | good (tasty) | Maten är god. = The food is good. | forms: gott, goda
varm | varm | warm / hot | Soppan är varm. = The soup is hot. | forms: varmt, varma
kall | kall | cold | Mjölken är kall. = The milk is cold. | forms: kallt, kalla
`,
  },
  {
    id: "klockan",
    level: "A1",
    villager: "stina",
    title: { t: "Klockan", en: "Time" },
    about: "Telling the time, the days of the week and when things happen.",
    items: String.raw`
vad-aer-klockan | Vad är klockan? | What time is it? | Ursäkta, vad är klockan? = Excuse me, what time is it?
klockan-aer | Klockan är … | It's … o'clock | Klockan är tre. = It's three o'clock. / Klockan är halv tio. = It's half past nine. | accept: ^klockan är \p{L}+
halv | halv | half (to the hour) | Klockan är halv fyra. = It's half past three. | note: Halv fyra is half past three: half way to four.
kvart-oever | kvart över | quarter past | Klockan är kvart över två. = It's quarter past two.
kvart-i | kvart i | quarter to | Klockan är kvart i sex. = It's quarter to six.
naer | När? | When? | När kommer båten? = When does the boat come?
naer-gaar-taaget | När går tåget? | When does the train leave? | Ursäkta, när går tåget till Stockholm? = Excuse me, when does the train to Stockholm leave?
klockan-tre | klockan tre | at three o'clock | Vi ses klockan tre! = See you at three!
en-minut | en minut | a minute | Vänta en minut! = Wait a minute! | forms: minuten, minuter, minuterna
en-timme | en timme | an hour | En timme till Stockholm. = An hour to Stockholm. | forms: timmen, timmar
en-dag | en dag | a day | En fin dag! = A lovely day! | forms: dagen, dagar
en-vecka | en vecka | a week | En vecka på Lilla Ö. = A week on Lilla Ö. | forms: veckan, veckor
maandag | måndag | Monday | Idag är det måndag. = Today is Monday.
tisdag | tisdag | Tuesday | Affären är stängd på tisdag. = The shop is closed on Tuesday.
onsdag | onsdag | Wednesday | Vi ses på onsdag! = See you on Wednesday!
torsdag | torsdag | Thursday | På torsdag äter vi ärtsoppa. = On Thursday we have pea soup. | note: Pea soup and pancakes on Thursdays is an old Swedish tradition.
fredag | fredag | Friday | Äntligen fredag! = Friday at last!
loerdag | lördag | Saturday | På lördag är det fest. = On Saturday there's a party.
soendag | söndag | Sunday | På söndag vilar jag. = On Sunday I rest.
paa-maandag | på måndag | on Monday | Vi ses på måndag! = See you on Monday!
idag | idag | today | Idag är det fredag. = Today is Friday.
imorgon | imorgon | tomorrow | Vi ses imorgon! = See you tomorrow!
ikvaell | ikväll | tonight | Vad gör du ikväll? = What are you doing tonight?
paa-morgonen | på morgonen | in the morning | Jag dricker kaffe på morgonen. = I drink coffee in the morning.
paa-eftermiddagen | på eftermiddagen | in the afternoon | Vi fikar på eftermiddagen. = We have coffee in the afternoon.
paa-kvaellen | på kvällen | in the evening | Jag läser på kvällen. = I read in the evening.
nu | nu | now | Tåget går nu! = The train is leaving now!
sen | sen | later / late | Vi ses sen! = See you later! / Förlåt, jag är sen. = Sorry, I'm late.
tidigt | tidigt | early | Jag vaknar tidigt. = I wake up early.
alltid | alltid | always | Tåget är alltid i tid. = The train is always on time.
i-tid | i tid | on time | Tåget går i tid idag. = The train is on time today.
om-fem-minuter | om fem minuter | in five minutes | Tåget går om fem minuter. = The train leaves in five minutes. | note: Om with a time means "in" (from now).
vilken-dag-aer-det | Vilken dag är det idag? | What day is it today? | Vilken dag är det idag? – Det är tisdag. = What day is it today? – It's Tuesday.
i-helgen | i helgen | this weekend | Vad gör du i helgen? = What are you doing this weekend? | forms: helg, helgen
jag-vaknar | Jag vaknar … | I wake up … | Jag vaknar klockan sju. = I wake up at seven. | construction
jag-gaar-och-laegger-mig | Jag går och lägger mig … | I go to bed … | Jag går och lägger mig klockan elva. = I go to bed at eleven. | construction
`,
  },
  {
    id: "handla",
    level: "A1",
    villager: "maja",
    title: { t: "Handla", en: "Shopping" },
    about: "Asking for things in a shop, prices, paying and bags.",
    items: String.raw`
jag-vill-koepa | Jag vill köpa … | I want to buy … | Jag vill köpa bröd. = I want to buy bread. / Jag vill köpa ett vykort. = I want to buy a postcard. | construction
har-ni | Har ni …? | Do you have …? | Har ni mjölk? = Do you have milk? / Har ni frimärken? = Do you have stamps? | construction
hur-mycket-kostar | Hur mycket kostar …? | How much is …? | Hur mycket kostar osten? = How much is the cheese? | construction
kan-jag-hjaelpa-dig | Kan jag hjälpa dig? | Can I help you? | Hej! Kan jag hjälpa dig? = Hi! Can I help you?
jag-tittar-bara | Jag tittar bara. | I'm just looking. | Tack, jag tittar bara. = Thanks, I'm just looking.
jag-tar | Jag tar … | I'll take … | Jag tar två äpplen. = I'll take two apples. / Jag tar den här. = I'll take this one. | construction
den-haer | den här / det här | this one | Jag tar den här. = I'll take this one. | note: Den här goes with en-words, det här with ett-words.
naagot-mer | Något mer? | Anything else? | Något mer? – Nej tack. = Anything else? – No thanks.
det-var-allt | Nej tack, det var allt. | No thanks, that's all. | Något mer? – Nej tack, det var allt. = Anything else? – No thanks, that's all.
en-till | en till | one more | En till, tack! = One more, please!
det-aer-dyrt | Det är dyrt. | It's expensive. | Oj, det är dyrt! = Oh, that's expensive!
billig | billig | cheap | Det är billigt! = It's cheap! | forms: billigt, billiga
dyr | dyr | expensive | Osten är dyr. = The cheese is expensive. | forms: dyrt, dyra
kort-eller-kontant | Kort eller kontant? | Card or cash? | Det blir femtio kronor. Kort eller kontant? = That'll be fifty kronor. Card or cash?
jag-betalar-med-kort | Jag betalar med kort. | I'll pay by card. | Jag betalar med kort, tack. = I'll pay by card, please.
kan-jag-swisha | Kan jag swisha? | Can I pay by Swish? | Kan jag swisha? – Ja, självklart. = Can I pay by Swish? – Yes, of course. | note: Swish is the phone payment app almost everyone in Sweden uses.
det-blir | Det blir … | That'll be … | Det blir trettio kronor. = That'll be thirty kronor. | construction
en-paase | en påse | a bag | Vill du ha en påse? = Would you like a bag? | forms: påsen, påsar
behoever-du-paase | Behöver du en påse? | Do you need a bag? | Behöver du en påse? – Nej tack. = Do you need a bag? – No thanks.
ett-kvitto | ett kvitto | a receipt | Vill du ha kvittot? = Would you like the receipt? | forms: kvittot
en-affaer | en affär | a shop | Affären öppnar klockan nio. = The shop opens at nine. | forms: affären, affärer
oeppet | öppet | open | Är det öppet på söndag? = Is it open on Sunday? | forms: öppen, öppna
staengt | stängt | closed | Tyvärr, det är stängt. = Sorry, it's closed. | forms: stängd
en-liter | en liter | a litre | En liter mjölk, tack. = A litre of milk, please. | forms: litern
ett-kilo | ett kilo | a kilo | Ett kilo potatis. = A kilo of potatoes.
ett-paket | ett paket | a packet | Ett paket kaffe, tack. = A packet of coffee, please. | forms: paketet
en-flaska | en flaska | a bottle | En flaska vatten. = A bottle of water. | forms: flaskan, flaskor
ett-frimaerke | ett frimärke | a stamp | Jag behöver ett frimärke. = I need a stamp. | forms: frimärket, frimärken
ett-vykort | ett vykort | a postcard | Ett vykort från Lilla Ö! = A postcard from Lilla Ö! | forms: vykortet, vykort
kassan | kassan | the checkout | Du betalar i kassan. = You pay at the checkout. | forms: kassa
`,
  },
  {
    id: "hemma",
    level: "A1",
    villager: "maja",
    title: { t: "Hemma", en: "At home" },
    about: "Rooms and furniture, where things are, and being at home.",
    items: String.raw`
ett-hus | ett hus | a house | Vi bor i ett rött hus. = We live in a red house. | forms: huset, husen
en-laegenhet | en lägenhet | a flat | Jag bor i en lägenhet i Stockholm. = I live in a flat in Stockholm. | forms: lägenheten, lägenheter
ett-rum | ett rum | a room | Huset har fyra rum. = The house has four rooms. | forms: rummet, rummen
ett-koek | ett kök | a kitchen | Mamma är i köket. = Mum is in the kitchen. | forms: köket
ett-vardagsrum | ett vardagsrum | a living room | Vi tittar på film i vardagsrummet. = We watch films in the living room. | forms: vardagsrummet
ett-sovrum | ett sovrum | a bedroom | Mitt sovrum är litet. = My bedroom is small. | forms: sovrummet
ett-badrum | ett badrum | a bathroom | Var är badrummet? = Where is the bathroom? | forms: badrummet
en-toalett | en toalett | a toilet | Ursäkta, var är toaletten? = Excuse me, where is the toilet? | forms: toaletten
en-saeng | en säng | a bed | Sängen är skön. = The bed is comfy. | forms: sängen, sängar
ett-bord | ett bord | a table | Maten står på bordet. = The food is on the table. | forms: bordet, borden
en-stol | en stol | a chair | Sätt dig på stolen. = Sit on the chair. | forms: stolen, stolar
en-soffa | en soffa | a sofa | Katten sover på soffan. = The cat is sleeping on the sofa. | forms: soffan, soffor
ett-foenster | ett fönster | a window | Öppna fönstret! = Open the window! | forms: fönstret, fönstren
en-doerr | en dörr | a door | Stäng dörren, tack! = Close the door, please! | forms: dörren, dörrar
en-lampa | en lampa | a lamp | Lampan står på bordet. = The lamp is on the table. | forms: lampan, lampor
en-nyckel | en nyckel | a key | Var är nyckeln? = Where is the key? | forms: nyckeln, nycklar
var-aer | Var är …? | Where is …? | Var är nyckeln? = Where is the key? / Var är katten? = Where is the cat? | construction
i | i | in | Katten är i köket. = The cat is in the kitchen.
paa | på | on | Boken ligger på bordet. = The book is on the table.
under | under | under | Hunden sover under bordet. = The dog is sleeping under the table.
bredvid | bredvid | next to | Stolen står bredvid sängen. = The chair is next to the bed.
framfoer | framför | in front of | Cykeln står framför huset. = The bike is in front of the house.
bakom | bakom | behind | Trädgården ligger bakom huset. = The garden is behind the house.
mellan | mellan | between | Soffan står mellan fönstren. = The sofa is between the windows.
ligger | ligger | lies (is, lying flat) | Nyckeln ligger på bordet. = The key is on the table. | note: Swedish says whether things lie or stand: a key ligger on the table, a lamp står on it.
staar | står | stands (is, standing) | Lampan står på bordet. = The lamp is on the table.
hemma | hemma | at home | Är du hemma? = Are you at home?
hem | hem | home (going there) | Jag går hem nu. = I'm going home now. | note: Hemma is where you are; hem is where you're going.
vaelkommen-in | Välkommen in! | Come in! | Hej! Välkommen in! = Hi! Come in!
ta-av-dig-skorna | Ta av dig skorna. | Take your shoes off. | Välkommen in! Ta av dig skorna. = Come in! Take your shoes off. | note: In Swedish homes, shoes come off at the door.
mysigt | mysigt | cosy | Vad mysigt det är här! = It's so cosy here!
jag-staedar | Jag städar. | I'm cleaning. | Jag städar köket. = I'm cleaning the kitchen.
jag-lagar-mat | Jag lagar mat. | I'm cooking. | Jag lagar mat, kom och ät! = I'm cooking, come and eat!
`,
  },
  {
    id: "vaegen",
    level: "A1",
    villager: "leo",
    title: { t: "Vägen", en: "Directions" },
    about: "Asking the way, left and right, near and far, and places on the island.",
    items: String.raw`
var-ligger | Var ligger …? | Where is …? | Var ligger affären? = Where is the shop? / Var ligger fyren? = Where is the lighthouse? | construction
hur-kommer-jag-till | Hur kommer jag till …? | How do I get to …? | Hur kommer jag till fyren? = How do I get to the lighthouse? | construction | accept: ^(ursäkta )?hur kommer jag till \p{L}+
till-vaenster | till vänster | (to the) left | Gå till vänster vid kaféet. = Turn left at the café. / Affären ligger till vänster. = The shop is on the left.
till-hoeger | till höger | (to the) right | Stationen ligger till höger. = The station is on the right.
rakt-fram | rakt fram | straight ahead | Gå rakt fram! = Go straight ahead!
svaeng | Sväng … | Turn … | Sväng höger vid fyren. = Turn right at the lighthouse. | construction
gaa | Gå … | Go / Walk … | Gå rakt fram och sedan till vänster. = Go straight ahead and then left. | construction
naera | nära | near / close | Är det nära? = Is it close?
laangt | långt | far | Är det långt? = Is it far? / Det är inte långt. = It's not far.
haer | här | here | Jag bor här. = I live here.
daer | där | there | Där är stationen! = There's the station!
daer-borta | där borta | over there | Fyren är där borta. = The lighthouse is over there.
vid | vid | by / at | Vi ses vid bryggan. = See you by the dock.
foerbi | förbi | past | Gå förbi kaféet. = Walk past the café.
upp | upp | up | Gå upp på berget. = Go up the hill.
ner | ner | down | Gå ner till vattnet. = Go down to the water.
foerst | först | first | Först rakt fram, sedan till höger. = First straight ahead, then right.
sedan | sedan | then / after that | Sedan till vänster. = Then left.
en-vaeg | en väg | a road / way | Vilken väg? = Which way? | forms: vägen, vägar
en-gata | en gata | a street | Affären ligger på den här gatan. = The shop is on this street. | forms: gatan, gator
ett-torg | ett torg | a square | Vi ses på torget! = See you in the square! | forms: torget
en-karta | en karta | a map | Har du en karta? = Do you have a map? | forms: kartan
en-fyr | en fyr | a lighthouse | Fyren är vit och röd. = The lighthouse is white and red. | forms: fyren, fyrar
en-kyrka | en kyrka | a church | Kyrkan ligger på berget. = The church is on the hill. | forms: kyrkan
ett-bibliotek | ett bibliotek | a library | Leo läser på biblioteket. = Leo reads at the library. | forms: biblioteket
en-strand | en strand | a beach | Vi badar på stranden. = We swim at the beach. | forms: stranden, stränder
en-hamn | en hamn | a harbour | Båtarna ligger i hamnen. = The boats are in the harbour. | forms: hamnen
jag-har-gaatt-vilse | Jag har gått vilse. | I'm lost. | Ursäkta, jag har gått vilse. = Excuse me, I'm lost.
jag-hittar-inte | Jag hittar inte … | I can't find … | Jag hittar inte stationen. = I can't find the station. | construction
foelj-med-mig | Följ med mig! | Come with me! | Följ med mig, jag visar dig! = Come with me, I'll show you!
`,
  },
  {
    id: "klaeder",
    level: "A1",
    villager: "maja",
    title: { t: "Kläder", en: "Clothes" },
    about: "Clothes, colours and sizes, and trying things on.",
    items: String.raw`
klaeder | kläder | clothes | Jag behöver nya kläder. = I need new clothes. | forms: kläderna
en-troeja | en tröja | a jumper / top | En varm tröja. = A warm jumper. | forms: tröjan, tröjor
en-jacka | en jacka | a jacket | Min jacka är blå. = My jacket is blue. | forms: jackan, jackor
byxor | byxor | trousers | Byxorna är för långa. = The trousers are too long. | forms: byxorna
en-kjol | en kjol | a skirt | En röd kjol. = A red skirt. | forms: kjolen, kjolar
en-klaenning | en klänning | a dress | Vilken fin klänning! = What a lovely dress! | forms: klänningen
skor | skor | shoes | Mina skor är gamla. = My shoes are old. | forms: sko, skorna
stoevlar | stövlar | boots | Ta på dig stövlarna, det regnar! = Put your boots on, it's raining! | forms: stövel, stövlarna
en-moessa | en mössa | a woolly hat | En mössa för vintern. = A hat for the winter. | forms: mössan, mössor
vantar | vantar | mittens | Glöm inte vantarna! = Don't forget your mittens! | forms: vante, vantarna
en-halsduk | en halsduk | a scarf | En lång halsduk. = A long scarf. | forms: halsduken
strumpor | strumpor | socks | Varma strumpor. = Warm socks. | forms: strumpa, strumporna
en-faerg | en färg | a colour | Vilken fin färg! = What a lovely colour! | forms: färgen, färger
vilken-faerg | Vilken färg? | What colour? | Vilken färg gillar du? = What colour do you like?
roed | röd | red | En röd jacka. = A red jacket. | forms: rött, röda | note: Colours change like other adjectives: en röd jacka, ett rött hus, röda skor.
blaa | blå | blue | En blå tröja. = A blue jumper. | forms: blått, blåa
gul | gul | yellow | Ett gult hus. = A yellow house. | forms: gult, gula
groen | grön | green | Gröna byxor. = Green trousers. | forms: grönt, gröna
vit | vit | white | En vit klänning. = A white dress. | forms: vitt, vita
svart | svart | black | Svarta skor. = Black shoes. | forms: svarta
graa | grå | grey | En grå mössa. = A grey hat. | forms: grått, gråa
brun | brun | brown | Bruna stövlar. = Brown boots. | forms: brunt, bruna
rosa | rosa | pink | En rosa halsduk. = A pink scarf.
kan-jag-prova | Kan jag prova …? | Can I try … on? | Kan jag prova jackan? = Can I try the jacket on? | construction
den-aer-foer-stor | Den är för stor. | It's too big. | Jackan? Den är för stor. = The jacket? It's too big.
den-aer-foer-liten | Den är för liten. | It's too small. | Tröjan är för liten. = The jumper is too small.
den-passar-bra | Den passar bra. | It fits well. | Den passar bra, jag tar den! = It fits well, I'll take it!
vilken-storlek | Vilken storlek? | What size? | Vilken storlek har du? = What size are you?
snygg | snygg | smart / good-looking | Vad snygg du är idag! = You look great today! | forms: snyggt, snygga
jag-har-paa-mig | Jag har på mig … | I'm wearing … | Jag har på mig en blå tröja. = I'm wearing a blue jumper. | construction
ta-paa-dig | Ta på dig …! | Put … on! | Ta på dig mössan, det är kallt! = Put your hat on, it's cold! | construction
ny | ny | new | En ny jacka! = A new jacket! | forms: nytt, nya
`,
  },
];
