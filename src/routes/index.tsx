import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Sparkles, Wand2 } from "lucide-react";
import { ProjectPanel } from "@/components/project-panel";
import { generateProject, type GeneratedProject } from "@/lib/generate-project";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    prompt: typeof search.prompt === "string" ? search.prompt : undefined,
    go: search.go === true || search.go === "true" ? true : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Roblox AI Builder — Generate Roblox Games with AI" },
      {
        name: "description",
        content:
          "Describe your idea and generate a complete Roblox game: Lua scripts, mechanics, folder structure and downloadable project files.",
      },
      { property: "og:title", content: "Roblox AI Builder — Generate Roblox Games with AI" },
      {
        property: "og:description",
        content:
          "Turn a one-line prompt into a full Roblox project: Lua scripts, NPC systems, economy and monetization.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  "Parsing your game concept",
  "Designing core loop and mechanics",
  "Writing Lua services",
  "Building folder structure",
  "Balancing economy and monetization",
];

const EXAMPLES = [
  "A pet collecting simulator with islands and bosses",
  "An obby with 100 stages and checkpoint shops",
  "A tycoon where players build a pizza empire",
];

function Home() {
  const search = Route.useSearch();
  const [prompt, setPrompt] = useState(search.prompt ?? "");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [project, setProject] = useState<GeneratedProject | null>(null);
  const [highlight, setHighlight] = useState(false);
  const generatorRef = useRef<HTMLDivElement>(null);

  function handleGenerate(value = prompt) {
    if (!value.trim() || loading) return;
    setLoading(true);
    setProject(null);
    setStep(0);

    STEPS.forEach((_, i) => {
      window.setTimeout(() => setStep(i), i * 650);
    });
    window.setTimeout(() => {
      setProject(generateProject(value));
      setLoading(false);
    }, STEPS.length * 650 + 400);
  }

  useEffect(() => {
    if (!search.prompt) return;
    setPrompt(search.prompt);
    generatorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlight(true);
    const t = window.setTimeout(() => setHighlight(false), 2600);
    if (search.go) handleGenerate(search.prompt);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.prompt, search.go]);


  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] hero-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] grid-lines opacity-40" />

      <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            AI game generation, in seconds
          </span>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] sm:text-6xl">
            <span className="text-gradient">Build Roblox Games with AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Describe your idea and let AI generate a complete Roblox game with Lua scripts, game
            mechanics, folder structure and downloadable project files.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="panel p-2.5">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="Example: Create a Roblox simulator where players collect pets, level up, unlock islands and fight bosses."
              className="w-full resize-none rounded-xl bg-transparent p-4 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            <div className="flex flex-col gap-3 border-t border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[11px] text-muted-foreground">
                {prompt.trim().length} characters · placeholder AI engine
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim() || loading}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                Generate Game
              </button>
            </div>
          </div>

          {!project && !loading && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  onClick={() => setPrompt(e)}
                  className="rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="mx-auto mt-10 max-w-xl animate-fade-in panel p-7">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-primary" />
              <p className="text-sm font-medium">Generating your project…</p>
            </div>
            <ul className="mt-5 space-y-2.5">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className={`flex items-center gap-2.5 text-sm transition-opacity ${
                    i <= step ? "text-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  <ArrowRight
                    className={`size-3.5 ${i <= step ? "text-primary" : "text-muted-foreground/40"}`}
                  />
                  {s}
                </li>
              ))}
            </ul>
            <div className="mt-6 h-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {project && (
          <div className="mt-14">
            <ProjectPanel project={project} />
          </div>
        )}
      </main>
    </div>
  );
}
