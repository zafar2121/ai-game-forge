import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    features: ["3 generations per month", "Core Lua scripts", "Folder structure export"],
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    features: [
      "Unlimited generations",
      "Full script suite + NPC systems",
      "Economy & monetization plans",
      "Downloadable project bundle",
    ],
    featured: true,
  },
  {
    name: "Studio",
    price: "$79",
    period: "/mo",
    features: ["Everything in Pro", "Team workspace", "Custom template library", "Priority generation"],
    featured: false,
  },
];

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Roblox AI Builder" },
      {
        name: "description",
        content: "Simple plans for solo creators and studios building Roblox games with AI.",
      },
      { property: "og:title", content: "Pricing — Roblox AI Builder" },
      {
        property: "og:description",
        content: "Free, Pro and Studio plans for AI-generated Roblox projects.",
      },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-semibold">Pricing</h1>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade when you ship.</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`panel p-7 ${t.featured ? "border-primary/45" : ""}`}
          >
            <h2 className="text-sm font-medium text-muted-foreground">{t.name}</h2>
            <p className="mt-3 text-4xl font-semibold">
              {t.price}
              <span className="text-base font-normal text-muted-foreground">{t.period}</span>
            </p>
            <ul className="mt-6 space-y-2.5">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`mt-7 w-full rounded-xl py-3 text-sm font-semibold ${
                t.featured
                  ? "btn-primary"
                  : "border border-border text-foreground transition-colors hover:bg-secondary"
              }`}
            >
              {t.featured ? "Get Pro" : "Choose plan"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
