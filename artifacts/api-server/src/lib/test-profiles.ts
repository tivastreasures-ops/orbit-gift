import type { GiftInput } from "@workspace/api-zod";

export interface TestProfile { name: string; input: GiftInput | null }
// Fictional acceptance fixtures, not accounts or live recipient data.
export const TEST_PROFILES: TestProfile[] = [
  {
    name: "Hinterwelle",
    input: {
      recipientId: "fixture-hinterwelle",
      loves: ["Okkervil River", "Joy Division", "The Black Angels", "Badtz-Maru", "German food", "a good Earl Grey"],
      refusals: ["the colour pink", "dresses", "anything Microsoft or Windows"],
      owned: "already owns every Joy Division record",
      occasion: "Birthday", relationship: "Friend", budgetMin: 15, budgetMax: 90,
    },
  },
  {
    name: "Wolfboy",
    input: {
      recipientId: "fixture-wolfboy",
      relationship: "Partner", occasion: "Birthday", budgetMin: 50, budgetMax: 150,
      loves: ["wolfman", "Frankenstein's Monster", "Universal Monsters", "DC Universe", "Marvel Universe", "Avengers", "turquoise"],
      refusals: ["anime", "salads", "pop music", "pink", "Crunch Fitness"],
      owned: "",
    },
  },
  {
    name: "Mira (easy)",
    input: {
      recipientId: "fixture-mira", loves: ["birdwatching", "lemon baking", "ceramics", "botanical gardens"],
      refusals: ["leather", "candles"], owned: "binoculars",
      occasion: "Birthday", relationship: "Friend", budgetMin: 25, budgetMax: 90,
    },
  },
  {
    name: "Sol (sparse: two loves)",
    input: {
      recipientId: "fixture-sol", loves: ["sourdough baking", "astronomy"],
      refusals: ["alcohol"], owned: "basic sourdough starter jar",
      occasion: "Birthday", relationship: "Partner", budgetMin: 20, budgetMax: 80,
    },
  },
];
