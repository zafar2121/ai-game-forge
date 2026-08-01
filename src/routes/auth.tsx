import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Roblox AI Builder" },
      {
        name: "description",
        content:
          "Log in or create a free Roblox AI Builder account to save your generated projects and credits.",
      },
      { property: "og:title", content: "Sign in — Roblox AI Builder" },
      {
        property: "og:description",
        content: "Access your Roblox AI Builder account, credits and saved projects.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [loading, user, navigate]);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);

    if (mode === "forgot") {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (err) setError(err.message);
      else setNotice("Password reset link sent. Check your inbox.");
      return;
    }

    if (mode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (err) {
        setError(err.message);
        return;
      }
      if (!data.session) {
        setNotice("Account created. Check your email to confirm your address, then log in.");
        return;
      }
      navigate({ to: "/", replace: true });
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) setError(err.message);
    else navigate({ to: "/", replace: true });
  }

  return (
    <main className="mx-auto max-w-md px-5 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-semibold">
          {mode === "signup" ? "Sign up" : mode === "forgot" ? "Reset password" : "Log in"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {mode === "forgot"
            ? "We'll email you a link to set a new password."
            : "Save your generated projects and daily credits."}
        </p>
      </div>

      <div className="panel mt-10 p-7">
        {mode !== "forgot" && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Continue with Google
            </button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            className="w-full rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/50"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/50"
            />
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Log in"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        {notice && <p className="mt-4 text-sm text-muted-foreground">{notice}</p>}

        <div className="mt-6 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
          {mode === "login" ? (
            <>
              <button type="button" onClick={() => setMode("forgot")} className="hover:text-foreground">
                Forgot password?
              </button>
              <button type="button" onClick={() => setMode("signup")} className="hover:text-foreground">
                Need an account? Sign up
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setMode("login")} className="hover:text-foreground">
              Back to log in
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Back to home
        </Link>
      </p>
    </main>
  );
}
