import { useEffect, useState } from "react";

export const MAX_CREDITS = 3;
const KEY = "rab.credits";
const EVENT = "rab.credits.change";

type CreditState = { credits: number; lastReset: string };

function today() {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function read(): CreditState {
  const fallback: CreditState = { credits: MAX_CREDITS, lastReset: today() };
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
        ? Math.max(0, Math.min(MAX_CREDITS, Math.floor(parsed.credits)))
        : MAX_CREDITS;
    let lastReset = typeof parsed.lastReset === "string" ? parsed.lastReset : today();

    // Daily reset at local midnight: new local day => top up to max.
    if (lastReset !== today()) {
      credits = MAX_CREDITS;
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
  const state = read();
  if (state.credits <= 0) return false;
  write({ credits: state.credits - 1, lastReset: state.lastReset });
  return true;
}

export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setCredits(read().credits);
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
