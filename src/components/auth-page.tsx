import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type AuthMode = "login" | "signup" | "forgot";

export function AuthPage({ defaultMode }: { defaultMode: AuthMode }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [loading, user, navigate]);

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
              <Link to="/signup" className="hover:text-foreground">
                Need an account? Sign up
              </Link>
            </>
          ) : mode === "signup" ? (
            <Link to="/login" className="hover:text-foreground">
              Already have an account? Log in
            </Link>
          ) : (
            <Link to="/login" className="hover:text-foreground">
              Back to log in
            </Link>
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
