import { useEffect, useState } from "react";

export type Plan = "free" | "pro" | "studio";

export const PLAN_CREDITS: Record<Plan, number> = {
  free: 3,
  pro: 10,
  studio: Infinity,
};

/** Daily credit allowance for the current plan (Infinity for studio). */
export const MAX_CREDITS = PLAN_CREDITS.free;

const KEY = "rab.credits";
const PLAN_KEY = "rab.plan";
const EVENT = "rab.credits.change";

type CreditState = { credits: number; lastReset: string };

function today() {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function readPlan(): Plan {
  if (typeof window === "undefined") return "free";
  try {
    const raw = window.localStorage.getItem(PLAN_KEY);
    if (raw === "pro" || raw === "studio" || raw === "free") return raw;
  } catch {
    /* ignore */
  }
  return "free";
}

export function setPlan(plan: Plan) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAN_KEY, plan);
  } catch {
    /* ignore */
  }
  const max = PLAN_CREDITS[plan];
  const state = read();
  // Align the balance with the new plan's daily allowance.
  write({
    credits: Number.isFinite(max) ? Math.max(Math.min(state.credits, max), max) : max,
    lastReset: state.lastReset,
  });
}

function maxCredits() {
  return PLAN_CREDITS[readPlan()];
}

function read(): CreditState {
  const max = maxCredits();
  const fallback: CreditState = { credits: max, lastReset: today() };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      write(fallback);
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<CreditState>;
    let credits =
      typeof parsed.credits === "number" && Number.isFinite(parsed.credits)
        ? Math.max(0, Math.min(max, Math.floor(parsed.credits)))
        : max;
    let lastReset = typeof parsed.lastReset === "string" ? parsed.lastReset : today();

    // Daily reset at local midnight: new local day => top up to max.
    if (lastReset !== today()) {
      credits = max;
      lastReset = today();
      write({ credits, lastReset });
    }
    return { credits, lastReset };
  } catch {
    return fallback;
  }
}

function write(state: CreditState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: state }));
}

export function spendCredit(): boolean {
  if (readPlan() === "studio") return true;
  const state = read();
  if (state.credits <= 0) return false;
  write({ credits: state.credits - 1, lastReset: state.lastReset });
  return true;
}

/** Current balance: a number, or Infinity on the studio (unlimited) plan. */
export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const sync = () =>
      setCredits(readPlan() === "studio" ? Infinity : read().credits);
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    const interval = window.setInterval(sync, 30_000);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.clearInterval(interval);
    };
  }, []);

  return credits;
}

export function formatCredits(credits: number | null) {
  if (credits === null) return "—";
  return Number.isFinite(credits) ? `${credits}` : "∞";
}
