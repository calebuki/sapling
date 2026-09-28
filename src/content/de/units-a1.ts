import type { UnitSource } from "../dsl";

// German A1: greetings to getting around, shopping, home and clothes.
// Format: slug | target | English | example = English / … | options (see ../dsl).

export const a1: UnitSource[] = [
  {
    id: "hallo",
    level: "A1",
    villager: "greta",
    title: { t: "Hallo!", en: "Hello!" },
    about: "Greetings, please and thank you, yes and no.",
    items: String.raw`
hallo | Hallo! | Hello! | Hallo, Greta! = Hi, Greta! / Hallo, wie geht's? = Hi, how are you?
danke | Danke! | Thanks! | Danke, Franz! = Thanks, Franz! / Vielen Dank! = Thanks a lot!
ja | ja | yes | Ja, gern! = Yes, gladly! / Ja, genau. = Yes, exactly.
nein | nein | no | Nein, danke. = No, thanks. / Nein, heute nicht. = No, not today.
bitte | bitte | please | Einen Kaffee, bitte. = A coffee, please. / Bitte schön! = Here you go!
tschuess | Tschüss! | Bye! | Tschüss, bis morgen! = Bye, see you tomorrow! / Tschüss, Greta! = Bye, Greta!
guten-morgen | Guten Morgen! | Good morning! | Guten Morgen, Frau Weber! = Good morning, Mrs Weber!
guten-tag | Guten Tag! | Hello! (good day) | Guten Tag, wie geht es Ihnen? = Hello, how are you? (formal)
guten-abend | Guten Abend! | Good evening! | Guten Abend, Hilde! = Good evening, Hilde!
gute-nacht | Gute Nacht! | Good night! | Gute Nacht, schlaf gut! = Good night, sleep well!
gruess-gott | Grüß Gott! | Hello! (southern Germany) | Grüß Gott, Sepp! = Hello, Sepp! | note: In the south of Germany and in Austria, people often greet each other with "Grüß Gott".
auf-wiedersehen | Auf Wiedersehen! | Goodbye! (polite) | Auf Wiedersehen, bis nächste Woche! = Goodbye, see you next week!
bis-bald | Bis bald! | See you soon! | Tschüss, bis bald! = Bye, see you soon!
bis-morgen | Bis morgen! | See you tomorrow! | Gute Nacht und bis morgen! = Good night and see you tomorrow!
entschuldigung | Entschuldigung! | Excuse me! / Sorry! | Entschuldigung, wo ist das Café? = Excuse me, where is the café?
tut-mir-leid | Es tut mir leid. | I'm sorry. | Es tut mir leid, ich habe keine Zeit. = I'm sorry, I don't have time.
kein-problem | Kein Problem! | No problem! | Danke! – Kein Problem! = Thanks! – No problem!
bitte-schoen | Bitte schön! | You're welcome! / Here you go! | Danke! – Bitte schön! = Thanks! – You're welcome!
wie-gehts | Wie geht's? | How are you? | Hallo Greta, wie geht's? = Hi Greta, how are you?
gut-danke | Gut, danke! | Good, thanks! | Mir geht's gut, danke! = I'm good, thanks!
und-dir | Und dir? | And you? | Gut, danke. Und dir? = Good, thanks. And you?
okay | Okay! | Okay! | Okay, bis dann! = Okay, see you then!
gern | gern | gladly | Ja, gern! = Yes, gladly! / Gern geschehen! = You're welcome!
vielleicht | vielleicht | maybe | Vielleicht morgen. = Maybe tomorrow.
ich-weiss-nicht | Ich weiß nicht. | I don't know. | Ich weiß nicht, wo das ist. = I don't know where that is.
das-ist | Das ist … | This is … | Das ist Greta. = This is Greta. / Das ist mein Boot. = This is my boat. | construction
super | super | great | Das ist super! = That's great!
genau | genau | exactly | Ja, genau! = Yes, exactly!
`,
  },
  {
    id: "vorstellen",
    level: "A1",
    villager: "greta",
    title: { t: "Sich vorstellen", en: "Introductions" },
    about: "Your name, where you're from, where you live and the languages you speak.",
    items: String.raw`
ich-heisse | Ich heiße … | My name is … | Hallo, ich heiße Anna. = Hi, my name is Anna. / Ich heiße Lukas. = My name is Lukas. | say: Hallo, ich heiße Caleb. = Hi, my name is {name}. | accept: ^(hallo )?(ich heiße|mein name ist|ich bin) \p{L}+
wie-heisst-du | Wie heißt du? | What's your name? | Hallo! Wie heißt du? = Hi! What's your name?
freut-mich | Freut mich! | Nice to meet you! | Ich heiße Lena. – Freut mich! = My name is Lena. – Nice to meet you!
wie-heissen-sie | Wie heißen Sie? | What's your name? (formal) | Guten Tag! Wie heißen Sie? = Hello! What's your name?
ich-bin | Ich bin … | I am … | Ich bin Greta. = I'm Greta. / Ich bin müde. = I'm tired. | construction
du-bist | du bist | you are | Du bist nett! = You're nice!
woher-kommst-du | Woher kommst du? | Where are you from? | Woher kommst du, Aylin? = Where are you from, Aylin?
ich-komme-aus | Ich komme aus … | I'm from … | Ich komme aus England. = I'm from England. / Ich komme aus Berlin. = I'm from Berlin. | accept: ^ich komme aus \p{L}+
wo-wohnst-du | Wo wohnst du? | Where do you live? | Und wo wohnst du jetzt? = And where do you live now?
ich-wohne-in | Ich wohne in … | I live in … | Ich wohne in Tannenau. = I live in Tannenau. / Ich wohne in Hamburg. = I live in Hamburg. | accept: ^ich wohne in \p{L}+
sprichst-du | Sprichst du Englisch? | Do you speak English? | Entschuldigung, sprichst du Englisch? = Excuse me, do you speak English?
ich-spreche | Ich spreche … | I speak … | Ich spreche Englisch und Spanisch. = I speak English and Spanish. / Ich spreche ein bisschen Deutsch. = I speak a little German. | construction
ein-bisschen | ein bisschen | a little | Nur ein bisschen. = Only a little.
deutsch | Deutsch | German (language) | Ich lerne Deutsch. = I'm learning German.
englisch | Englisch | English (language) | Mein Englisch ist gut. = My English is good.
deutschland | Deutschland | Germany | Tannenau ist in Deutschland. = Tannenau is in Germany.
ich-lerne | Ich lerne … | I'm learning … | Ich lerne jeden Tag. = I learn every day. / Ich lerne Spanisch. = I'm learning Spanish. | construction
der-mann | der Mann | man | Der Mann heißt Sepp. = The man's name is Sepp. | forms: Männer
die-frau | die Frau | woman / Mrs | Die Frau heißt Marie. = The woman's name is Marie. / Frau Weber ist nett. = Mrs Weber is nice. | forms: Frauen
das-kind | das Kind | child | Das Kind heißt Mia. = The child's name is Mia. | forms: Kinder, Kindern
der-freund | der Freund | friend (male) / boyfriend | Das ist mein Freund Jonas. = This is my friend Jonas. | forms: Freunde, Freunden
die-freundin | die Freundin | friend (female) / girlfriend | Das ist meine Freundin Lena. = This is my friend Lena. | forms: Freundinnen
wer-ist-das | Wer ist das? | Who is that? | Wer ist das? – Das ist Franz. = Who is that? – That's Franz.
was-ist-das | Was ist das? | What is that? | Was ist das? – Das ist eine Brezel. = What is that? – That's a pretzel.
ich | ich | I | Ich bin Paul. = I'm Paul.
du | du | you | Bist du Lena? = Are you Lena?
er | er | he | Er heißt Franz. = His name is Franz.
sie | sie | she / they | Sie heißt Hilde. = Her name is Hilde.
wir | wir | we | Wir wohnen in Tannenau. = We live in Tannenau.
ihr | ihr | you (plural) | Wo wohnt ihr? = Where do you (all) live?
sie-formal | Sie | you (formal) | Kommen Sie aus England? = Are you from England? (formal)
mein | mein | my | Mein Name ist Greta. = My name is Greta.
dein | dein | your | Wie ist dein Name? = What's your name?
nett | nett | nice / kind | Du bist sehr nett. = You're very nice.
hier | hier | here | Ich wohne hier. = I live here.
und | und | and | Ich komme aus Wien und wohne in Tannenau. = I'm from Vienna and live in Tannenau.
aber | aber | but | Ich spreche Deutsch, aber nur ein bisschen. = I speak German, but only a little.
auch | auch | also / too | Ich lerne auch Deutsch. = I'm learning German too.
willkommen | Willkommen! | Welcome! | Willkommen in Tannenau! = Welcome to Tannenau!
`,
  },
  {
    id: "cafe",
    level: "A1",
    villager: "franz",
    title: { t: "Im Café", en: "At the café" },
    about: "Drinks, pretzels and cake, ordering and paying at the counter.",
    items: String.raw`
kaffee | der Kaffee | coffee | Ich trinke gern Kaffee. = I like drinking coffee. / Der Kaffee ist heiß. = The coffee is hot.
tee | der Tee | tea | Möchtest du einen Tee? = Would you like a tea? / Der Tee ist noch warm. = The tea is still warm.
wasser | das Wasser | water | Ein Glas Wasser, bitte. = A glass of water, please.
milch | die Milch | milk | Kaffee mit Milch, bitte. = Coffee with milk, please.
brezel | die Brezel | pretzel | Die Brezeln sind frisch. = The pretzels are fresh. | forms: Brezeln
kuchen | der Kuchen | cake | Der Kuchen ist lecker! = The cake is delicious! / Ein Stück Kuchen, bitte. = A piece of cake, please.
saft | der Saft | juice | Einen Apfelsaft, bitte. = An apple juice, please. | forms: Säfte, Apfelsaft
ich-haette-gern | Ich hätte gern … | I would like … | Ich hätte gern einen Kaffee. = I'd like a coffee. / Ich hätte gern eine Brezel. = I'd like a pretzel. | construction
ich-moechte | Ich möchte … | I'd like … | Ich möchte einen Tee. = I'd like a tea. / Möchtest du Kuchen? = Would you like cake? | construction
mit-milch | mit Milch | with milk | Einen Kaffee mit Milch, bitte. = A coffee with milk, please.
und-eine-brezel | Und eine Brezel, bitte. | And a pretzel, please. | Einen Kaffee und eine Brezel, bitte. = A coffee and a pretzel, please.
bestellen-getraenk | ein Getränk bestellen | order a drink | Ich hätte gern einen Tee, bitte. = I'd like a tea, please. | function | task: Order any drink. | say: Ich hätte gern einen Kaffee mit Milch, bitte. = I'd like a coffee with milk, please. | accept: ^(ich hätte gern|ich möchte|ich nehme) .*(kaffee|tee|wasser|saft|milch)
bestellen-essen | etwas zu essen bestellen | order something to eat | Und ein Stück Kuchen, bitte. = And a piece of cake, please. | function | task: Add something to eat. | say: Und eine Brezel, bitte. = And a pretzel, please. | accept: \b(brezel|kuchen)\b
zahlen-bitte | Ich möchte bitte zahlen. | I'd like to pay, please. | Entschuldigung, ich möchte bitte zahlen. = Excuse me, I'd like to pay, please. | accept: ^(ich möchte (bitte )?zahlen|zahlen bitte|die rechnung bitte)
die-rechnung | die Rechnung | the bill | Die Rechnung, bitte! = The bill, please!
das-stueck | das Stück | piece | Noch ein Stück? = Another piece?
die-tasse | die Tasse | cup | Eine Tasse Tee, bitte. = A cup of tea, please. | forms: Tassen
das-glas | das Glas | glass | Ein Glas Saft, bitte. = A glass of juice, please. | forms: Gläser
lecker | lecker | tasty / delicious | Mmm, das ist lecker! = Mmm, that's delicious!
heiss | heiß | hot | Vorsicht, der Tee ist heiß! = Careful, the tea is hot!
kalt | kalt | cold | Das Wasser ist kalt. = The water is cold.
warm | warm | warm | Die Brezel ist noch warm. = The pretzel is still warm.
frisch | frisch | fresh | Alles ist frisch. = Everything is fresh.
zucker | der Zucker | sugar | Kaffee ohne Zucker, bitte. = Coffee without sugar, please.
ohne | ohne | without | Tee ohne Milch, bitte. = Tea without milk, please.
noch-ein | noch ein … | another … | Noch einen Kaffee, bitte! = Another coffee, please!
zum-mitnehmen | zum Mitnehmen | to take away | Einen Kaffee zum Mitnehmen, bitte. = A coffee to take away, please.
fuer-hier | für hier | for here (eat in) | Für hier oder zum Mitnehmen? = For here or to take away?
was-kostet | Was kostet …? | How much is …? | Was kostet der Kuchen? = How much is the cake?
das-macht | Das macht … | That comes to … | Das macht vier Euro, bitte. = That's four euros, please.
der-euro | der Euro | euro | Das kostet drei Euro. = That costs three euros.
bitte-sehr | Bitte sehr! | Here you are! | Ihr Kaffee. Bitte sehr! = Your coffee. Here you are!
guten-appetit | Guten Appetit! | Enjoy your meal! | Guten Appetit! – Danke, gleichfalls! = Enjoy your meal! – Thanks, you too!
der-tisch | der Tisch | table | Ist der Tisch frei? = Is the table free?
frei | frei | free | Ist hier noch frei? = Is this seat free?
schmeckt | Schmeckt's? | Does it taste good? | Schmeckt's? – Ja, sehr gut! = Do you like it? – Yes, very good!
sehr-gut | sehr gut | very good | Der Kaffee ist sehr gut. = The coffee is very good.
die-torte | die Schwarzwälder Kirschtorte | Black Forest cake | Die Schwarzwälder Kirschtorte ist berühmt. = Black Forest cake is famous.
`,
  },
  {
    id: "zahlen",
    level: "A1",
    villager: "jonas",
    title: { t: "Zahlen", en: "Numbers" },
    about: "Counting to a thousand, ages, prices and phone numbers.",
    items: String.raw`
null | null | zero | Null Grad heute! = Zero degrees today!
eins | eins | one | Eins, zwei, drei! = One, two, three!
zwei | zwei | two | Zwei Kaffee, bitte. = Two coffees, please.
drei | drei | three | Ich habe drei Kinder. = I have three children.
vier | vier | four | Das macht vier Euro. = That's four euros.
fuenf | fünf | five | Fünf Minuten, bitte! = Five minutes, please!
sechs | sechs | six | Um sechs Uhr. = At six o'clock.
sieben | sieben | seven | Die Woche hat sieben Tage. = The week has seven days.
acht | acht | eight | Der Zug kommt um acht. = The train comes at eight.
neun | neun | nine | Neun Euro, bitte. = Nine euros, please.
zehn | zehn | ten | Ich habe zehn Uhren. = I have ten clocks.
elf | elf | eleven | Es ist elf Uhr. = It's eleven o'clock.
zwoelf | zwölf | twelve | Um zwölf essen wir. = We eat at twelve.
dreizehn | dreizehn | thirteen | Mia ist dreizehn. = Mia is thirteen.
zwanzig | zwanzig | twenty | Ich bin zwanzig Jahre alt. = I'm twenty years old.
einundzwanzig | einundzwanzig | twenty-one | Er ist einundzwanzig. = He's twenty-one.
dreissig | dreißig | thirty | Das kostet dreißig Euro. = That costs thirty euros.
vierzig | vierzig | forty | Meine Mutter ist vierzig. = My mother is forty.
fuenfzig | fünfzig | fifty | Fünfzig Cent, bitte. = Fifty cents, please.
sechzig | sechzig | sixty | Eine Stunde hat sechzig Minuten. = An hour has sixty minutes.
siebzig | siebzig | seventy | Hilde ist siebzig. = Hilde is seventy.
hundert | hundert | hundred | Die Uhr ist hundert Jahre alt. = The clock is a hundred years old.
tausend | tausend | thousand | Tausend Dank! = A thousand thanks!
wie-alt-bist-du | Wie alt bist du? | How old are you? | Wie alt bist du, Mia? = How old are you, Mia?
ich-bin-jahre-alt | Ich bin … Jahre alt. | I'm … years old. | Ich bin dreißig Jahre alt. = I'm thirty years old. | say: Ich bin zwanzig Jahre alt. = I'm twenty years old. | accept: ^ich bin [\p{L}\p{N}]+( jahre alt)?$
das-jahr | das Jahr | year | Ein Jahr hat zwölf Monate. = A year has twelve months. | forms: Jahre, Jahren
die-zahl | die Zahl | number | Sieben ist meine Lieblingszahl. = Seven is my favourite number. | forms: Zahlen
die-nummer | die Nummer | number (phone, house) | Wie ist deine Nummer? = What's your number?
telefonnummer | Wie ist deine Telefonnummer? | What's your phone number? | Meine Telefonnummer ist null eins sieben drei. = My phone number is 0173.
wie-viel | Wie viel? | How much? | Wie viel kostet das? = How much does that cost?
wie-viele | Wie viele? | How many? | Wie viele Uhren hast du? = How many clocks do you have?
viel | viel | much / a lot | Das ist viel Geld! = That's a lot of money!
wenig | wenig | little / few | Ich habe wenig Zeit. = I have little time.
kostet | Das kostet … | That costs … | Das kostet zehn Euro. = That costs ten euros. | construction
billig | billig | cheap | Das ist billig! = That's cheap!
teuer | teuer | expensive | Die Uhr ist sehr teuer. = The clock is very expensive.
der-cent | der Cent | cent | Das kostet fünfzig Cent. = That costs fifty cents.
erste | erste | first | Das ist meine erste Uhr. = This is my first clock.
zweite | zweite | second | Das zweite Haus ist blau. = The second house is blue.
dritte | dritte | third | Die dritte Tür links. = The third door on the left.
die-uhr | die Uhr | clock / watch | Die Uhr ist alt. = The clock is old. | forms: Uhren
die-kuckucksuhr | die Kuckucksuhr | cuckoo clock | Die Kuckucksuhr macht „Kuckuck“! = The cuckoo clock goes "cuckoo"! | forms: Kuckucksuhren
rechnen | rechnen | to calculate | Ich rechne gern. = I like doing sums.
plus | plus | plus | Zwei plus zwei ist vier. = Two plus two is four.
minus | minus | minus | Zehn minus drei ist sieben. = Ten minus three is seven.
`,
  },
  {
    id: "familie",
    level: "A1",
    villager: "hilde",
    title: { t: "Familie & Freunde", en: "Family & friends" },
    about: "Family members, describing people, have and haven't got.",
    items: String.raw`
die-familie | die Familie | family | Meine Familie ist groß. = My family is big. | forms: Familien
die-mutter | die Mutter | mother | Meine Mutter heißt Anna. = My mother's name is Anna. | forms: Mütter
der-vater | der Vater | father | Mein Vater arbeitet viel. = My father works a lot. | forms: Väter
die-eltern | die Eltern | parents | Meine Eltern wohnen in Köln. = My parents live in Cologne.
der-bruder | der Bruder | brother | Ich habe einen Bruder. = I have a brother. | forms: Brüder
die-schwester | die Schwester | sister | Meine Schwester ist Lehrerin. = My sister is a teacher. | forms: Schwestern
die-geschwister | die Geschwister | siblings | Hast du Geschwister? = Do you have siblings?
der-sohn | der Sohn | son | Mein Sohn ist sechs. = My son is six. | forms: Söhne
die-tochter | die Tochter | daughter | Ihre Tochter heißt Mia. = Her daughter's name is Mia. | forms: Töchter
die-oma | die Oma | grandma | Meine Oma backt Kuchen. = My grandma bakes cake. | forms: Omas
der-opa | der Opa | grandpa | Mein Opa ist achtzig. = My grandpa is eighty. | forms: Opas
die-grosseltern | die Großeltern | grandparents | Meine Großeltern wohnen auf dem Land. = My grandparents live in the country.
der-onkel | der Onkel | uncle | Mein Onkel wohnt in Wien. = My uncle lives in Vienna.
die-tante | die Tante | aunt | Meine Tante ist sehr lustig. = My aunt is very funny.
der-cousin | der Cousin / die Cousine | cousin | Mein Cousin spielt Fußball. = My cousin plays football.
das-baby | das Baby | baby | Das Baby schläft. = The baby is sleeping.
verheiratet | verheiratet | married | Ich bin verheiratet. = I'm married.
ledig | ledig | single | Er ist ledig. = He's single.
ich-habe | Ich habe … | I have … | Ich habe zwei Brüder. = I have two brothers. / Ich habe keine Zeit. = I don't have time. | construction
hast-du | Hast du …? | Do you have …? | Hast du Kinder? = Do you have children? | construction
kein | kein / keine | no / not a | Ich habe keine Geschwister. = I don't have any siblings. / Das ist kein Problem. = That's no problem. | construction
sein-ihr | sein / ihr | his / her | Das ist sein Bruder. = That's his brother. / Das ist ihre Mutter. = That's her mother.
unser | unser | our | Das ist unser Hof. = This is our farm.
gross | groß | big / tall | Mein Bruder ist sehr groß. = My brother is very tall.
klein | klein | small / little | Meine Schwester ist noch klein. = My sister is still little.
alt | alt | old | Mein Opa ist alt. = My grandpa is old.
jung | jung | young | Meine Mutter ist noch jung. = My mother is still young.
lustig | lustig | funny | Mein Onkel ist lustig. = My uncle is funny.
freundlich | freundlich | friendly | Die Leute hier sind freundlich. = The people here are friendly.
lieb | lieb | sweet / kind | Du bist lieb. = You're sweet.
der-hund | der Hund | dog | Wir haben einen Hund. = We have a dog. | forms: Hunde, Hunden
die-katze | die Katze | cat | Die Katze heißt Mimi. = The cat's name is Mimi. | forms: Katzen
heissen | heißen | to be called | Wie heißt deine Katze? = What's your cat called?
wohnen | wohnen | to live | Wir wohnen zusammen. = We live together.
zusammen | zusammen | together | Wir essen zusammen. = We eat together.
die-leute | die Leute | people | Viele Leute wohnen hier. = Many people live here.
lieben | lieben | to love | Ich liebe meine Familie. = I love my family.
das-foto | das Foto | photo | Schau mal, ein Foto von meiner Familie! = Look, a photo of my family! | forms: Fotos
wer | wer | who | Wer ist das auf dem Foto? = Who is that in the photo?
der-name | der Name | name | Mein Name ist Hilde. = My name is Hilde.
das-haustier | das Haustier | pet | Hast du ein Haustier? = Do you have a pet? | forms: Haustiere
`,
  },
  {
    id: "essen",
    level: "A1",
    villager: "franz",
    title: { t: "Essen & Trinken", en: "Food & drink" },
    about: "Meals, food you like and don't like, hungry and thirsty.",
    items: String.raw`
essen | essen | to eat | Ich esse gern Brot. = I like eating bread.
trinken | trinken | to drink | Was trinkst du? = What are you drinking?
das-brot | das Brot | bread | Das Brot ist frisch. = The bread is fresh. | forms: Brote
das-broetchen | das Brötchen | bread roll | Zwei Brötchen, bitte. = Two rolls, please.
die-butter | die Butter | butter | Brot mit Butter. = Bread with butter.
der-kaese | der Käse | cheese | Ich mag Käse. = I like cheese.
die-wurst | die Wurst | sausage | Die Wurst ist lecker. = The sausage is tasty. | forms: Würste
das-ei | das Ei | egg | Ich esse ein Ei zum Frühstück. = I eat an egg for breakfast. | forms: Eier
der-apfel | der Apfel | apple | Der Apfel ist rot. = The apple is red. | forms: Äpfel, Äpfeln
die-banane | die Banane | banana | Die Banane ist gelb. = The banana is yellow. | forms: Bananen
das-obst | das Obst | fruit | Obst ist gesund. = Fruit is healthy.
das-gemuese | das Gemüse | vegetables | Ich esse viel Gemüse. = I eat a lot of vegetables.
die-kartoffel | die Kartoffel | potato | Die Kartoffeln sind heiß. = The potatoes are hot. | forms: Kartoffeln
die-tomate | die Tomate | tomato | Die Tomaten sind rot. = The tomatoes are red. | forms: Tomaten
der-salat | der Salat | salad / lettuce | Ein Salat, bitte. = A salad, please.
die-suppe | die Suppe | soup | Die Suppe ist heiß. = The soup is hot.
das-fleisch | das Fleisch | meat | Ich esse kein Fleisch. = I don't eat meat.
der-fisch | der Fisch | fish | Der Fisch ist frisch. = The fish is fresh. | forms: Fische
das-haehnchen | das Hähnchen | chicken (food) | Heute gibt es Hähnchen. = Today there's chicken.
der-reis | der Reis | rice | Reis mit Gemüse. = Rice with vegetables.
die-nudeln | die Nudeln | pasta / noodles | Die Kinder essen gern Nudeln. = The kids like eating pasta.
die-pizza | die Pizza | pizza | Die Pizza ist groß. = The pizza is big.
das-fruehstueck | das Frühstück | breakfast | Das Frühstück ist fertig! = Breakfast is ready!
das-mittagessen | das Mittagessen | lunch | Was gibt es zum Mittagessen? = What's for lunch?
das-abendessen | das Abendessen | dinner | Das Abendessen ist um sieben. = Dinner is at seven.
der-hunger | Ich habe Hunger. | I'm hungry. | Ich habe Hunger! Gibt es Brot? = I'm hungry! Is there bread?
der-durst | Ich habe Durst. | I'm thirsty. | Ich habe Durst. Gibt es Wasser? = I'm thirsty. Is there water?
ich-mag | Ich mag … | I like … | Ich mag Äpfel. = I like apples. / Magst du Fisch? = Do you like fish? | construction
ich-esse-gern | Ich esse gern … | I like eating … | Ich esse gern Nudeln. = I like eating pasta. | construction
nicht-gern | nicht gern | don't like to | Ich esse nicht gern Fisch. = I don't like eating fish.
das-lieblingsessen | das Lieblingsessen | favourite food | Mein Lieblingsessen ist Pizza. = My favourite food is pizza.
gesund | gesund | healthy | Gemüse ist gesund. = Vegetables are healthy.
suess | süß | sweet | Der Kuchen ist sehr süß. = The cake is very sweet.
salzig | salzig | salty | Die Suppe ist zu salzig. = The soup is too salty.
scharf | scharf | spicy / sharp | Ist das scharf? = Is that spicy?
kochen | kochen | to cook | Ich koche heute. = I'm cooking today.
backen | backen | to bake | Franz backt Brot. = Franz bakes bread.
es-gibt | Es gibt … | There is … | Heute gibt es Suppe. = Today there's soup. | construction
das-bier | das Bier | beer | Ein Bier, bitte. = A beer, please.
der-wein | der Wein | wine | Ein Glas Wein, bitte. = A glass of wine, please.
das-salz | das Salz | salt | Kannst du mir das Salz geben? = Can you pass me the salt?
der-teller | der Teller | plate | Der Teller ist leer. = The plate is empty.
das-messer | das Messer | knife | Das Messer ist scharf. = The knife is sharp.
die-gabel | die Gabel | fork | Ich brauche eine Gabel. = I need a fork.
der-loeffel | der Löffel | spoon | Einen Löffel für die Suppe, bitte. = A spoon for the soup, please.
satt | satt | full (after eating) | Danke, ich bin satt. = Thanks, I'm full.
`,
  },
  {
    id: "wie-bitte",
    level: "A1",
    villager: "greta",
    title: { t: "Wie bitte?", en: "Pardon?" },
    about: "Keeping a conversation going: asking again, slower, what a word means.",
    items: String.raw`
wie-bitte | Wie bitte? | Pardon? | Wie bitte? Ich verstehe nicht. = Pardon? I don't understand.
ich-verstehe-nicht | Ich verstehe nicht. | I don't understand. | Entschuldigung, ich verstehe nicht. = Sorry, I don't understand.
noch-einmal | Noch einmal, bitte. | Once more, please. | Kannst du das noch einmal sagen? = Can you say that once more?
langsamer | Kannst du langsamer sprechen? | Can you speak more slowly? | Bitte, kannst du langsamer sprechen? = Please, can you speak more slowly? | accept: \blangsamer\b
was-heisst | Was heißt … auf Deutsch? | What's … in German? | Was heißt „dog“ auf Deutsch? = What's "dog" in German? | say: Was heißt das auf Deutsch? = What's that in German?
wie-sagt-man | Wie sagt man … auf Deutsch? | How do you say … in German? | Wie sagt man „thank you“ auf Deutsch? = How do you say "thank you" in German? | say: Wie sagt man das auf Deutsch? = How do you say that in German?
wie-schreibt-man | Wie schreibt man das? | How do you spell that? | Wie schreibt man deinen Namen? = How do you spell your name?
buchstabieren | buchstabieren | to spell | Kannst du das buchstabieren? = Can you spell that?
ich-habe-eine-frage | Ich habe eine Frage. | I have a question. | Entschuldigung, ich habe eine Frage. = Excuse me, I have a question.
die-frage | die Frage | question | Das ist eine gute Frage. = That's a good question. | forms: Fragen
die-antwort | die Antwort | answer | Die Antwort ist richtig. = The answer is correct.
richtig | richtig | correct / right | Ja, das ist richtig! = Yes, that's right!
falsch | falsch | wrong | Nein, das ist falsch. = No, that's wrong.
das-wort | das Wort | word | Das Wort ist neu. = The word is new. | forms: Wörter
der-satz | der Satz | sentence | Der Satz ist zu lang. = The sentence is too long. | forms: Sätze
lauter | Bitte lauter! | Louder, please! | Ich höre nichts. Bitte lauter! = I can't hear anything. Louder, please!
moment | Moment, bitte! | One moment, please! | Moment, bitte, ich suche das Wort. = One moment please, I'm looking for the word.
verstehst-du | Verstehst du? | Do you understand? | Verstehst du das? – Ja, ich verstehe. = Do you understand that? – Yes, I understand.
ich-verstehe | Ich verstehe. | I understand. | Ah, jetzt verstehe ich. = Ah, now I understand.
sprechen | sprechen | to speak | Sprich bitte langsam. = Please speak slowly.
sagen | sagen | to say | Was sagst du? = What are you saying?
hoeren | hören | to hear / to listen | Ich höre dich nicht. = I can't hear you.
lesen | lesen | to read | Ich lese ein Buch. = I'm reading a book.
schreiben | schreiben | to write | Schreib das bitte auf. = Please write that down.
wiederholen | wiederholen | to repeat | Kannst du das wiederholen? = Can you repeat that?
bedeutet | Was bedeutet das? | What does that mean? | Was bedeutet „Tanne“? = What does "Tanne" mean?
langsam | langsam | slow / slowly | Bitte ganz langsam. = Very slowly, please.
schnell | schnell | fast / quickly | Du sprichst zu schnell! = You're speaking too fast!
`,
  },
  {
    id: "unterwegs",
    level: "A1",
    villager: "lena",
    title: { t: "Unterwegs", en: "Getting around" },
    about: "Trains, buses and tickets, getting on, off and changing.",
    items: String.raw`
der-bahnhof | der Bahnhof | train station | Der Bahnhof ist nicht weit. = The station isn't far.
der-zug | der Zug | train | Der Zug kommt gleich. = The train is coming soon. | forms: Züge
der-bus | der Bus | bus | Der Bus fährt um acht. = The bus leaves at eight. | forms: Busse
das-auto | das Auto | car | Mein Auto ist rot. = My car is red. | forms: Autos
das-fahrrad | das Fahrrad | bicycle | Ich fahre mit dem Fahrrad. = I go by bike. | forms: Fahrräder
das-boot | das Boot | boat | Das Boot fährt über den See. = The boat goes across the lake. | forms: Boote
das-schiff | das Schiff | ship | Das Schiff ist groß. = The ship is big.
das-flugzeug | das Flugzeug | plane | Das Flugzeug fliegt nach Berlin. = The plane flies to Berlin.
die-fahrkarte | die Fahrkarte | ticket | Eine Fahrkarte nach Freiburg, bitte. = A ticket to Freiburg, please. | forms: Fahrkarten
das-gleis | das Gleis | platform / track | Der Zug fährt von Gleis zwei. = The train leaves from platform two.
die-haltestelle | die Haltestelle | stop (bus, tram) | Wo ist die Haltestelle? = Where is the stop?
faehrt-dieser-zug | Fährt dieser Zug nach Freiburg? | Does this train go to Freiburg? | Fährt dieser Zug nach Titisee? = Does this train go to Titisee? / Fährt der Zug nach Konstanz? = Does the train go to Konstanz? | accept: ^fährt (dieser|der) zug nach \p{L}+
wann-faehrt | Wann fährt der Zug? | When does the train leave? | Wann fährt der nächste Zug? = When does the next train leave?
ich-muss-aussteigen | Ich muss hier aussteigen. | I have to get off here. | Entschuldigung, ich muss hier aussteigen. = Excuse me, I have to get off here. / Wir müssen jetzt aussteigen. = We have to get off now.
einsteigen | einsteigen | to get on | Bitte einsteigen! = All aboard, please!
aussteigen | aussteigen | to get off | Wir steigen in Freiburg aus. = We get off in Freiburg.
umsteigen | umsteigen | to change (trains) | Muss ich umsteigen? = Do I have to change trains?
fahren | fahren | to go (by vehicle) / to drive | Ich fahre nach Hause. = I'm going home.
gehen | gehen | to go / to walk | Wir gehen ins Café. = We're going to the café.
zu-fuss | zu Fuß | on foot | Zum Bahnhof gehe ich zu Fuß. = I walk to the station.
kommen | kommen | to come | Wann kommt der Bus? = When does the bus come?
nach | nach | to (a place) / after | Ich fahre nach München. = I'm going to Munich.
von | von | from | Der Zug kommt von Freiburg. = The train comes from Freiburg.
der-naechste | der nächste | the next | Der nächste Zug kommt um neun. = The next train comes at nine.
puenktlich | pünktlich | on time | Der Zug ist pünktlich. = The train is on time.
die-verspaetung | die Verspätung | delay | Der Zug hat zehn Minuten Verspätung. = The train is ten minutes late.
abfahren | abfahren | to depart | Der Zug fährt um zehn ab. = The train departs at ten.
ankommen | ankommen | to arrive | Wann kommen wir an? = When do we arrive?
hin-und-zurueck | hin und zurück | return (ticket) | Einmal nach Titisee, hin und zurück. = One to Titisee, return.
einfach | einfach | one way / simple | Einfach oder hin und zurück? = One way or return?
der-fahrplan | der Fahrplan | timetable | Hier ist der Fahrplan. = Here's the timetable.
die-reise | die Reise | trip / journey | Gute Reise! = Have a good trip!
der-koffer | der Koffer | suitcase | Mein Koffer ist schwer. = My suitcase is heavy.
schwer | schwer | heavy / difficult | Der Koffer ist zu schwer. = The suitcase is too heavy.
die-strassenbahn | die Straßenbahn | tram | Die Straßenbahn fährt zum Zentrum. = The tram goes to the centre.
das-taxi | das Taxi | taxi | Ich nehme ein Taxi. = I'll take a taxi.
ich-brauche | Ich brauche … | I need … | Ich brauche eine Fahrkarte. = I need a ticket. / Brauchst du Hilfe? = Do you need help? | construction
wie-lange | Wie lange dauert das? | How long does it take? | Wie lange dauert die Fahrt? = How long does the journey take?
die-fahrt | die Fahrt | ride / journey | Die Fahrt dauert eine Stunde. = The ride takes an hour.
besetzt | besetzt | taken / occupied | Ist der Platz besetzt? = Is this seat taken?
der-platz | der Platz | seat / square / place | Hier ist noch ein Platz frei. = There's still a seat free here.
`,
  },
  {
    id: "uhrzeit",
    level: "A1",
    villager: "jonas",
    title: { t: "Uhrzeit & Alltag", en: "Time & daily life" },
    about: "Telling the time, days of the week and your daily routine.",
    items: String.raw`
wie-spaet | Wie spät ist es? | What time is it? | Entschuldigung, wie spät ist es? = Excuse me, what time is it?
es-ist-uhr | Es ist … Uhr. | It's … o'clock. | Es ist drei Uhr. = It's three o'clock. | say: Es ist zehn Uhr. = It's ten o'clock. | accept: ^es ist [\p{L}\p{N}]+ uhr
um | um … Uhr | at … o'clock | Um sieben Uhr frühstücke ich. = I have breakfast at seven. | say: um acht Uhr = at eight o'clock | accept: ^um [\p{L}\p{N}]+ uhr$
halb | halb | half (to) | Es ist halb vier. = It's half past three.
viertel-nach | Viertel nach … | quarter past … | Es ist Viertel nach zwei. = It's quarter past two.
viertel-vor | Viertel vor … | quarter to … | Es ist Viertel vor acht. = It's quarter to eight.
die-minute | die Minute | minute | Warte eine Minute! = Wait a minute! | forms: Minuten
die-stunde | die Stunde | hour / lesson | Der Film dauert zwei Stunden. = The film lasts two hours. | forms: Stunden
der-tag | der Tag | day | Schönen Tag noch! = Have a nice day! | forms: Tage, Tagen
die-woche | die Woche | week | Bis nächste Woche! = See you next week! | forms: Wochen
montag | Montag | Monday | Am Montag arbeite ich. = On Monday I work.
dienstag | Dienstag | Tuesday | Am Dienstag habe ich Zeit. = On Tuesday I have time.
mittwoch | Mittwoch | Wednesday | Mittwoch ist Markt. = Wednesday is market day.
donnerstag | Donnerstag | Thursday | Am Donnerstag gehe ich schwimmen. = On Thursday I go swimming.
freitag | Freitag | Friday | Endlich Freitag! = Finally Friday!
samstag | Samstag | Saturday | Am Samstag schlafe ich lange. = On Saturday I sleep late.
sonntag | Sonntag | Sunday | Am Sonntag besuche ich Oma. = On Sunday I visit grandma.
das-wochenende | das Wochenende | weekend | Schönes Wochenende! = Have a nice weekend!
heute | heute | today | Heute ist Montag. = Today is Monday.
morgen | morgen | tomorrow | Morgen habe ich frei. = Tomorrow I'm off.
gestern | gestern | yesterday | Gestern war Sonntag. = Yesterday was Sunday.
der-morgen | der Morgen | morning | Am Morgen trinke ich Kaffee. = In the morning I drink coffee.
der-mittag | der Mittag | midday | Am Mittag esse ich. = At midday I eat.
der-nachmittag | der Nachmittag | afternoon | Am Nachmittag gehe ich spazieren. = In the afternoon I go for a walk.
der-abend | der Abend | evening | Am Abend lese ich. = In the evening I read.
die-nacht | die Nacht | night | In der Nacht ist es still. = At night it's quiet. | forms: Nächte
aufstehen | aufstehen | to get up | Ich stehe um sechs Uhr auf. = I get up at six o'clock.
fruehstuecken | frühstücken | to have breakfast | Wir frühstücken zusammen. = We have breakfast together.
arbeiten | arbeiten | to work | Ich arbeite von neun bis fünf. = I work from nine to five.
schlafen | schlafen | to sleep | Ich schlafe acht Stunden. = I sleep eight hours.
duschen | duschen | to shower | Ich dusche am Morgen. = I shower in the morning.
nach-hause | nach Hause | home (going) | Ich gehe jetzt nach Hause. = I'm going home now.
zu-hause | zu Hause | at home | Heute bleibe ich zu Hause. = Today I'm staying at home.
immer | immer | always | Jonas ist immer pünktlich. = Jonas is always on time.
oft | oft | often | Ich trinke oft Tee. = I often drink tea.
manchmal | manchmal | sometimes | Manchmal koche ich. = Sometimes I cook.
nie | nie | never | Ich esse nie Fleisch. = I never eat meat.
jeden-tag | jeden Tag | every day | Ich lerne jeden Tag Deutsch. = I learn German every day.
spaet | spät | late | Es ist schon spät. = It's already late.
frueh | früh | early | Ich stehe früh auf. = I get up early.
jetzt | jetzt | now | Jetzt habe ich Zeit. = Now I have time.
bald | bald | soon | Der Zug kommt bald. = The train is coming soon.
die-zeit | die Zeit | time | Hast du Zeit? = Do you have time?
v2-heute | Heute arbeite ich zu Hause. | Today I'm working at home. | Morgen fährt sie nach Freiburg. = Tomorrow she's going to Freiburg. / Heute kocht Franz. = Today Franz is cooking. | construction | accept: ^(heute|morgen|am \p{L}+) \p{L}+ (ich|du|er|sie|wir|ihr)\b | note: The verb stays in second place: when "heute" comes first, the person moves after the verb.
`,
  },
  {
    id: "einkaufen",
    level: "A1",
    villager: "marie",
    title: { t: "Einkaufen", en: "Shopping" },
    about: "At the market: asking for things, how much, how many, paying.",
    items: String.raw`
einkaufen | einkaufen | to go shopping | Ich gehe heute einkaufen. = I'm going shopping today.
kaufen | kaufen | to buy | Ich kaufe Äpfel. = I'm buying apples.
der-markt | der Markt | market | Der Markt ist am Mittwoch. = The market is on Wednesday.
der-laden | der Laden | shop | Der Laden ist zu. = The shop is closed.
der-supermarkt | der Supermarkt | supermarket | Der Supermarkt ist groß. = The supermarket is big.
was-darf-es-sein | Was darf es sein? | What can I get you? | Guten Morgen! Was darf es sein? = Good morning! What can I get you?
ich-nehme | Ich nehme … | I'll take … | Ich nehme ein Kilo Äpfel. = I'll take a kilo of apples. | construction | say: Ich nehme die Äpfel. = I'll take the apples. | accept: ^ich nehme\b
was-kostet-das | Was kostet das? | How much does that cost? | Was kostet das Brot? = How much is the bread?
das-kilo | das Kilo | kilo | Ein Kilo Tomaten, bitte. = A kilo of tomatoes, please.
das-gramm | das Gramm | gram | Zweihundert Gramm Käse, bitte. = Two hundred grams of cheese, please.
die-flasche | die Flasche | bottle | Eine Flasche Wasser, bitte. = A bottle of water, please. | forms: Flaschen
die-tuete | die Tüte | bag | Brauchen Sie eine Tüte? = Do you need a bag?
sonst-noch | Sonst noch etwas? | Anything else? | Sonst noch etwas? – Nein, danke. = Anything else? – No, thanks.
das-ist-alles | Das ist alles. | That's all. | Nein, danke, das ist alles. = No thanks, that's all.
die-birne | die Birne | pear | Die Birnen sind süß. = The pears are sweet. | forms: Birnen
die-kirsche | die Kirsche | cherry | Die Kirschen sind reif. = The cherries are ripe. | forms: Kirschen
die-erdbeere | die Erdbeere | strawberry | Ich liebe Erdbeeren. = I love strawberries. | forms: Erdbeeren
die-zwiebel | die Zwiebel | onion | Eine Zwiebel, bitte. = One onion, please. | forms: Zwiebeln
die-karotte | die Karotte | carrot | Die Karotten sind frisch. = The carrots are fresh. | forms: Karotten
das-geld | das Geld | money | Ich habe kein Geld dabei. = I don't have any money on me.
bar | bar | (in) cash | Ich zahle bar. = I'll pay cash.
mit-karte | mit Karte | by card | Kann ich mit Karte zahlen? = Can I pay by card?
zahlen | zahlen | to pay | Wo kann ich zahlen? = Where can I pay?
kosten | kosten | to cost | Die Äpfel kosten zwei Euro. = The apples cost two euros.
das-angebot | das Angebot | special offer | Die Erdbeeren sind heute im Angebot. = The strawberries are on offer today.
geoeffnet | geöffnet | open | Der Laden ist bis sechs geöffnet. = The shop is open until six.
geschlossen | geschlossen | closed | Am Sonntag ist alles geschlossen. = On Sunday everything is closed.
auf-zu | auf / zu | open / closed | Ist die Bäckerei noch auf? = Is the bakery still open?
brauchen | brauchen | to need | Wir brauchen Milch. = We need milk.
suchen | suchen | to look for | Ich suche Tomaten. = I'm looking for tomatoes.
haben-sie | Haben Sie …? | Do you have …? | Haben Sie Kirschen? = Do you have cherries? | construction
gibt-es | Gibt es …? | Is there …? | Gibt es hier einen Supermarkt? = Is there a supermarket here? | construction
etwas | etwas | something | Ich möchte etwas kaufen. = I'd like to buy something.
alles | alles | everything | Hier ist alles billig. = Everything is cheap here.
mehr | mehr | more | Ich brauche mehr Zeit. = I need more time.
genug | genug | enough | Das ist genug, danke. = That's enough, thanks.
die-einkaufsliste | die Einkaufsliste | shopping list | Wo ist meine Einkaufsliste? = Where's my shopping list?
ein-halbes-kilo | ein halbes Kilo | half a kilo | Ein halbes Kilo Kirschen, bitte. = Half a kilo of cherries, please.
billiger | billiger | cheaper | Die Birnen sind billiger. = The pears are cheaper.
der-korb | der Korb | basket | Der Korb ist voll. = The basket is full.
voll | voll | full | Der Bus ist voll. = The bus is full.
leer | leer | empty | Die Flasche ist leer. = The bottle is empty.
`,
  },
  {
    id: "wohnen",
    level: "A1",
    villager: "hilde",
    title: { t: "Zuhause", en: "At home" },
    about: "Rooms, furniture and where things are.",
    items: String.raw`
das-haus | das Haus | house | Das Haus ist alt. = The house is old. | forms: Häuser
die-wohnung | die Wohnung | apartment | Die Wohnung ist klein. = The apartment is small. | forms: Wohnungen
das-zimmer | das Zimmer | room | Mein Zimmer ist hell. = My room is bright. | forms: Zimmern
die-kueche | die Küche | kitchen | Die Küche ist groß. = The kitchen is big.
das-bad | das Bad | bathroom | Das Bad ist oben. = The bathroom is upstairs.
das-schlafzimmer | das Schlafzimmer | bedroom | Das Schlafzimmer ist ruhig. = The bedroom is quiet.
das-wohnzimmer | das Wohnzimmer | living room | Wir sitzen im Wohnzimmer. = We're sitting in the living room.
der-garten | der Garten | garden | Im Garten wachsen Blumen. = Flowers grow in the garden.
die-tuer | die Tür | door | Mach bitte die Tür zu. = Please close the door. | forms: Türen
das-fenster | das Fenster | window | Das Fenster ist offen. = The window is open.
das-dach | das Dach | roof | Das Dach ist sehr groß. = The roof is very big.
die-treppe | die Treppe | stairs | Die Treppe ist steil. = The stairs are steep.
der-stuhl | der Stuhl | chair | Setz dich auf den Stuhl. = Sit on the chair. | forms: Stühle
das-bett | das Bett | bed | Das Bett ist bequem. = The bed is comfortable. | forms: Betten
das-sofa | das Sofa | sofa | Die Katze schläft auf dem Sofa. = The cat is sleeping on the sofa.
der-schrank | der Schrank | cupboard / wardrobe | Die Teller sind im Schrank. = The plates are in the cupboard.
die-lampe | die Lampe | lamp | Die Lampe ist neu. = The lamp is new.
der-kuehlschrank | der Kühlschrank | fridge | Die Milch ist im Kühlschrank. = The milk is in the fridge.
der-herd | der Herd | stove | Die Suppe ist auf dem Herd. = The soup is on the stove.
der-boden | der Boden | floor | Der Boden ist aus Holz. = The floor is made of wood.
die-wand | die Wand | wall | An der Wand hängt eine Uhr. = A clock hangs on the wall. | forms: Wände
oben | oben | upstairs / above | Mein Zimmer ist oben. = My room is upstairs.
unten | unten | downstairs / below | Die Küche ist unten. = The kitchen is downstairs.
hell | hell | bright | Das Zimmer ist schön hell. = The room is nice and bright.
dunkel | dunkel | dark | Im Keller ist es dunkel. = It's dark in the cellar.
gemuetlich | gemütlich | cosy | Die Küche ist gemütlich. = The kitchen is cosy.
ruhig | ruhig | quiet / calm | Hier ist es ruhig. = It's quiet here.
schoen | schön | beautiful / nice | Dein Haus ist schön! = Your house is beautiful!
neu | neu | new | Die Küche ist ganz neu. = The kitchen is brand new.
bequem | bequem | comfortable | Der Stuhl ist bequem. = The chair is comfortable.
in | in | in | Die Katze ist in der Küche. = The cat is in the kitchen.
auf | auf | on | Das Buch liegt auf dem Tisch. = The book is on the table.
unter | unter | under | Der Hund liegt unter dem Tisch. = The dog is lying under the table.
neben | neben | next to | Das Bad ist neben der Küche. = The bathroom is next to the kitchen.
wo-ist | Wo ist …? | Where is …? | Wo ist die Katze? = Where's the cat? / Wo ist mein Schlüssel? = Where's my key? | construction
die-miete | die Miete | rent | Die Miete ist hoch. = The rent is high.
putzen | putzen | to clean | Ich putze die Küche. = I'm cleaning the kitchen.
aufraeumen | aufräumen | to tidy up | Ich räume mein Zimmer auf. = I'm tidying my room.
der-schluessel | der Schlüssel | key | Der Schlüssel ist in der Tasche. = The key is in the bag.
der-keller | der Keller | cellar | Die Kartoffeln sind im Keller. = The potatoes are in the cellar.
der-balkon | der Balkon | balcony | Wir sitzen auf dem Balkon. = We're sitting on the balcony.
das-dorf | das Dorf | village | Tannenau ist ein kleines Dorf. = Tannenau is a small village.
die-stadt | die Stadt | town / city | Die Stadt ist groß. = The city is big.
`,
  },
  {
    id: "weg",
    level: "A1",
    villager: "lena",
    title: { t: "Nach dem Weg fragen", en: "Asking the way" },
    about: "Places in town, left and right, near and far.",
    items: String.raw`
wo-ist-der-bahnhof | Wo ist der Bahnhof? | Where is the station? | Entschuldigung, wo ist der Bahnhof? = Excuse me, where is the station? / Wo ist die Toilette? = Where is the toilet? | accept: ^(entschuldigung )?wo ist (der|die|das) \p{L}+
wie-komme-ich | Wie komme ich zum …? | How do I get to …? | Wie komme ich zum Bahnhof? = How do I get to the station? | say: Wie komme ich zum Marktplatz? = How do I get to the market square? | accept: ^wie komme ich (zum|zur|nach) \p{L}+
geradeaus | geradeaus | straight ahead | Gehen Sie geradeaus. = Go straight ahead.
links | links | left | Dann links. = Then left.
rechts | rechts | right | Die Bäckerei ist rechts. = The bakery is on the right.
die-strasse | die Straße | street | Die Straße ist lang. = The street is long. | forms: Straßen
die-ecke | die Ecke | corner | An der Ecke ist ein Café. = There's a café on the corner.
die-kreuzung | die Kreuzung | crossroads | An der Kreuzung rechts. = Right at the crossroads.
die-ampel | die Ampel | traffic light | An der Ampel links. = Left at the traffic light.
die-bruecke | die Brücke | bridge | Gehen Sie über die Brücke. = Go over the bridge.
der-marktplatz | der Marktplatz | market square | Der Marktplatz ist in der Mitte. = The market square is in the middle.
die-kirche | die Kirche | church | Die Kirche ist alt. = The church is old.
die-kapelle | die Kapelle | chapel | Die Kapelle steht auf dem Berg. = The chapel stands on the hill.
die-post | die Post | post office | Die Post ist neben der Bank. = The post office is next to the bank.
die-bank | die Bank | bank / bench | Die Bank ist um die Ecke. = The bank is around the corner.
die-apotheke | die Apotheke | pharmacy | Gibt es hier eine Apotheke? = Is there a pharmacy here?
die-toilette | die Toilette | toilet | Wo ist die Toilette, bitte? = Where's the toilet, please?
das-hotel | das Hotel | hotel | Das Hotel ist am See. = The hotel is by the lake.
das-restaurant | das Restaurant | restaurant | Das Restaurant ist heute zu. = The restaurant is closed today.
das-museum | das Museum | museum | Das Museum ist sehr interessant. = The museum is very interesting.
der-park | der Park | park | Im Park spielen Kinder. = Children are playing in the park.
die-schule | die Schule | school | Die Schule beginnt um acht. = School starts at eight.
nah | nah | near | Der Bahnhof ist ganz nah. = The station is very close.
weit | weit | far | Ist es weit? – Nein, nur fünf Minuten. = Is it far? – No, only five minutes.
gegenueber | gegenüber | opposite | Die Post ist gegenüber. = The post office is opposite.
hinter | hinter | behind | Der Garten ist hinter dem Haus. = The garden is behind the house.
vor | vor | in front of | Vor dem Café steht ein Fahrrad. = There's a bike in front of the café.
zwischen | zwischen | between | Die Bank ist zwischen der Post und dem Café. = The bank is between the post office and the café.
dort | dort | there | Dort drüben ist die Kirche. = The church is over there.
die-karte | die Karte | map / card | Hast du eine Karte? = Do you have a map?
der-weg | der Weg | way / path | Ich kenne den Weg. = I know the way.
ich-suche | Ich suche … | I'm looking for … | Ich suche die Post. = I'm looking for the post office. | construction
ist-das-weit | Ist das weit? | Is that far? | Ist das weit von hier? = Is that far from here?
um-die-ecke | um die Ecke | around the corner | Das Café ist gleich um die Ecke. = The café is just around the corner.
die-erste-strasse | die erste Straße links | the first street on the left | Nehmen Sie die erste Straße links. = Take the first street on the left.
abbiegen | abbiegen | to turn | An der Kirche rechts abbiegen. = Turn right at the church.
ueber | über | over / across | Wir gehen über den Marktplatz. = We're walking across the market square.
bis-zum | bis zum … | as far as … | Gehen Sie bis zum Brunnen. = Go as far as the fountain.
der-brunnen | der Brunnen | fountain / well | Der Brunnen ist auf dem Marktplatz. = The fountain is on the market square.
verlaufen | Ich habe mich verlaufen. | I'm lost. | Hilfe, ich habe mich verlaufen! = Help, I'm lost!
`,
  },
  {
    id: "kleidung",
    level: "A1",
    villager: "marie",
    title: { t: "Kleidung & Farben", en: "Clothes & colours" },
    about: "What you wear, sizes, colours and saying what you like.",
    items: String.raw`
die-kleidung | die Kleidung | clothes | Marie verkauft auch Kleidung. = Marie also sells clothes.
das-hemd | das Hemd | shirt | Das Hemd ist blau. = The shirt is blue.
das-t-shirt | das T-Shirt | T-shirt | Ich trage ein weißes T-Shirt. = I'm wearing a white T-shirt.
die-hose | die Hose | trousers | Die Hose ist zu lang. = The trousers are too long.
der-rock | der Rock | skirt | Der Rock ist schön. = The skirt is pretty.
das-kleid | das Kleid | dress | Das Kleid ist rot. = The dress is red.
die-jacke | die Jacke | jacket | Nimm eine Jacke mit! = Take a jacket with you!
der-pullover | der Pullover | sweater | Der Pullover ist warm. = The sweater is warm.
der-mantel | der Mantel | coat | Im Winter trage ich einen Mantel. = In winter I wear a coat.
die-schuhe | die Schuhe | shoes | Die Schuhe sind neu. = The shoes are new. | forms: Schuh
die-socken | die Socken | socks | Die Socken sind bunt. = The socks are colourful.
der-hut | der Hut | hat | Hilde trägt einen Hut. = Hilde is wearing a hat.
die-muetze | die Mütze | woolly hat / cap | Die Mütze ist warm. = The hat is warm.
der-schal | der Schal | scarf | Der Schal ist lang. = The scarf is long.
tragen | tragen | to wear / to carry | Was trägst du heute? = What are you wearing today?
anprobieren | anprobieren | to try on | Kann ich das anprobieren? = Can I try this on?
die-groesse | die Größe | size | Welche Größe haben Sie? = What size are you?
passen | passen | to fit | Die Hose passt gut. = The trousers fit well.
zu-gross | zu groß | too big | Die Jacke ist zu groß. = The jacket is too big.
zu-klein | zu klein | too small | Die Schuhe sind zu klein. = The shoes are too small.
die-farbe | die Farbe | colour | Welche Farbe magst du? = Which colour do you like? | forms: Farben
rot | rot | red | Die Kirschen sind rot. = The cherries are red.
blau | blau | blue | Der See ist blau. = The lake is blue.
gruen | grün | green | Die Tannen sind grün. = The firs are green.
gelb | gelb | yellow | Die Blume ist gelb. = The flower is yellow.
weiss | weiß | white | Der Schnee ist weiß. = The snow is white.
schwarz | schwarz | black | Die Katze ist schwarz. = The cat is black.
braun | braun | brown | Der Hund ist braun. = The dog is brown.
grau | grau | grey | Der Himmel ist grau. = The sky is grey.
rosa | rosa | pink | Das Kleid ist rosa. = The dress is pink.
orange | orange | orange | Die Jacke ist orange. = The jacket is orange.
lila | lila | purple | Mein Schal ist lila. = My scarf is purple.
bunt | bunt | colourful | Der Markt ist bunt. = The market is colourful.
welche | welcher / welche / welches | which | Welche Jacke nimmst du? = Which jacket are you taking?
gefaellt-mir | Das gefällt mir. | I like that. | Das Kleid gefällt mir. = I like the dress. / Gefällt dir die Farbe? = Do you like the colour?
steht-dir | Das steht dir gut. | That suits you. | Der Hut steht dir gut! = The hat suits you!
kaputt | kaputt | broken | Mein Schuh ist kaputt. = My shoe is broken.
modisch | modisch | fashionable | Das ist sehr modisch. = That's very fashionable.
die-tasche | die Tasche | bag | Die Tasche ist aus Leder. = The bag is made of leather.
die-brille | die Brille | glasses | Wo ist meine Brille? = Where are my glasses?
`,
  },
];
