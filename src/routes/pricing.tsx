import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { readPlan, setPlan, type Plan } from "@/lib/credits";
import { useAuth } from "@/lib/auth";

const tiers = [
  {
    name: "Free",
    plan: "free" as Plan,
    price: "$0",
    period: "/month",
    features: [
      "3 Credits per day",
      "3 generations per day",
      "Core Lua scripts",
      "Folder structure export",
    ],
    featured: false,
  },
  {
    name: "Pro",
    plan: "pro" as Plan,
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
    plan: "studio" as Plan,
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
  const { user, profile, updatePlan } = useAuth();
  const [current, setCurrent] = useState<Plan>("free");

  useEffect(() => {
    setCurrent(user ? (profile?.plan ?? "free") : readPlan());
  }, [user, profile?.plan]);


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
              onClick={() => {
                if (user) {
                  void updatePlan(t.plan);
                } else {
                  setPlan(t.plan);
                }
                setCurrent(t.plan);
              }}
              className={`mt-7 w-full rounded-xl py-3 text-sm font-semibold ${
                t.featured
                  ? "btn-primary"
                  : "border border-border text-foreground transition-colors hover:bg-secondary"
              }`}
            >
              {current === t.plan ? "Current plan" : t.featured ? "Get Pro" : "Choose plan"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
