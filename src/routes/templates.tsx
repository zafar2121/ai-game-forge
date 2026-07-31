import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Wand2 } from "lucide-react";

const templates = [
  {
    name: "Pet Simulator",
    tag: "Simulator",
    desc: "Hatching, pet power, island unlocks and rebirths.",
    prompt:
      "A Roblox pet simulator with egg hatching, pets of different rarities, rebirths, islands, upgrades, quests, coins and UI.",
  },
  {
    name: "Tower Obby",
    tag: "Obby",
    desc: "100 staged floors, checkpoints, skip-stage products.",
    prompt:
      "A Roblox obby with 100 stages, checkpoints, skip stage, moving platforms, lava and victory rewards.",
  },
  {
    name: "Pizza Tycoon",
    tag: "Tycoon",
    desc: "Droppers, conveyors, staff hiring and upgrades.",
    prompt:
      "A Roblox pizza tycoon with droppers, conveyors, upgrades, workers, customers and income.",
  },
  {
    name: "Anime Fight RPG",
    tag: "RPG",
    desc: "Skill trees, combos, world bosses and drop tables.",
    prompt:
      "An anime RPG with abilities, bosses, quests, leveling, inventory, skills and multiplayer combat.",
  },
  {
    name: "Horror Escape",
    tag: "Round-based",
    desc: "AI stalker, generator objectives, lobby rounds.",
    prompt:
      "A horror escape game with an AI monster, generators, keys, puzzles, flashlight, lobby and rounds.",
  },
  {
    name: "Racing Arena",
    tag: "Racing",
    desc: "Vehicle stats, track streaming, leaderboards.",
    prompt:
      "A racing game with multiple cars, upgrades, laps, checkpoints, leaderboards and rewards.",
  },
];

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates — Roblox AI Builder" },
      {
        name: "description",
        content: "Start from a proven Roblox game template: simulators, tycoons, obbies, RPGs and more.",
      },
      { property: "og:title", content: "Templates — Roblox AI Builder" },
      {
        property: "og:description",
        content: "Proven Roblox game blueprints you can generate and customize in one click.",
      },
    ],
  }),
  component: Templates,
});

function Templates() {
  const navigate = useNavigate();

  function open(prompt: string, go?: boolean) {
    navigate({ to: "/", search: go ? { prompt, go: true } : { prompt } });
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-20">
      <h1 className="text-4xl font-semibold">Templates</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Proven genre blueprints. Pick one, tweak the prompt, generate a full project.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <article
            key={t.name}
            role="button"
            tabIndex={0}
            onClick={() => open(t.prompt)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(t.prompt);
              }
            }}
            className="panel cursor-pointer p-6 transition-colors hover:border-primary/40"
          >
            <span className="rounded-full bg-accent/12 px-2.5 py-0.5 text-[11px] text-accent">
              {t.tag}
            </span>
            <h2 className="mt-4 text-lg font-semibold">{t.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                open(t.prompt, true);
              }}
              className="btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
            >
              <Wand2 className="size-3.5" />
              Generate Now
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
