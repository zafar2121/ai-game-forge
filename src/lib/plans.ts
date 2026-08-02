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
      "1 Credit every 24 hours",
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
      "10 Credits per day",
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
    price: "$70",
    period: "/month",
    features: [
      "Unlimited Credits",
      "Everything in Pro",
      "Team workspace",
      "Custom template library",
      "Priority generation",
    ],
    featured: false,
  },
];
