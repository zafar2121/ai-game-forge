import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ExternalLink, Loader2, ShieldCheck, Timer, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatCredits } from "@/lib/credits";
import {
  claimTask,
  isRewardEligible,
  loadDailyTasks,
  verifyLinkTask,
  LINK_VERIFY_MS,
  type TaskState,
} from "@/lib/daily-tasks";
import { msUntilReset } from "@/lib/tasks";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Daily Tasks — ForgeBloxAI" },
      {
        name: "description",
        content: "Complete daily tasks on ForgeBloxAI and earn credits to generate Roblox games.",
      },
      { property: "og:title", content: "Daily Tasks — ForgeBloxAI" },
      { property: "og:description", content: "Earn free credits by completing daily tasks." },
    ],
  }),
  component: TasksPage,
});

function useCountdown() {
  const [left, setLeft] = useState(msUntilReset());
  useEffect(() => {
    const id = window.setInterval(() => setLeft(msUntilReset()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return `${h}h ${`${m}`.padStart(2, "0")}m ${`${s}`.padStart(2, "0")}s`;
}

function TasksPage() {
  const { user, profile, emailVerified, addCredits, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<TaskState[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const countdown = useCountdown();
  const plan = profile?.plan ?? "free";
  const eligible = isRewardEligible(user?.id, plan);

  // Tracks how long the visitor actually left this tab after opening a task link.
  const away = useRef<Record<string, number>>({});
  const leftAt = useRef<number | null>(null);
  const activeTask = useRef<string | null>(null);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") leftAt.current = Date.now();
    };
    const onBlur = () => {
      if (leftAt.current === null) leftAt.current = Date.now();
    };
    const onBack = () => {
      const key = activeTask.current;
      if (key && leftAt.current !== null) {
        away.current[key] = (away.current[key] ?? 0) + (Date.now() - leftAt.current);
      }
      leftAt.current = null;
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onBack);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onBack);
    };
  }, []);

  const reload = useCallback(async () => {
    if (!user) return;
    setTasks(await loadDailyTasks(user.id, plan));
  }, [user?.id, plan]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-4xl font-semibold">Daily Tasks</h1>
        <p className="mt-3 text-muted-foreground">
          You are not eligible for task rewards. Create a free account to start completing daily
          tasks.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/signup" className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold">
            Sign Up
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            Log In
          </Link>
        </div>
      </main>
    );
  }

  async function handleClaim(task: TaskState) {
    if (!user) return;
    if (!eligible) {
      setNotice("You are not eligible for task rewards.");
      return;
    }
    setBusy(task.key);
    const reward = await claimTask(user.id, plan, task);
    if (reward > 0) await addCredits(reward);
    await refreshProfile();
    await reload();
    setBusy(null);
  }

  function handleOpen(task: TaskState) {
    activeTask.current = task.key;
    away.current[task.key] = away.current[task.key] ?? 0;
    setOpened((prev) => ({ ...prev, [task.key]: true }));
    setNotice(null);
  }

  async function handleVerify(task: TaskState) {
    if (!user) return;
    if (!eligible) {
      setNotice("You are not eligible for task rewards.");
      return;
    }
    setBusy(task.key);
    const ok = await verifyLinkTask(user.id, plan, task, {
      opened: Boolean(opened[task.key]),
      leftPage: (away.current[task.key] ?? 0) > 0,
      awayMs: away.current[task.key] ?? 0,
    });
    if (!ok) {
      setNotice(
        `Not verified yet — open the page, complete the action, and stay there at least ${Math.round(
          LINK_VERIFY_MS / 1000,
        )} seconds before verifying.`,
      );
    } else {
      setNotice(null);
      await reload();
    }
    setBusy(null);
  }


  return (
    <main className="mx-auto max-w-3xl px-5 py-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Daily Tasks</h1>
          <p className="mt-3 text-muted-foreground">
            {plan === "free"
              ? "Complete all three tasks to earn exactly 1 Credit."
              : `Three tasks are assigned every day · ${plan === "studio" ? "5" : "1"} Credit${plan === "studio" ? "s" : ""} each.`}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-3.5 py-2 font-mono text-xs text-muted-foreground">
          <Timer className="size-3.5 text-primary" /> Resets in {countdown}
        </div>
      </div>

      <div className="panel mt-6 flex items-center justify-between p-5">
        <p className="text-sm text-muted-foreground">Your balance</p>
        <p className="inline-flex items-center gap-2 font-mono text-sm">
          <Zap className="size-4 text-primary" /> {formatCredits(profile?.credits ?? 0)} Credits
        </p>
      </div>

      {!eligible && (
        <p className="mt-4 text-sm text-muted-foreground">You are not eligible for task rewards.</p>
      )}

      {eligible && !emailVerified && (
        <p className="mt-4 text-sm text-muted-foreground">
          Verify your email to start claiming task rewards.
        </p>
      )}

      {notice && <p className="mt-4 text-sm text-muted-foreground">{notice}</p>}

      <div className="mt-6 space-y-4">
        {tasks === null && (
          <div className="panel flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" /> Loading your tasks…
          </div>
        )}
        {tasks?.map((task) => {
          const pct = Math.min(100, Math.round((task.progress / task.target) * 100));
          return (
            <div key={task.key} className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Reward: {formatCredits(task.reward)} Credits
                  </p>
                </div>
                {task.claimed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                    <Check className="size-3" /> Completed
                  </span>
                ) : task.completed ? (
                  <button
                    type="button"
                    disabled={busy === task.key || !emailVerified || !eligible}
                    onClick={() => void handleClaim(task)}
                    className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
                  >
                    {busy === task.key ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Zap className="size-3.5" />
                    )}
                    Claim reward
                  </button>
                ) : task.url ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleOpen(task)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-secondary"
                    >
                      <ExternalLink className="size-3.5 text-primary" /> Open link
                    </a>
                    <button
                      type="button"
                      disabled={busy === task.key || !opened[task.key] || !eligible}
                      onClick={() => void handleVerify(task)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-secondary disabled:opacity-50"
                    >
                      {busy === task.key ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="size-3.5 text-primary" />
                      )}
                      Verify
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {task.progress}/{task.target}
                  </span>
                )}
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${task.claimed ? 100 : pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
