import type { GrammarTip } from "@/lib/game/grammar";

// Short grammar lessons for Cát Bà. Vietnamese has no verb endings or genders;
// what beginners need first is the tones, and the right word for "you".

export const grammarTips: GrammarTip[] = [
  {
    id: "sau-thanh",
    unit: "xin-chao",
    title: { t: "Sáu thanh", en: "The six tones" },
    readyAt: 3,
    gates: [],
    cards: [
      {
        title: { t: "Ngang, huyền, sắc", en: "Level, falling, rising" },
        body: "Every Vietnamese syllable has a tone, and the mark over the vowel tells you which. Change the tone and you have a different word. No mark is the level tone: flat and even. The grave mark (dấu huyền) falls low and soft. The acute mark (dấu sắc) rises sharply.",
        examples: [
          { t: "ma", en: "ghost (level)" },
          { t: "mà", en: "but (falling)" },
          { t: "má", en: "cheek (rising)" },
        ],
      },
      {
        title: { t: "Hỏi, ngã, nặng", en: "Dipping, broken, heavy" },
        body: "The hook (dấu hỏi) dips down and comes back up. The tilde (dấu ngã) rises with a catch in the middle. The dot below (dấu nặng) drops short and heavy. In Hanoi hỏi and ngã sound clearly different, which is one reason Cát Bà speaks Northern Vietnamese: what you hear matches how it's written.",
        examples: [
          { t: "mả", en: "grave (dipping)" },
          { t: "mã", en: "horse (broken)" },
          { t: "mạ", en: "rice seedling (heavy)" },
        ],
      },
    ],
    check: {
      question: "Which word has the falling tone (dấu huyền)?",
      options: ["mà", "má", "mạ"],
      answer: "mà",
      why: "The grave mark ` over the vowel is the falling tone: mà, like in cà phê.",
    },
  },
  {
    id: "anh-chi-em",
    unit: "gioi-thieu",
    title: { t: "Anh, chị, em", en: "Who is \"you\"?" },
    readyAt: 8,
    gates: ["anh", "chi", "em"],
    cards: [
      {
        title: { t: "Anh, chị, em", en: "Brother, sister, younger one" },
        body: "Vietnamese has no single word for \"you\". People call each other by family words that fit their ages: anh (older brother) for a man a bit older than you, chị (older sister) for a woman a bit older, and em for anyone younger. Tôi and bạn are safe and polite when you're not sure.",
        examples: [
          { t: "Anh tên là gì?", en: "What's your name? (to a man a bit older)" },
          { t: "Chị ơi, cái này bao nhiêu tiền?", en: "Excuse me, how much is this? (to a woman a bit older)" },
          { t: "Em tên là gì?", en: "What's your name? (to someone younger)" },
        ],
      },
      {
        title: { t: "Bác, ông, bà", en: "Uncle, grandpa, grandma" },
        body: "For people your parents' age, say bác; for the elderly, ông (grandpa) and bà (grandma). They call you cháu (grandchild), and you can call yourself cháu back. That's why Bác Hùng and Ông Sơn say cháu to you.",
        examples: [
          { t: "Bác ơi, cho cháu một bát phở.", en: "A bowl of pho for me, please. (to an older man)" },
          { t: "Ông khỏe không?", en: "How are you? (to an old man)" },
        ],
      },
    ],
    check: {
      question: "You're talking to a woman a few years older than you. Which word means \"you\"?",
      options: ["chị", "em", "ông"],
      answer: "chị",
      why: "Chị means older sister: the word for a woman a bit older than you.",
    },
  },
];
