import type { Line } from "@/lib/game/line";
import type { ItemId } from "@/lib/game/wardrobe";
import type { TargetLanguageCode } from "@/lib/learning/languages";

// What each wardrobe piece is called on every island, and what villagers say
// the first time they see you in something you earned. German keeps its
// article so the gender comes along with the word.

type Words = { en: string; name: Record<TargetLanguageCode, string>; praise?: Partial<Record<TargetLanguageCode, Line>> };

export const wardrobeWords: Record<ItemId, Words> = {
  beanie: { en: "beanie", name: { sv: "en mössa", de: "die Mütze", vi: "mũ len", da: "en hue" } },
  cap: {
    en: "cap",
    name: { sv: "en keps", de: "die Kappe", vi: "mũ lưỡi trai", da: "en kasket" },
    praise: {
      sv: { t: "Snygg keps!", en: "Nice cap!" },
      de: { t: "Coole Kappe!", en: "Cool cap!" },
      vi: { t: "Mũ lưỡi trai đẹp quá!", en: "What a nice cap!" },
    },
  },
  sunhat: {
    en: "sun hat",
    name: { sv: "en solhatt", de: "der Sonnenhut", vi: "mũ rộng vành", da: "en solhat" },
    praise: {
      sv: { t: "Vilken fin solhatt!", en: "What a lovely sun hat!" },
      de: { t: "Schöner Sonnenhut!", en: "Nice sun hat!" },
      vi: { t: "Mũ rộng vành xinh quá!", en: "What a pretty sun hat!" },
    },
  },
  crown: {
    en: "flower crown",
    name: { sv: "en blomsterkrans", de: "der Blumenkranz", vi: "vòng hoa", da: "en blomsterkrans" },
    praise: {
      sv: { t: "Vilken vacker blomsterkrans!", en: "What a beautiful flower crown!" },
      de: { t: "Was für ein schöner Blumenkranz!", en: "What a beautiful flower crown!" },
      vi: { t: "Vòng hoa xinh quá!", en: "What a pretty flower crown!" },
    },
  },
  bollenhut: {
    en: "Bollenhut, the Black Forest hat",
    name: { sv: "en Bollenhut", de: "der Bollenhut", vi: "mũ Bollenhut", da: "en Bollenhut" },
    praise: {
      sv: { t: "Vilken rolig hatt!", en: "What a fun hat!" },
      de: { t: "Ein echter Bollenhut! Steht dir gut.", en: "A real Bollenhut! It suits you." },
      vi: { t: "Mũ đẹp quá!", en: "What a nice hat!" },
    },
  },
  nonla: {
    en: "nón lá, the leaf hat",
    name: { sv: "en nón lá", de: "der Kegelhut", vi: "nón lá", da: "en nón lá" },
    praise: {
      sv: { t: "Vilken fin hatt!", en: "What a nice hat!" },
      de: { t: "Schöner Hut!", en: "Nice hat!" },
      vi: { t: "Nón lá hợp với bạn lắm!", en: "The nón lá really suits you!" },
    },
  },
  tee: { en: "T-shirt", name: { sv: "en t-shirt", de: "das T-Shirt", vi: "áo phông", da: "en T-shirt" } },
  longsleeve: { en: "long-sleeved top", name: { sv: "en långärmad tröja", de: "das Langarmshirt", vi: "áo dài tay", da: "en langærmet trøje" } },
  tank: { en: "vest top", name: { sv: "ett linne", de: "das Tanktop", vi: "áo ba lỗ", da: "en tanktop" } },
  print: {
    en: "printed T-shirt",
    name: { sv: "en t-shirt med tryck", de: "das T-Shirt mit Aufdruck", vi: "áo phông in hình", da: "en T-shirt med tryk" },
    praise: {
      sv: { t: "Vilket fint tryck!", en: "What a nice print!" },
      de: { t: "Schöner Aufdruck!", en: "Nice print!" },
      vi: { t: "Hình in dễ thương quá!", en: "Such a cute print!" },
    },
  },
  hoodie: {
    en: "hoodie",
    name: { sv: "en luvtröja", de: "der Kapuzenpulli", vi: "áo nỉ có mũ", da: "en hættetrøje" },
    praise: {
      sv: { t: "Snygg luvtröja!", en: "Nice hoodie!" },
      de: { t: "Cooler Kapuzenpulli!", en: "Cool hoodie!" },
      vi: { t: "Áo nỉ có mũ đẹp quá!", en: "What a nice hoodie!" },
    },
  },
  shirt: {
    en: "shirt",
    name: { sv: "en skjorta", de: "das Hemd", vi: "áo sơ mi", da: "en skjorte" },
    praise: {
      sv: { t: "Snygg skjorta!", en: "Nice shirt!" },
      de: { t: "Schickes Hemd!", en: "Smart shirt!" },
      vi: { t: "Áo sơ mi đẹp quá!", en: "What a nice shirt!" },
    },
  },
  raincoat: {
    en: "raincoat",
    name: { sv: "en regnjacka", de: "die Regenjacke", vi: "áo mưa", da: "en regnjakke" },
    praise: {
      sv: { t: "Bra regnjacka! Nu får det regna.", en: "Good raincoat! Now it can rain." },
      de: { t: "Schöne Regenjacke! Jetzt kann es regnen.", en: "Nice raincoat! Now it can rain." },
      vi: { t: "Có áo mưa rồi, mưa cũng không sợ!", en: "You've got a raincoat, so who's afraid of rain!" },
    },
  },
  stripes: {
    en: "striped top",
    name: { sv: "en randig tröja", de: "das Ringelshirt", vi: "áo kẻ sọc", da: "en stribet trøje" },
    praise: {
      sv: { t: "Snygg randig tröja!", en: "Nice striped top!" },
      de: { t: "Schönes Ringelshirt!", en: "Nice striped shirt!" },
      vi: { t: "Áo kẻ sọc đẹp quá!", en: "What a nice striped top!" },
    },
  },
  knit: {
    en: "knitted jumper",
    name: { sv: "en stickad tröja", de: "der Strickpulli", vi: "áo len", da: "en strikket trøje" },
    praise: {
      sv: { t: "Vilken mysig tröja!", en: "What a cosy jumper!" },
      de: { t: "Schöner Pulli! Sieht warm aus.", en: "Nice jumper! Looks warm." },
      vi: { t: "Áo len trông ấm quá!", en: "That sweater looks so warm!" },
    },
  },
  trousers: { en: "trousers", name: { sv: "byxor", de: "die Hose", vi: "quần dài", da: "bukser" } },
  shorts: {
    en: "shorts",
    name: { sv: "shorts", de: "die Shorts", vi: "quần soóc", da: "shorts" },
    praise: {
      sv: { t: "Snygga shorts!", en: "Nice shorts!" },
      de: { t: "Coole Shorts!", en: "Cool shorts!" },
      vi: { t: "Quần soóc đẹp đấy!", en: "Nice shorts!" },
    },
  },
  overalls: {
    en: "dungarees",
    name: { sv: "snickarbyxor", de: "die Latzhose", vi: "quần yếm", da: "overalls" },
    praise: {
      sv: { t: "Snygga snickarbyxor!", en: "Nice dungarees!" },
      de: { t: "Schicke Latzhose!", en: "Smart dungarees!" },
      vi: { t: "Quần yếm dễ thương quá!", en: "Such cute dungarees!" },
    },
  },
  glasses: {
    en: "glasses",
    name: { sv: "glasögon", de: "die Brille", vi: "kính", da: "briller" },
    praise: {
      sv: { t: "Snygga glasögon!", en: "Nice glasses!" },
      de: { t: "Schöne Brille!", en: "Nice glasses!" },
      vi: { t: "Kính đẹp quá!", en: "What nice glasses!" },
    },
  },
  scarf: {
    en: "scarf",
    name: { sv: "en halsduk", de: "der Schal", vi: "khăn quàng cổ", da: "et halstørklæde" },
    praise: {
      sv: { t: "Fin halsduk!", en: "Nice scarf!" },
      de: { t: "Schöner Schal!", en: "Nice scarf!" },
      vi: { t: "Khăn quàng đẹp quá!", en: "What a nice scarf!" },
    },
  },
};

// The notes that pop up on an island when something new arrives.
export const wardrobeNews: Record<TargetLanguageCode, { newItem: Line; newItems: (n: number) => Line; giftFrom: (name: string) => Line }> = {
  sv: {
    newItem: { t: "Nytt i garderoben", en: "New in your wardrobe" },
    newItems: (n) => ({ t: `${n} nya saker i garderoben`, en: `${n} new things in your wardrobe` }),
    giftFrom: (name) => ({ t: `En present från ${name}!`, en: `A present from ${name}!` }),
  },
  de: {
    newItem: { t: "Neu im Kleiderschrank", en: "New in your wardrobe" },
    newItems: (n) => ({ t: `${n} neue Sachen im Kleiderschrank`, en: `${n} new things in your wardrobe` }),
    giftFrom: (name) => ({ t: `Ein Geschenk von ${name}!`, en: `A present from ${name}!` }),
  },
  vi: {
    newItem: { t: "Đồ mới trong tủ quần áo", en: "New in your wardrobe" },
    newItems: (n) => ({ t: `${n} món đồ mới trong tủ quần áo`, en: `${n} new things in your wardrobe` }),
    giftFrom: (name) => ({ t: `Quà ${name} tặng bạn!`, en: `A present from ${name} for you!` }),
  },
  da: {
    newItem: { t: "Nyt i garderoben", en: "New in your wardrobe" },
    newItems: (n) => ({ t: `${n} nye ting i garderoben`, en: `${n} new things in your wardrobe` }),
    giftFrom: (name) => ({ t: `En gave fra ${name}!`, en: `A present from ${name}!` }),
  },
};

export function itemName(id: ItemId, code: TargetLanguageCode): Line {
  const words = wardrobeWords[id];
  return { t: words.name[code], en: words.en };
}

export function praiseFor(id: ItemId, code: TargetLanguageCode): Line | null {
  return wardrobeWords[id].praise?.[code] ?? null;
}
