import { supabase } from "@/integrations/supabase/client";
import type { Plan } from "@/lib/credits";
import { tasksForDay, todayKey, type TaskDef, type TaskKind } from "@/lib/tasks";

export type TaskState = TaskDef & {
  progress: number;
  completed: boolean;
  claimed: boolean;
};

type Row = {
  task_key: string;
  progress: number;
  completed: boolean;
  claimed_at: string | null;
};

/**
 * Link tasks (Discord / Telegram / YouTube) are one-time per account, so they are
 * stored on a fixed sentinel day instead of the rolling daily key.
 */
const LIFETIME_DAY = "1970-01-01";

function dayFor(def: TaskDef) {
  return def.kind === "link" ? LIFETIME_DAY : todayKey();
}

/** Only authenticated, non-Pro accounts can earn task rewards. */
export function isRewardEligible(userId: string | null | undefined, plan: Plan) {
  return Boolean(userId) && plan !== "pro";
}

async function fetchRows(userId: string, days: string[]): Promise<Row[]> {
  const { data } = await supabase
    .from("daily_tasks")
    .select("task_key, progress, completed, claimed_at")
    .eq("user_id", userId)
    .in("day", days);
  return (data ?? []) as Row[];
}

export async function loadDailyTasks(userId: string, plan: Plan): Promise<TaskState[]> {
  const day = todayKey();
  const defs = tasksForDay(plan, userId, day);
  const rows = await fetchRows(userId, [day, LIFETIME_DAY]);
  return defs.map((def) => {
    const row = rows.find((r) => r.task_key === def.key);
    const progress = Math.min(def.target, row?.progress ?? 0);
    return {
      ...def,
      progress,
      completed: row?.completed ?? progress >= def.target,
      claimed: Boolean(row?.claimed_at),
    };
  });
}

async function writeProgress(userId: string, def: TaskDef, progress: number) {
  const capped = Math.min(def.target, progress);
  await supabase.from("daily_tasks").upsert(
    {
      user_id: userId,
      day: dayFor(def),
      task_key: def.key,
      reward: def.reward,
      progress: capped,
      completed: capped >= def.target,
    },
    { onConflict: "user_id,day,task_key" },
  );
}

export type LinkProof = {
  /** The external page was actually opened in a new tab. */
  opened: boolean;
  /** The tab lost focus / visibility, i.e. the user really left for the external page. */
  leftPage: boolean;
  /** Milliseconds spent away from ForgeBloxAI. */
  awayMs: number;
};

/** Minimum time away from the app before a link task can be verified. */
export const LINK_VERIFY_MS = 15_000;

/**
 * Verify a link task. Opening the page is not enough: the visit must be proven
 * (real new tab + the user actually left this tab long enough). Returns false
 * when verification fails, leaving the task incomplete.
 */
export async function verifyLinkTask(
  userId: string | null | undefined,
  plan: Plan,
  def: TaskDef,
  proof: LinkProof,
): Promise<boolean> {
  if (!isRewardEligible(userId, plan)) return false;
  if (!proof.opened || !proof.leftPage || proof.awayMs < LINK_VERIFY_MS) return false;
  await writeProgress(userId!, def, def.target);
  return true;
}

const UNIQUE_KEY = "fbx.task.unique";

function uniqueSet(taskKey: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = JSON.parse(window.localStorage.getItem(UNIQUE_KEY) ?? "{}") as Record<
      string,
      string[]
    >;
    return new Set(raw[`${todayKey()}:${taskKey}`] ?? []);
  } catch {
    return new Set();
  }
}

function saveUniqueSet(taskKey: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.parse(window.localStorage.getItem(UNIQUE_KEY) ?? "{}") as Record<
      string,
      string[]
    >;
    raw[`${todayKey()}:${taskKey}`] = [...set];
    window.localStorage.setItem(UNIQUE_KEY, JSON.stringify(raw));
  } catch {
    /* ignore */
  }
}

/**
 * Record activity against today's assigned tasks.
 * `value` is used for threshold kinds (prompt length) and uniqueness kinds (category).
 */
export async function trackTaskEvent(
  userId: string | null | undefined,
  plan: Plan,
  kind: TaskKind,
  options: { amount?: number; value?: string | number } = {},
) {
  if (!isRewardEligible(userId, plan)) return; // guests and Pro users earn nothing
  const day = todayKey();
  const defs = tasksForDay(plan, userId!, day).filter((d) => d.kind === kind);
  if (defs.length === 0) return;
  const rows = await fetchRows(userId!, [day, LIFETIME_DAY]);

  for (const def of defs) {
    const current = rows.find((r) => r.task_key === def.key)?.progress ?? 0;
    if (current >= def.target) continue;

    if (kind === "long_prompt") {
      if (Number(options.value ?? 0) >= promptTargetOf(def)) {
        await writeProgress(userId, def, def.target);
      }
      continue;
    }
    if (kind === "categories") {
      const set = uniqueSet(def.key);
      if (options.value) set.add(String(options.value));
      saveUniqueSet(def.key, set);
      await writeProgress(userId, def, Math.max(current, set.size));
      continue;
    }
    if (kind === "active_minutes" || kind === "login_streak") {
      await writeProgress(userId, def, Math.max(current, options.amount ?? 0));
      continue;
    }
    await writeProgress(userId, def, current + (options.amount ?? 1));
  }
}

/** The prompt-length threshold is encoded in the task title. */
function promptTargetOf(def: TaskDef) {
  const match = def.title.match(/(\d+)\s+characters/);
  return match ? Number(match[1]) : 250;
}

/** Claim a completed task once; returns the reward added, or 0. */
export async function claimTask(userId: string, def: TaskDef): Promise<number> {
  const day = todayKey();
  const { data } = await supabase
    .from("daily_tasks")
    .update({ claimed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("day", day)
    .eq("task_key", def.key)
    .eq("completed", true)
    .is("claimed_at", null)
    .select("task_key");
  if (!data || data.length === 0) return 0;
  return def.reward;
}

/** Daily login streak, stored locally then mirrored to task progress. */
const STREAK_KEY = "fbx.login.streak";

export function bumpLoginStreak(): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = JSON.parse(window.localStorage.getItem(STREAK_KEY) ?? "{}") as {
      day?: string;
      count?: number;
    };
    const today = todayKey();
    if (raw.day === today) return raw.count ?? 1;
    const yesterday = todayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const count = raw.day === yesterday ? (raw.count ?? 0) + 1 : 1;
    window.localStorage.setItem(STREAK_KEY, JSON.stringify({ day: today, count }));
    return count;
  } catch {
    return 1;
  }
}
