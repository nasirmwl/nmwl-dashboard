export type MetroRank = {
  level: number;
  name: string;
  min: number;
  max: number;
  image: string;
  weapon: string;
  /** What this rank can actually hold. */
  capabilities: string[];
};

/** 14-day category average (0–100) picks the person above the heatmap. */
export const METRO_RANKS: MetroRank[] = [
  {
    level: 1,
    name: "Rookie",
    min: 0,
    max: 20,
    image: "/characters/kit-rookie.jpg",
    weapon: "Bare hands",
    capabilities: [
      "Nothing in the hands. A fight has to be walked around, not won.",
      "Can show up and log a day. Cannot hold one if it pushes back.",
      "Borrowed coat, empty belt, dead flashlight. This window has no spare.",
    ],
  },
  {
    level: 2,
    name: "Runner",
    min: 21,
    max: 35,
    image: "/characters/kit-runner.jpg",
    weapon: "Wooden stick",
    capabilities: [
      "A broken branch keeps this rank moving. It will not hold a line.",
      "One or two habits stay. The rest leak, then the day vanishes.",
      "Satchel and a canteen. Easy to find, easy to drop.",
    ],
  },
  {
    level: 3,
    name: "Operator",
    min: 36,
    max: 50,
    image: "/characters/kit-operator.jpg",
    weapon: "Survival knife",
    capabilities: [
      "Quiet and short. The day has a post, and the reach is one arm.",
      "Routines exist and some of them stick. This rank cannot patrol far from the station.",
      "The knife comes out only when something is already close.",
    ],
  },
  {
    level: 4,
    name: "Scout",
    min: 51,
    max: 65,
    image: "/characters/kit-scout.jpg",
    weapon: "Kukri",
    capabilities: [
      "The hit is heavy, and it only lands up close. Planning pays inside that reach.",
      "Can carry a short mission: focus, sleep, one hard habit.",
      "Binoculars and a pack, still no gun. A bad week drops this rank back to Operator.",
    ],
  },
  {
    level: 5,
    name: "Ranger",
    min: 66,
    max: 80,
    image: "/characters/kit-ranger.jpg",
    weapon: "Makarov PM",
    capabilities: [
      "First real gun. Common surplus, and the belt carries one spare magazine.",
      "The 14-day line holds through an ugly day, but every miss spends a round.",
      "Can stack deep work, body, and people. Ammo is the limit, not the will.",
    ],
  },
  {
    level: 6,
    name: "Warden",
    min: 81,
    max: 92,
    image: "/characters/kit-warden.jpg",
    weapon: "Mossberg 590",
    capabilities: [
      "Very strong up close. Most categories are already green, and the shells are few.",
      "Armor and a badge. A bad day is absorbed without losing the band.",
      "What is still open is a shell that is not on the sling.",
    ],
  },
  {
    level: 7,
    name: "Stalker",
    min: 93,
    max: 100,
    image: "/characters/kit-stalker-v2.jpg",
    weapon: "Suppressed HK416",
    capabilities: [
      "The rarest kit in the tunnel. Quiet because the window is finished.",
      "Full auto is there and almost never needed. Every category sits near the ceiling.",
      "Magazines on the chest. The only job left is not to slip under 93.",
    ],
  },
];

export function rankForScore(score: number): MetroRank {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  return (
    METRO_RANKS.find((rank) => clamped >= rank.min && clamped <= rank.max) ??
    METRO_RANKS[0]
  );
}
