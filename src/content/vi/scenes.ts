import type { DrillKind, SceneBeat, SceneExtras } from "@/lib/game/scenes";

// Key phrases of the Vietnamese course, played out as small exchanges around
// Cát Bà. Phrases without a scene here are still taught, through the standard
// activities. Patterns end with (\s|$) rather than \b, which only knows ASCII
// letters and would stop at "à".

const END = "(\\s|$)";
const CHAO = [`^(xin chào|chào( bạn| anh| chị| em| bác| ông| bà)?)${END}`];
const CAM_ON = [`(cảm ơn|cám ơn)${END}`];
const TAM_BIET = [`^(tạm biệt|hẹn gặp lại|chào nhé)`];

const lan: Record<string, SceneBeat[]> = {
  "xin-chao": [
    {
      situation: "A tourist steps off the boat and waves at you.",
      speaker: "Hương",
      cue: { t: "Xin chào!", en: "Hello!" },
      reaction: { t: "Đảo đẹp quá!", en: "What a beautiful island!" },
      accept: CHAO,
      pitch: 1.2,
    },
    {
      situation: "A boy runs past you along the landing with a fishing rod.",
      speaker: "Nam",
      cue: { t: "Chào bạn!", en: "Hi!" },
      reaction: { t: "Chào! Tôi đi câu cá đây!", en: "Hi! I'm off fishing!" },
      accept: CHAO,
      pitch: 1.45,
    },
  ],
  "cam-on": [
    {
      situation: "Lan hands you a little map of the island.",
      speaker: "Lan",
      cue: { t: "Đây là bản đồ Cát Bà.", en: "Here's a map of Cát Bà." },
      reaction: { t: "Không có gì!", en: "You're welcome!" },
      accept: CAM_ON,
    },
    {
      situation: "A man picks up the bag you dropped and hands it back.",
      speaker: "Tuấn",
      cue: { t: "Túi của bạn đây!", en: "Here's your bag!" },
      reaction: { t: "Không có gì!", en: "You're welcome!" },
      accept: CAM_ON,
      pitch: 0.85,
    },
  ],
  "tam-biet": [
    {
      situation: "The boat is about to leave. Hương waves from the deck.",
      speaker: "Hương",
      cue: { t: "Tạm biệt! Hẹn gặp lại!", en: "Goodbye! See you again!" },
      reaction: { t: "Hẹn gặp lại bạn!", en: "See you again!" },
      accept: TAM_BIET,
      pitch: 1.2,
    },
    {
      situation: "Lan ties up her boat for the evening.",
      speaker: "Lan",
      cue: { t: "Tôi về nhà đây.", en: "I'm heading home now." },
      reaction: { t: "Tạm biệt nhé!", en: "Bye now!" },
      accept: TAM_BIET,
    },
  ],
  "toi-ten-la": [
    {
      situation: "A girl with a backpack sits down next to you on the landing.",
      speaker: "Linh",
      cue: { t: "Chào bạn! Tôi tên là Linh. Bạn tên là gì?", en: "Hi! My name is Linh. What's your name?" },
      reaction: { t: "Rất vui được gặp bạn, {name}!", en: "Nice to meet you, {name}!" },
      accept: ["(tôi tên là|tên tôi là|tôi là|mình tên là) \\p{L}+"],
      pitch: 1.2,
    },
    {
      situation: "Lan takes out her notebook of visitors.",
      speaker: "Lan",
      cue: { t: "Bạn tên là gì?", en: "What's your name?" },
      reaction: { t: "Cảm ơn {name}! Chào mừng bạn đến Cát Bà!", en: "Thank you, {name}! Welcome to Cát Bà!" },
      accept: ["(tôi tên là|tên tôi là|tôi là|mình tên là) \\p{L}+"],
    },
  ],
};

const hung: Record<string, SceneBeat[]> = {
  "cho-toi": [
    {
      situation: "You sit down on a little plastic stool. Bác Hùng wipes the table.",
      speaker: "Bác Hùng",
      cue: { t: "Cháu ăn gì?", en: "What will you have?" },
      reaction: { t: "Được, có ngay!", en: "Sure, coming right up!" },
      expect: { t: "Cho tôi một bát phở.", en: "A bowl of pho, please." },
      accept: ["^(bác ơi )?cho (tôi|cháu|em) "],
    },
    {
      situation: "It's a hot afternoon. Bác Hùng points at the cooler of drinks.",
      speaker: "Bác Hùng",
      cue: { t: "Nóng quá! Cháu uống gì?", en: "So hot! What will you drink?" },
      reaction: { t: "Trà đá đây, mát lắm!", en: "Here's your iced tea, nice and cool!" },
      expect: { t: "Cho tôi một cốc trà đá.", en: "A glass of iced tea, please." },
      accept: ["^(bác ơi )?cho (tôi|cháu|em) "],
    },
  ],
  "ngon-qua": [
    {
      situation: "Bác Hùng watches you take your first spoonful of broth.",
      speaker: "Bác Hùng",
      cue: { t: "Phở thế nào?", en: "How's the pho?" },
      reaction: { t: "Cảm ơn cháu! Ăn nữa đi!", en: "Thank you! Have some more!" },
      accept: ["ngon"],
    },
    {
      situation: "A woman at the next table offers you a spring roll.",
      speaker: "Thảo",
      cue: { t: "Bạn ăn thử đi!", en: "Try some!" },
      reaction: { t: "Đúng không? Tôi làm đấy!", en: "Right? I made them!" },
      accept: ["ngon"],
      pitch: 1.15,
    },
  ],
};

const mai: Record<string, SceneBeat[]> = {
  "bao-nhieu-tien": [
    {
      situation: "You pick up a big yellow mango at Chị Mai's stall.",
      speaker: "Chị Mai",
      cue: { t: "Xoài ngon lắm em ơi!", en: "Very tasty mangoes, dear!" },
      reaction: { t: "Ba mươi nghìn một quả.", en: "Thirty thousand each." },
      accept: ["bao nhiêu"],
    },
    {
      situation: "A boy is selling conical hats from a basket.",
      speaker: "Dũng",
      cue: { t: "Mua nón lá không?", en: "Want to buy a conical hat?" },
      reaction: { t: "Năm mươi nghìn thôi!", en: "Only fifty thousand!" },
      accept: ["bao nhiêu"],
      pitch: 1.4,
    },
  ],
  "dat-qua": [
    {
      situation: "Chị Mai names her price for a dragon fruit with a big smile.",
      speaker: "Chị Mai",
      cue: { t: "Một trăm nghìn một quả!", en: "One hundred thousand each!" },
      reaction: { t: "Thôi được, năm mươi nghìn!", en: "Oh, all right, fifty thousand!" },
      accept: ["đắt"],
    },
    {
      situation: "A man offers you a boat trip around the bay.",
      speaker: "Hải",
      cue: { t: "Năm trăm nghìn một người!", en: "Five hundred thousand a person!" },
      reaction: { t: "Thế ba trăm nghìn nhé?", en: "Three hundred thousand, then?" },
      accept: ["đắt"],
      pitch: 0.9,
    },
  ],
};

const son: Record<string, SceneBeat[]> = {
  "toi-co": [
    {
      situation: "Ông Sơn shows you a photo of his three grandchildren.",
      speaker: "Ông Sơn",
      cue: { t: "Cháu có anh chị em không?", en: "Do you have brothers and sisters?" },
      reaction: { t: "Thế à! Tốt quá!", en: "Really! How nice!" },
      expect: { t: "Tôi có một em gái.", en: "I have a younger sister." },
      branches: [{ when: "^không", reaction: { t: "Không có à? Thế thì cháu là con một.", en: "None? Then you're an only child." } }],
      accept: ["^(tôi|cháu|em) có "],
    },
    {
      situation: "A fisherman's wife asks while she sorts the catch.",
      speaker: "Hoa",
      cue: { t: "Bạn có con không?", en: "Do you have children?" },
      reaction: { t: "Ồ, vui quá!", en: "Oh, how lovely!" },
      expect: { t: "Tôi có hai con.", en: "I have two children." },
      branches: [{ when: "^không", reaction: { t: "Chưa có à? Không sao!", en: "Not yet? That's fine!" } }],
      accept: ["^(tôi|cháu|em) có ", "^không"],
      pitch: 1.1,
    },
  ],
  tuoi: [
    {
      situation: "Ông Sơn squints at you over his net.",
      speaker: "Ông Sơn",
      cue: { t: "Cháu bao nhiêu tuổi?", en: "How old are you?" },
      reaction: { t: "Trẻ quá! Ông bảy mươi tuổi rồi.", en: "So young! I'm seventy already." },
      accept: ["^(tôi|cháu|em) .*tuổi"],
    },
    {
      situation: "A little girl on the landing is counting on her fingers.",
      speaker: "Ngọc",
      cue: { t: "Em sáu tuổi! Còn bạn?", en: "I'm six! And you?" },
      reaction: { t: "Ồ, bạn lớn quá!", en: "Wow, you're so big!" },
      accept: ["^(tôi|cháu|em|mình) .*tuổi"],
      pitch: 1.5,
    },
  ],
};

export const scenes: Record<string, Record<string, SceneBeat[]>> = { lan, hung, mai, son };

// Lan checks introductions by name.
export const drills: Record<string, DrillKind> = {
  "toi-ten-la": "who",
};

export const sceneExtras: SceneExtras = {
  lines: {
    youCanSay: { t: "Bạn có thể trả lời:", en: "You can answer:" },
    answer: { t: "Trả lời đi!", en: "Answer!" },
    whoIsTalking: { t: "Ai đang nói?", en: "Who is talking?" },
    whatDoYouSay: { t: "Bạn trả lời thế nào?", en: "What do you answer?" },
    whichSign: { t: "Biển nào?", en: "Which sign?" },
    whichTrain: { t: "Thuyền nào?", en: "Which boat?" },
    when: { t: "Khi nào?", en: "When?" },
    puzzle: { t: "Ghép hội thoại", en: "Dialogue puzzle" },
    puzzleHelp: { t: "Bấm theo đúng thứ tự!", en: "Tap in the right order!" },
    guestBook: { t: "Sổ khách", en: "Guest book" },
    departures: { t: "Giờ khởi hành", en: "Departures" },
    journey: { t: "Chuyến đi", en: "The journey" },
    riding: { t: "Thuyền đang chạy …", en: "The boat is under way …" },
    keepTalking: { t: "Trả lời nếu bạn muốn …", en: "Reply if you like …" },
    you: { t: "Bạn", en: "You" },
    stamps: { t: "Tem", en: "Stamps" },
  },
  guestNames: ["Hương", "Minh", "Linh", "Tuấn", "Hoa", "Nam", "Trang", "Dũng", "Thảo", "Hải", "Ngọc", "Phương"],
  speakers: {
    Hương: "woman", Linh: "woman", Hoa: "woman", Trang: "woman", Thảo: "woman", Ngọc: "woman", Phương: "woman",
    Minh: "man", Tuấn: "man", Nam: "man", Dũng: "man", Hải: "man",
  },
  nameTag: "Xin chào! Tôi tên là",
  namePattern: "(?:tôi tên là|tên tôi là|mình tên là|tôi là)\\s+(\\p{L}+)",
  departures: [],
  track: { t: "Bến {n}", en: "pier {n}" },
  announcements: [],
  signs: [],
  whereQuestions: [],
  whenSentences: {},
  journey: [],
  calendar: [
    { id: "yesterday", line: { t: "Hôm qua", en: "Yesterday" } },
    { id: "today", line: { t: "Hôm nay", en: "Today" } },
    { id: "tomorrow", line: { t: "Ngày mai", en: "Tomorrow" } },
  ],
};
