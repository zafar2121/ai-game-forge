import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Sparkles, Wand2 } from "lucide-react";
import { ProjectPanel } from "@/components/project-panel";
import { generateProject, type GeneratedProject } from "@/lib/generate-project";
import { useAuth, useCreditBalance, useSpendCredit } from "@/lib/auth";
import {
  CreditGateModal,
  EmailVerificationModal,
  SignInRequiredModal,
} from "@/components/generate-gate-modals";
import { saveProject } from "@/lib/projects";
import { bumpLoginStreak, trackTaskEvent } from "@/lib/daily-tasks";
import { categoryOf } from "@/lib/tasks";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { prompt?: string; go?: boolean } => ({
    ...(typeof search.prompt === "string" ? { prompt: search.prompt } : {}),
    ...(search.go === true || search.go === "true" ? { go: true } : {}),
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
  const [shareId, setShareId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);
  const generatorRef = useRef<HTMLDivElement>(null);
  const credits = useCreditBalance();
  const spend = useSpendCredit();
  const { user, profile, emailVerified, updatePlan } = useAuth();
  const plan = profile?.plan ?? "free";
  const [signInOpen, setSignInOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const pendingPrompt = useRef<string>("");

  // Daily-task tracking: login streak + minutes spent on ForgeBloxAI.
  useEffect(() => {
    if (!user) return;
    const streak = bumpLoginStreak();
    void trackTaskEvent(user.id, plan, "login_streak", { amount: streak });
    let minutes = 0;
    const id = window.setInterval(() => {
      minutes += 1;
      void trackTaskEvent(user.id, plan, "active_minutes", { amount: minutes });
    }, 60_000);
    return () => window.clearInterval(id);
  }, [user?.id, plan]);

  function requestGenerate(value = prompt) {
    if (!value.trim() || loading) return;
    pendingPrompt.current = value;
    if (!user) {
      setSignInOpen(true);
      return;
    }
    if (!emailVerified) {
      setVerifyOpen(true);
      return;
    }
    setCreditsOpen(true);
  }

  async function confirmGenerate() {
    const value = pendingPrompt.current || prompt;
    if (!(await spend())) return;
    setCreditsOpen(false);
    void runGeneration(value);
  }

  function runGeneration(value: string) {
    setLoading(true);
    setProject(null);
    setShareId(null);
    setStep(0);

    STEPS.forEach((_, i) => {
      window.setTimeout(() => setStep(i), i * 650);
    });
    window.setTimeout(() => {
      const generated = generateProject(value);
      setProject(generated);
      setLoading(false);
      if (user) {
        void saveProject(user.id, value, generated, user.email ?? null)
          .then((id) => setShareId(id))
          .catch(() => {});
        void trackTaskEvent(user.id, plan, "generate");
        void trackTaskEvent(user.id, plan, "long_prompt", { value: value.trim().length });
        void trackTaskEvent(user.id, plan, "categories", { value: categoryOf(value) });
      }
    }, STEPS.length * 650 + 400);
  }


  useEffect(() => {
    if (!search.prompt) return;
    setPrompt(search.prompt);
    generatorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlight(true);
    const t = window.setTimeout(() => setHighlight(false), 2600);
    if (search.go) requestGenerate(search.prompt);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.prompt, search.go]);



  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] hero-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] grid-lines opacity-40" />

      <SignInRequiredModal open={signInOpen} onOpenChange={setSignInOpen} />
      <EmailVerificationModal
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        email={user?.email ?? null}
        onResend={async () => {
          if (!user?.email) return;
          await supabase.auth.resend({
            type: "signup",
            email: user.email,
            options: { emailRedirectTo: window.location.origin },
          });
        }}
      />
      <CreditGateModal
        open={creditsOpen}
        onOpenChange={setCreditsOpen}
        credits={credits}
        currentPlan={profile?.plan ?? "free"}
        onUseCredit={() => void confirmGenerate()}
        onChoosePlan={async (plan) => {
          await updatePlan(plan);
        }}
      />

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

        <div ref={generatorRef} className="mx-auto mt-12 max-w-3xl scroll-mt-24">
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
                onClick={() => requestGenerate()}
                disabled={!prompt.trim() || loading}
                className={`btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold ${
                  highlight ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                }`}
              >

                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                Generate Game
              </button>
            </div>
            {user && !emailVerified && (
              <p className="border-t border-border/70 px-3 pb-3 pt-3 text-sm text-muted-foreground">
                Verify your email to receive your free credit and start generating.
              </p>
            )}
            {user && emailVerified && credits === 0 && (
              <p className="border-t border-border/70 px-3 pb-3 pt-3 text-sm text-muted-foreground">
                You have no credits left. Come back tomorrow to receive 1 free credit.
              </p>
            )}
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
            <ProjectPanel
              project={project}
              shareId={shareId}
              onDownloaded={() => void trackTaskEvent(user?.id, plan, "download")}
              onShared={() => void trackTaskEvent(user?.id, plan, "share")}
              onCopiedPrompt={() => void trackTaskEvent(user?.id, plan, "copy_prompt")}
            />
          </div>
        )}
      </main>
    </div>
  );
}
