export type Plan = "free" | "pro" | "studio";

export type Tier = {
  name: string;
  plan: Plan;
  price: string;
  period: string;
  features: string[];
  featured: boolean;
};

export const tiers: Tier[] = [
  {
    name: "Free",
    plan: "free",
    price: "$0",
    period: "/month",
    features: [
      "0 Credits to start",
      "Earn up to 1 Credit a day from Daily Tasks",
      "Core Lua scripts",
      "Folder structure export",
    ],
    featured: false,
  },
  {
    name: "Pro",
    plan: "pro",
    price: "$10",
    period: "/month",
    features: [
      "10 Credits every 24 hours",
      "3 daily tasks · 1 Credit each",
      "Faster generation",
      "Full script suite + NPC systems",
      "Economy & monetization plans",
      "Downloadable project bundle",
    ],
    featured: true,
  },
  {
    name: "Studio",
    plan: "studio",
    price: "$80",
    period: "/month",
    features: [
      "100 Credits every 24 hours",
      "3 daily tasks · 5 Credits each",
      "Everything in Pro",
      "Team workspace",
      "Custom template library",
      "Priority generation",
    ],
    featured: false,
  },
];
