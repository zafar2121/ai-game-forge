import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Roblox AI Builder" },
      {
        name: "description",
        content: "Choose a new password for your Roblox AI Builder account.",
      },
      { property: "og:title", content: "Set a new password — Roblox AI Builder" },
      {
        property: "og:description",
        content: "Choose a new password for your Roblox AI Builder account.",
      },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    window.setTimeout(() => navigate({ to: "/", replace: true }), 1200);
  }

  return (
    <main className="mx-auto max-w-md px-5 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-semibold">New password</h1>
        <p className="mt-3 text-muted-foreground">Set a new password for your account.</p>
      </div>
      <div className="panel mt-10 p-7">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/50"
          />
          <button
            type="submit"
            disabled={busy}
            className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Update password
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        {done && <p className="mt-4 text-sm text-muted-foreground">Password updated. Redirecting…</p>}
      </div>
    </main>
  );
}
