export const townQuests = [
  {
    id: "meet-elin",
    venue: "kafe-linden",
    title: "A familiar face",
    subtitle: "Meet Elin",
    stamp: "First hello",
    description: "Introduce yourself. A new friendship starts with hej.",
    next: "Catch up with Elin",
    icon: "hello",
  },
  {
    id: "fika-order",
    venue: "kafe-linden",
    title: "Your first fika",
    subtitle: "Kafé Linden",
    stamp: "Fika friend",
    description: "Choose a drink, place your order, and settle in.",
    next: "Another fika?",
    icon: "coffee",
  },
  {
    id: "centralstation-change",
    venue: "centralstationen",
    title: "A little adventure",
    subtitle: "Centralstationen",
    stamp: "All aboard",
    description: "Find your train and work out where to get off.",
    next: "Take another trip",
    icon: "train",
  },
  {
    id: "make-weekend-plans",
    venue: "stadsparken",
    title: "See you Saturday",
    subtitle: "Stadsparken",
    stamp: "Plans with a friend",
    description: "Suggest something to do and make a plan with Elin.",
    next: "Make a new plan",
    icon: "park",
  },
] as const;

export function getTownQuest(scenarioId: string) {
  return townQuests.find((quest) => quest.id === scenarioId);
}

export function growthLabel(stamps: number) {
  return [
    "A little beginning",
    "Putting down roots",
    "Room to grow",
    "Feeling at home",
    "Part of the neighborhood",
  ][Math.min(4, Math.max(0, stamps))];
}
