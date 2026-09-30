import type { UnitSource } from "../dsl";

// Vietnamese A1, in Northern (Hanoi) Vietnamese: bố not ba, bát not chén,
// cốc not ly, nghìn not ngàn, quả not trái, vâng not dạ.
// Format: slug | target | English | example = English / … | options (see ../dsl).

export const a1: UnitSource[] = [
  {
    id: "xin-chao",
    level: "A1",
    villager: "lan",
    title: { t: "Xin chào!", en: "Hello!" },
    about: "Greetings, thanks, sorry, yes and no.",
    items: String.raw`
xin-chao | Xin chào! | Hello! | Xin chào, Lan! = Hello, Lan! / Xin chào các bạn! = Hello, everyone!
chao-ban | Chào bạn! | Hi! | Chào bạn, bạn khỏe không? = Hi, how are you?
cam-on | Cảm ơn! | Thank you! | Cảm ơn bạn! = Thank you! / Cảm ơn nhiều! = Thanks a lot!
khong-co-gi | Không có gì. | You're welcome. | Cảm ơn! – Không có gì. = Thanks! – You're welcome.
vang | vâng | yes (polite) | Vâng, cảm ơn. = Yes, thank you. | note: "Vâng" is the polite yes of the North.
khong | không | no | Không, cảm ơn. = No, thanks.
xin-loi | Xin lỗi! | Sorry! / Excuse me! | Xin lỗi, tôi không biết. = Sorry, I don't know.
khong-sao | Không sao. | It's okay. / No problem. | Xin lỗi! – Không sao. = Sorry! – It's okay.
tam-biet | Tạm biệt! | Goodbye! | Tạm biệt, hẹn gặp lại! = Goodbye, see you again!
hen-gap-lai | Hẹn gặp lại! | See you again! | Hẹn gặp lại bạn! = See you again!
ban-khoe-khong | Bạn khỏe không? | How are you? | Chào Lan, bạn khỏe không? = Hi Lan, how are you?
toi-khoe | Tôi khỏe, cảm ơn. | I'm well, thanks. | Tôi khỏe, cảm ơn. Còn bạn? = I'm well, thanks. And you?
con-ban | Còn bạn? | And you? | Tôi khỏe. Còn bạn? = I'm well. And you?
toi-khong-biet | Tôi không biết. | I don't know. | Xin lỗi, tôi không biết. = Sorry, I don't know.
day-la | Đây là … | This is … | Đây là Lan. = This is Lan. / Đây là thuyền của tôi. = This is my boat. | construction
oi | … ơi! | Hey …! (calling someone) | Lan ơi! = Hey, Lan! / Bác ơi! = Excuse me! (to an older man) | note: Put "ơi" after a name or a title to call someone kindly.
tot-qua | Tốt quá! | Great! | Tốt quá, cảm ơn bạn! = Great, thank you!
`,
  },
  {
    id: "gioi-thieu",
    level: "A1",
    villager: "lan",
    title: { t: "Giới thiệu", en: "Introductions" },
    about: "Your name, where you're from, where you live, and who's who: tôi, bạn, anh, chị, em.",
    items: String.raw`
toi-ten-la | Tôi tên là … | My name is … | Tôi tên là Lan. = My name is Lan. / Tôi tên là Minh. = My name is Minh. | say: Tôi tên là Caleb. = My name is {name}. | accept: ^(xin chào |chào bạn )?(tôi tên là|tên tôi là|tôi là|mình tên là) \p{L}+
ban-ten-la-gi | Bạn tên là gì? | What's your name? | Chào bạn! Bạn tên là gì? = Hi! What's your name?
rat-vui | Rất vui được gặp bạn! | Nice to meet you! | Tôi tên là Mai. – Rất vui được gặp bạn! = My name is Mai. – Nice to meet you!
toi-la | Tôi là … | I am … | Tôi là Lan. = I'm Lan. / Tôi là sinh viên. = I'm a student. | construction
ban-la-nguoi-nuoc-nao | Bạn là người nước nào? | Where are you from? | Bạn là người nước nào, Minh? = Where are you from, Minh?
toi-la-nguoi | Tôi là người … | I'm … (nationality) | Tôi là người Mỹ. = I'm American. / Tôi là người Anh. = I'm English. | accept: ^tôi là người \p{L}+
ban-song-o-dau | Bạn sống ở đâu? | Where do you live? | Bây giờ bạn sống ở đâu? = Where do you live now?
toi-song-o | Tôi sống ở … | I live in … | Tôi sống ở Cát Bà. = I live on Cát Bà. / Tôi sống ở Hà Nội. = I live in Hanoi. | accept: ^tôi sống ở \p{L}+
tieng-viet | tiếng Việt | Vietnamese (the language) | Tôi học tiếng Việt. = I'm learning Vietnamese.
ban-noi-tieng-anh | Bạn có nói tiếng Anh không? | Do you speak English? | Xin lỗi, bạn có nói tiếng Anh không? = Sorry, do you speak English?
mot-chut | Tôi nói một chút tiếng Việt. | I speak a little Vietnamese. | Tôi nói một chút tiếng Việt thôi. = I only speak a little Vietnamese.
noi-lai | Bạn nói lại được không? | Can you say that again? | Xin lỗi, bạn nói lại được không? = Sorry, can you say that again?
noi-cham | Bạn nói chậm được không? | Can you speak slowly? | Xin lỗi, bạn nói chậm được không? = Sorry, can you speak slowly?
toi | tôi | I / me | Tôi là Lan. = I'm Lan.
ban | bạn | you / friend | Bạn là ai? = Who are you? / Đây là bạn tôi. = This is my friend.
anh | anh | you (to a young man) / older brother | Anh tên là gì? = What's your name? (to a man) | note: Vietnamese picks "you" by age: anh for a man a bit older than you, chị for a woman.
chi | chị | you (to a young woman) / older sister | Chị tên là gì? = What's your name? (to a woman)
em | em | you (to someone younger) / younger sibling | Em tên là gì? = What's your name? (to someone younger)
`,
  },
  {
    id: "quan-pho",
    level: "A1",
    villager: "hung",
    title: { t: "Ở quán phở", en: "At the pho shop" },
    about: "Ordering food and drink: phở, cà phê, trà đá, and paying the bill.",
    items: String.raw`
pho | phở | pho (noodle soup) | Phở ở đây rất ngon! = The pho here is really good!
pho-bo | phở bò | beef pho | Tôi thích phở bò. = I like beef pho.
pho-ga | phở gà | chicken pho | Hôm nay tôi ăn phở gà. = Today I'm having chicken pho.
bat | bát | bowl | Một bát phở, bác ơi! = One bowl of pho, please! | note: Northerners say "bát"; in the South a bowl is "tô" or "chén".
cho-toi | Cho tôi … | … please (I'd like …) | Cho tôi một bát phở. = A bowl of pho, please. / Cho tôi một cốc trà đá. = A glass of iced tea, please. | construction | accept: ^(bác ơi )?cho (tôi|cháu|em) .+
ca-phe | cà phê | coffee | Cà phê ở Việt Nam rất ngon. = Coffee in Vietnam is really good.
ca-phe-sua-da | cà phê sữa đá | iced milk coffee | Cho tôi một cốc cà phê sữa đá. = An iced milk coffee, please.
tra-da | trà đá | iced tea | Một cốc trà đá, bác ơi! = A glass of iced tea, please!
coc | cốc | glass / cup | Một cốc nước, bác ơi! = A glass of water, please! | note: Northerners say "cốc"; in the South it's "ly".
nuoc | nước | water | Cho tôi một chai nước. = A bottle of water, please.
banh-mi | bánh mì | bread / banh mi | Tôi ăn bánh mì. = I'm eating a banh mi.
com | cơm | rice / a meal | Bạn ăn cơm chưa? = Have you eaten yet?
an | ăn | to eat | Bạn muốn ăn gì? = What would you like to eat?
uong | uống | to drink | Bạn uống gì? = What will you drink?
toi-muon | Tôi muốn … | I want … | Tôi muốn ăn phở. = I want to eat pho. / Tôi muốn uống cà phê. = I want to drink coffee. | construction
ngon-qua | Ngon quá! | Delicious! | Phở ngon quá! = The pho is delicious!
khong-cay | Không cay nhé. | Not spicy, please. | Cho tôi một bát phở, không cay nhé. = A bowl of pho, not spicy please.
no-roi | Tôi no rồi. | I'm full. | Cảm ơn bác, tôi no rồi. = Thank you, I'm full.
tinh-tien | Tính tiền! | The bill, please! | Bác ơi, tính tiền! = Excuse me, the bill please!
`,
  },
  {
    id: "o-cho",
    level: "A1",
    villager: "mai",
    title: { t: "Ở chợ", en: "At the market" },
    about: "Numbers one to ten, hundreds and thousands, asking prices and haggling.",
    items: String.raw`
so-mot | một | one | Một cốc cà phê. = One coffee.
so-hai | hai | two | Hai bát phở. = Two bowls of pho.
so-ba | ba | three | Ba quả xoài. = Three mangoes.
so-bon | bốn | four | Bốn người. = Four people.
so-nam | năm | five | Năm nghìn đồng. = Five thousand dong.
so-sau | sáu | six | Sáu quả chuối. = Six bananas.
so-bay | bảy | seven | Bảy nghìn đồng. = Seven thousand dong.
so-tam | tám | eight | Tám quả trứng. = Eight eggs.
so-chin | chín | nine | Chín giờ. = Nine o'clock.
so-muoi | mười | ten | Mười nghìn đồng. = Ten thousand dong.
tram | trăm | hundred | Một trăm nghìn đồng. = One hundred thousand dong.
nghin | nghìn | thousand | Hai mươi nghìn đồng. = Twenty thousand dong. | note: Northerners say "nghìn"; in the South it's "ngàn".
dong | đồng | dong (Vietnamese money) | Năm mươi nghìn đồng. = Fifty thousand dong.
bao-nhieu-tien | Bao nhiêu tiền? | How much is it? | Cái này bao nhiêu tiền? = How much is this?
cai-nay | cái này | this one | Tôi lấy cái này. = I'll take this one. | chunk
dat-qua | Đắt quá! | Too expensive! | Đắt quá, chị ơi! = That's too expensive!
re | rẻ | cheap | Ở chợ rất rẻ. = It's cheap at the market.
bot-di | Bớt đi! | Make it cheaper! | Bớt đi, chị ơi! = Come on, a bit cheaper!
toi-lay | Tôi lấy … | I'll take … | Tôi lấy hai quả xoài. = I'll take two mangoes. / Tôi lấy cái này. = I'll take this one. | construction
co-khong | Có … không? | Do you have …? | Chị có chuối không? = Do you have bananas? / Có cà phê không? = Is there coffee? | construction
xoai | quả xoài | mango | Quả xoài này ngọt lắm. = This mango is very sweet. | note: Northerners count fruit with "quả"; in the South it's "trái".
chuoi | quả chuối | banana | Chị ơi, chuối bao nhiêu tiền? = How much are the bananas?
thanh-long | quả thanh long | dragon fruit | Thanh long rất đẹp. = Dragon fruit is very pretty.
`,
  },
  {
    id: "gia-dinh",
    level: "A1",
    villager: "son",
    title: { t: "Gia đình", en: "Family" },
    about: "Family, ages, and who's who in a Vietnamese family.",
    items: String.raw`
gia-dinh | gia đình | family | Gia đình tôi sống ở Cát Bà. = My family lives on Cát Bà.
bo | bố | dad | Bố tôi là ngư dân. = My dad is a fisherman. | note: Northerners say "bố"; in the South it's "ba".
me | mẹ | mum | Mẹ tôi bán cá ở chợ. = My mum sells fish at the market.
ong | ông | grandfather / you (to an old man) | Ông tôi bảy mươi tuổi. = My grandfather is seventy.
ba | bà | grandmother / you (to an old woman) | Bà ơi, bà khỏe không? = Grandma, how are you?
anh-trai | anh trai | older brother | Anh trai tôi ở Hà Nội. = My older brother is in Hanoi.
chi-gai | chị gái | older sister | Chị gái tôi là giáo viên. = My older sister is a teacher.
em-trai | em trai | younger brother | Em trai tôi mười tuổi. = My younger brother is ten.
em-gai | em gái | younger sister | Tôi có một em gái. = I have a younger sister.
con | con | child | Tôi có hai con. = I have two children.
chau | cháu | grandchild | Đây là cháu tôi. = This is my grandchild.
vo | vợ | wife | Vợ tôi tên là Hoa. = My wife's name is Hoa.
chong | chồng | husband | Chồng tôi là ngư dân. = My husband is a fisherman.
nguoi | người | person / people | Gia đình tôi có năm người. = There are five people in my family.
toi-co | Tôi có … | I have … | Tôi có một em gái. = I have a younger sister. / Tôi có hai con. = I have two children. | construction
anh-chi-em | Bạn có anh chị em không? | Do you have brothers and sisters? | Bạn có anh chị em không? – Có, tôi có một anh trai. = Do you have brothers and sisters? – Yes, I have an older brother.
bao-nhieu-tuoi | Bạn bao nhiêu tuổi? | How old are you? | Xin lỗi, bạn bao nhiêu tuổi? = Excuse me, how old are you?
tuoi | Tôi … tuổi. | I'm … years old. | Tôi hai mươi tuổi. = I'm twenty. / Tôi ba mươi tuổi. = I'm thirty. | accept: ^tôi \p{L}+( \p{L}+)* tuổi
day-la-ai | Đây là ai? | Who is this? | Đây là ai? – Đây là bố tôi. = Who is this? – This is my dad.
`,
  },
];
