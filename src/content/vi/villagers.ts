import type { Line } from "@/lib/game/line";
import type { Villager } from "@/lib/game/villagers";

// The people of Cát Bà. Each teaches a unit or two of the Vietnamese course.
// They call the player what Vietnamese people would: Lan says "bạn", Bác
// Hùng and Ông Sơn say "cháu", Chị Mai says "em".

export const villagers: Villager[] = [
  {
    id: "lan",
    name: "Lan",
    role: { t: "Người chèo đò", en: "boat rower" },
    place: { t: "Bến thuyền", en: "The boat landing" },
    scenarioId: "gap-lan",
    round: "scene",
    stage: "guestbook",
    position: [3.4, 22.4],
    facing: Math.PI * 0.9,
    look: { skin: "#e8b98f", hair: "#1b1512", hairStyle: "braid", shirt: "#f4efe4", pants: "#2b2d42", accent: "#c8412b", hat: "nonla" },
    voicePitch: 1.2,
    voice: "Leda",
    context: "the boat landing of a fishing village on Cát Bà island in northern Vietnam, among the limestone pillars of Lan Hạ Bay (Lan rows visitors across the bay)",
    greetings: [
      { t: "Chào bạn! Hôm nay trời đẹp quá!", en: "Hi! The weather is so lovely today!" },
      { t: "Xin chào! Bạn khỏe không?", en: "Hello! How are you?" },
      { t: "Chào bạn! Đi thuyền không?", en: "Hi! Fancy a boat trip?" },
    ],
    chatter: [
      { t: "Thuyền đi lúc ba giờ.", en: "The boat leaves at three o'clock." },
      { t: "Nhìn kìa, một con chim!", en: "Look, a bird!" },
      { t: "Biển hôm nay đẹp quá!", en: "The sea is beautiful today!" },
    ],
    locked: { t: "Xin chào!", en: "Hello!" },
    teach: { t: "Dạy tôi tiếng Việt nhé!", en: "Teach me some Vietnamese!" },
    talk: { t: "Mình nói chuyện nhé?", en: "Shall we talk?" },
    goodbye: [
      { t: "Hẹn gặp lại!", en: "See you again!" },
      { t: "Tạm biệt nhé!", en: "Bye now!" },
    ],
  },
  {
    id: "hung",
    name: "Bác Hùng",
    role: { t: "Chủ quán phở", en: "pho shop owner" },
    place: { t: "Quán phở Hùng", en: "Hùng's pho shop" },
    scenarioId: "o-quan-pho",
    round: "scene",
    stage: "guestbook",
    position: [-10.4, 7.8],
    facing: Math.PI * 0.35,
    look: { skin: "#d9a47c", hair: "#3a3632", hairStyle: "short", shirt: "#f4efe4", pants: "#3b3a36", accent: "#2f6f4a", apron: "#2f6f4a", scale: 1.06 },
    voicePitch: 0.8,
    voice: "Achird",
    context: "Hùng's pho shop in a fishing village on Cát Bà island in northern Vietnam, a narrow yellow shophouse with little plastic stools out front (Bác Hùng has cooked beef pho for thirty years)",
    greetings: [
      { t: "Chào cháu! Vào ăn phở đi!", en: "Hi there! Come in and have some pho!" },
      { t: "Phở nóng đây, phở nóng đây!", en: "Hot pho here, hot pho here!" },
      { t: "Chào cháu! Hôm nay ăn gì?", en: "Hi there! What are you having today?" },
    ],
    chatter: [
      { t: "Phở nóng đây!", en: "Hot pho here!" },
      { t: "Nước dùng nấu từ sáng sớm.", en: "The broth has been cooking since early morning." },
      { t: "Ăn phở phải có chanh, có ớt.", en: "Pho needs lime and chilli." },
    ],
    locked: { t: "Xin lỗi, quán chưa mở. Cháu nói chuyện với Lan ở bến thuyền trước nhé!", en: "Sorry, we're not open yet. Talk to Lan at the boat landing first!" },
    teach: { t: "Hôm nay có gì ngon?", en: "What's good today?" },
    talk: { t: "Bác ơi, cho cháu gọi món!", en: "Excuse me, I'd like to order!" },
    goodbye: [
      { t: "Lần sau lại đến nhé!", en: "Come again next time!" },
      { t: "Đi cẩn thận nhé!", en: "Take care on the way!" },
    ],
  },
  {
    id: "mai",
    name: "Chị Mai",
    role: { t: "Người bán hàng", en: "market seller" },
    place: { t: "Chợ Cát Bà", en: "Cát Bà market" },
    scenarioId: "di-cho",
    round: "scene",
    stage: "stamps",
    position: [10.8, 6.4],
    facing: -Math.PI * 0.6,
    look: { skin: "#e3ae84", hair: "#1b1512", hairStyle: "bun", shirt: "#e76f51", pants: "#2b2d42", accent: "#f4a261", hat: "nonla" },
    voicePitch: 1.1,
    voice: "Despina",
    context: "the open-air market of a fishing village on Cát Bà island in northern Vietnam (Chị Mai sells mangoes, bananas and dragon fruit, and loves to haggle)",
    greetings: [
      { t: "Mua gì đi em ơi!", en: "Buy something, dear!" },
      { t: "Xoài ngon lắm, rẻ lắm!", en: "Mangoes! Very tasty, very cheap!" },
      { t: "Chào em! Hôm nay mua gì?", en: "Hi! What are you buying today?" },
    ],
    chatter: [
      { t: "Thanh long! Xoài! Chuối!", en: "Dragon fruit! Mangoes! Bananas!" },
      { t: "Rẻ lắm, rẻ lắm!", en: "Very cheap, very cheap!" },
      { t: "Mua hai quả, tặng một quả!", en: "Buy two, get one free!" },
    ],
    locked: { t: "Chị đang bận, lát nữa quay lại nhé!", en: "I'm busy, come back in a bit!" },
    teach: { t: "Cái này tiếng Việt là gì?", en: "What's this in Vietnamese?" },
    talk: { t: "Chị ơi, cho em hỏi!", en: "Excuse me, can I ask something?" },
    goodbye: [
      { t: "Cảm ơn em, lần sau lại mua nhé!", en: "Thanks, come and buy again!" },
      { t: "Tạm biệt em!", en: "Bye!" },
    ],
  },
  {
    id: "son",
    name: "Ông Sơn",
    role: { t: "Ngư dân", en: "fisherman" },
    place: { t: "Nhà ông Sơn", en: "Ông Sơn's house" },
    scenarioId: "gia-dinh-ong-son",
    round: "scene",
    stage: "garden",
    position: [10.4, 19.6],
    facing: Math.PI * 1.2,
    look: { skin: "#c98f68", hair: "#d8d4cc", hairStyle: "short", shirt: "#4f7c8a", pants: "#3b3a36", accent: "#7a8f5a", hat: "pith", beard: true },
    voicePitch: 0.75,
    voice: "Algenib",
    context: "Ông Sơn's house by the water in a fishing village on Cát Bà island in northern Vietnam (an old fisherman who mends his nets and loves talking about his family and grandchildren)",
    greetings: [
      { t: "Chào cháu! Ra đây ngồi với ông!", en: "Hello! Come and sit with me!" },
      { t: "Hôm nay ông bắt được nhiều cá lắm!", en: "I caught lots of fish today!" },
      { t: "Chào cháu! Cháu ăn cơm chưa?", en: "Hello! Have you eaten yet?" },
    ],
    chatter: [
      { t: "Ngày xưa, ông đi biển mỗi ngày.", en: "In the old days, I went to sea every day." },
      { t: "Các cháu ông sắp về rồi.", en: "My grandchildren will be home soon." },
      { t: "Biển hôm nay lặng quá.", en: "The sea is so calm today." },
    ],
    locked: { t: "Ông đang vá lưới. Cháu quay lại sau nhé!", en: "I'm mending my net. Come back later!" },
    teach: { t: "Ông kể về gia đình đi!", en: "Tell me about your family!" },
    talk: { t: "Cháu nói chuyện với ông được không?", en: "Can I talk with you?" },
    goodbye: [
      { t: "Đi cẩn thận nhé, cháu!", en: "Take care!" },
      { t: "Hẹn gặp lại cháu!", en: "See you again!" },
    ],
  },
];

// The first meeting doubles as the tutorial: hover-to-translate is taught in Vietnamese.
export const intro: Line[] = [
  { t: "Xin chào! Chào mừng bạn đến Cát Bà!", en: "Hello! Welcome to Cát Bà!" },
  { t: "Ở đây mọi người nói tiếng Việt.", en: "Everyone speaks Vietnamese here." },
  { t: "Bạn không hiểu một từ? Giữ chuột trên từ đó.", en: "Don't understand a word? Hold the mouse over it." },
  { t: "Tôi tên là Lan. Bạn tên là gì?", en: "My name is Lan. What's your name?" },
];

export const afterName = (name: string): Line[] => [
  { t: `Rất vui được gặp bạn, ${name}!`, en: `Nice to meet you, ${name}!` },
  { t: "Bạn thấy cây đa nhỏ ở đầu làng không? Nó buồn lắm.", en: "Do you see the little banyan tree in the village square? It's very sad." },
  { t: "Cây đa lớn lên khi bạn học tiếng Việt.", en: "The banyan grows when you learn Vietnamese." },
  { t: "Đi nào, tôi dạy bạn những từ đầu tiên!", en: "Come on, I'll teach you your first words!" },
];

export const praise: Line[] = [
  { t: "Đúng rồi!", en: "That's right!" },
  { t: "Giỏi quá!", en: "Great job!" },
  { t: "Tuyệt vời!", en: "Wonderful!" },
  { t: "Hay lắm!", en: "Very good!" },
  { t: "Đúng, nói như thế!", en: "Yes, that's how you say it!" },
  { t: "Hoàn toàn đúng!", en: "Completely right!" },
];

export const nudges: Line[] = [
  { t: "Gần đúng rồi! Nói thế này:", en: "Almost! Say it like this:" },
  { t: "Chưa đúng lắm. Nghe này:", en: "Not quite. Listen:" },
  { t: "Cố lên! Người ta nói:", en: "Keep going! People say:" },
];

export const roundDone: Line[] = [
  { t: "Hôm nay bạn học giỏi lắm!", en: "You did really well today!" },
  { t: "Bạn học nhanh quá!", en: "You learn so fast!" },
  { t: "Bạn giỏi thật đấy!", en: "You're really good!" },
];
