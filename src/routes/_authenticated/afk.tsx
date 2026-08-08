import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Coins, Loader2, Timer } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatCredits } from "@/lib/credits";
import {
  AFK_RATE_PER_SECOND,
  AFK_TICK_MS,
  afkClaim,
  afkStop,
  afkTick,
  formatAfk,
  readAfkPending,
} from "@/lib/afk";

export const Route = createFileRoute("/_authenticated/afk")({
  head: () => ({
    meta: [
      { title: "AFK Zone — Earn Credits While Idle" },
      {
        name: "description",
        content:
          "Stay in the AFK Zone to accumulate credits at 0.0001 per second, then claim them into your main balance whenever you want.",
      },
      { property: "og:title", content: "AFK Zone — Earn Credits While Idle" },
      {
        property: "og:description",
        content:
          "Accumulate AFK credits safely on your account and claim them into your main balance at any time.",
      },
    ],
  }),
  component: AfkPage,
});

function AfkPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [pending, setPending] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    readAfkPending(user.id)
      .then((p) => alive && setPending(p))
      .catch(() => alive && setPending(0));
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const tick = useCallback(async () => {
    try {
      const next = await afkTick();
      setPending(next);
      setError(null);
    } catch {
      setError("Could not reach the server. Your pending balance is safe.");
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    activeRef.current = true;
    void tick();
    const id = window.setInterval(() => void tick(), AFK_TICK_MS);
    return () => {
      window.clearInterval(id);
      activeRef.current = false;
      void afkStop().catch(() => undefined);
    };
  }, [active, tick]);

  async function handleClaim() {
    if (claiming) return;
    setClaiming(true);
    setMessage(null);
    setError(null);
    try {
      const result = await afkClaim();
      setPending(result.pending);
      await refreshProfile();
      setMessage("Credits claimed successfully!");
    } catch {
      setError("Could not claim right now. Your pending balance is unchanged.");
    } finally {
      setClaiming(false);
    }
  }

  const perHour = AFK_RATE_PER_SECOND * 3600;

  return (
    <main className="mx-auto max-w-3xl px-5 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-semibold">AFK Zone</h1>
        <p className="mt-3 text-muted-foreground">
          Stay on this page to earn {AFK_RATE_PER_SECOND.toFixed(4)} credits per second
          ({perHour.toFixed(2)} per hour). Earnings are stored separately until you claim them.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="panel p-6">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Timer className="size-3.5 text-primary" /> AFK Pending Balance
          </p>
          <p className="mt-3 font-mono text-3xl font-semibold">
            {pending === null ? "—" : formatAfk(pending)}
          </p>
        </div>
        <div className="panel p-6">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Coins className="size-3.5 text-primary" /> Main Credit Balance
          </p>
          <p className="mt-3 font-mono text-3xl font-semibold">
            {formatCredits(profile?.credits ?? null)}
          </p>
        </div>
      </div>

      <div className="panel mt-4 flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">
            {active ? "AFK Zone active — earning credits" : "AFK Zone paused"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Unclaimed AFK credits are stored on your account and stay there until you claim them.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActive((v) => !v)}
            className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {active ? "Leave AFK Zone" : "Enter AFK Zone"}
          </button>
          <button
            type="button"
            onClick={() => void handleClaim()}
            disabled={claiming || !pending || pending <= 0}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {claiming && <Loader2 className="size-4 animate-spin" />}
            Claim Credits
          </button>
        </div>
      </div>

      {message && <p className="mt-4 text-center text-sm text-primary">{message}</p>}
      {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
    </main>
  );
}
