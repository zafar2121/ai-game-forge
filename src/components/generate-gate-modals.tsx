import { Link } from "@tanstack/react-router";
import { Check, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tiers } from "@/lib/plans";
import type { Plan } from "@/lib/credits";
import { formatCredits } from "@/lib/credits";

export function SignInRequiredModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="panel max-w-md border-border bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Sign in required</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a free account or log in to start generating Roblox games.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row sm:justify-end">
          <Link
            to="/signup"
            className="btn-primary inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold sm:w-auto"
          >
            Sign Up
          </Link>
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:w-auto"
          >
            Log In
          </Link>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:w-auto"
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreditGateModal({
  open,
  onOpenChange,
  credits,
  currentPlan,
  onUseCredit,
  onChoosePlan,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  credits: number | null;
  currentPlan: Plan;
  onUseCredit: () => void;
  onChoosePlan: (plan: Plan) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState<Plan | null>(null);
  const hasCredits = credits === null ? false : credits > 0;

  async function choose(plan: Plan) {
    setBusy(plan);
    try {
      await onChoosePlan(plan);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="panel max-h-[88vh] max-w-3xl overflow-y-auto border-border bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {hasCredits ? "Use a credit to generate" : "You're out of credits"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {hasCredits
              ? "Each generation costs 1 credit. Upgrade any time for more."
              : "Free credits refill every 24 hours. Upgrade to keep building now."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-4 py-3 font-mono text-xs text-muted-foreground">
          <Zap className="size-3.5 text-primary" />
          Credits: {formatCredits(credits)}
        </div>

        <div className={`mt-4 grid gap-4 md:grid-cols-3 ${hasCredits ? "" : "animate-fade-in"}`}>
          {tiers.map((t) => {
            const isCurrent = currentPlan === t.plan;
            const emphasize = !hasCredits && t.plan !== "free";
            return (
              <div
                key={t.plan}
                className={`rounded-2xl border p-5 transition-colors ${
                  emphasize || t.featured ? "border-primary/45 bg-surface/60" : "border-border"
                }`}
              >
                <h3 className="text-sm font-medium text-muted-foreground">{t.name}</h3>
                <p className="mt-2 text-2xl font-semibold">
                  {t.price}
                  <span className="text-sm font-normal text-muted-foreground">{t.period}</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent || busy !== null}
                  onClick={() => void choose(t.plan)}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                    t.featured
                      ? "btn-primary"
                      : "border border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {busy === t.plan && <Loader2 className="size-3.5 animate-spin" />}
                  {isCurrent ? "Current plan" : `Choose ${t.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-5 flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasCredits}
            onClick={onUseCredit}
            className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50 sm:w-auto"
          >
            <Zap className="size-4" />
            Use 1 Credit
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
