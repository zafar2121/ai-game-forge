import { createFileRoute } from "@tanstack/react-router";

const templates = [
  { name: "Pet Simulator", tag: "Simulator", desc: "Hatching, pet power, island unlocks and rebirths." },
  { name: "Tower Obby", tag: "Obby", desc: "100 staged floors, checkpoints, skip-stage products." },
  { name: "Pizza Tycoon", tag: "Tycoon", desc: "Droppers, conveyors, staff hiring and upgrades." },
  { name: "Anime Fight RPG", tag: "RPG", desc: "Skill trees, combos, world bosses and drop tables." },
  { name: "Horror Escape", tag: "Round-based", desc: "AI stalker, generator objectives, lobby rounds." },
  { name: "Racing Arena", tag: "Racing", desc: "Vehicle stats, track streaming, leaderboards." },
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
  return (
    <main className="mx-auto max-w-6xl px-5 py-20">
      <h1 className="text-4xl font-semibold">Templates</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Proven genre blueprints. Pick one, tweak the prompt, generate a full project.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <article key={t.name} className="panel p-6 transition-colors hover:border-primary/40">
            <span className="rounded-full bg-accent/12 px-2.5 py-0.5 text-[11px] text-accent">
              {t.tag}
            </span>
            <h2 className="mt-4 text-lg font-semibold">{t.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
