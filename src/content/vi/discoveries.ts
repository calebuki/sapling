import type { Discovery } from "@/lib/game/discoveries";

// Things on Cát Bà the player can find and name. Props marked "none" are part
// of the island's own scenery (see components/game/world/cat-ba.tsx).
export const discoveries: Discovery[] = [
  { id: "thuyen", t: "con thuyền", en: "the boat", x: 6.4, z: 31.6, rot: 0.8, prop: "rowboat", lift: 1.6 },
  { id: "thung", t: "thuyền thúng", en: "the basket boat", x: -4.4, z: 31.8, prop: "none", lift: 1.6 },
  { id: "ca", t: "con cá", en: "the fish", x: 1.1, z: 33, prop: "bucket", lift: 1.6 },
  { id: "chim", t: "con chim", en: "the bird", x: -1.5, z: 38.5, prop: "gull", lift: 2.6 },
  { id: "dua", t: "cây dừa", en: "the coconut palm", x: -12, z: 25, prop: "none", lift: 6.4 },
  { id: "den-long", t: "đèn lồng", en: "the lantern", x: 4.2, z: 3.4, prop: "none", lift: 3.4 },
  { id: "ghe", t: "cái ghế", en: "the stool", x: -10.8, z: 11.4, prop: "none", lift: 1.2 },
  { id: "bat-pho", t: "bát phở", en: "the bowl of pho", x: -9.6, z: 10, prop: "none", lift: 1.6 },
  { id: "meo", t: "con mèo", en: "the cat", x: -17, z: 11.2, rot: 1.2, prop: "cat", lift: 1.3 },
  { id: "xe-dap", t: "xe đạp", en: "the bicycle", x: -6.8, z: 13.4, rot: 0.9, prop: "bike", lift: 1.8 },
  { id: "non-la", t: "nón lá", en: "the conical hat", x: 12.4, z: 0.4, prop: "none", lift: 1.8 },
  { id: "xoai", t: "quả xoài", en: "the mango", x: 15.6, z: 0.6, prop: "none", lift: 2 },
  { id: "thung-go", t: "cái thùng", en: "the barrel", x: 18.6, z: 7.6, prop: "barrel", lift: 1.6 },
  { id: "cho", t: "con chó", en: "the dog", x: 7, z: 20, rot: -2.2, prop: "dog", lift: 1.4 },
  { id: "luoi", t: "cái lưới", en: "the fishing net", x: 11.4, z: 22.6, prop: "none", lift: 2.6 },
  { id: "tre", t: "cây tre", en: "the bamboo", x: 19.4, z: 13.2, prop: "none", lift: 6 },
  { id: "hoa", t: "bông hoa", en: "the flower", x: -8.4, z: -10.6, prop: "flower", lift: 1.3 },
  { id: "da", t: "hòn đá", en: "the stone", x: -27, z: 2, prop: "stone", lift: 2.2 },
  { id: "vooc", t: "con voọc", en: "the langur", x: -20.6, z: -13, prop: "none", lift: 3.4 },
  { id: "chua", t: "ngôi chùa", en: "the pagoda", x: 3.4, z: -21.4, prop: "none", lift: 7.5 },
];
