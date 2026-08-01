import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { formatCredits } from "@/lib/credits";
import { useAuth, useCreditBalance } from "@/lib/auth";

const nav = [
  { to: "/", label: "Home" },
  { to: "/templates", label: "Templates" },
  { to: "/pricing", label: "Pricing" },
] as const;

const PLAN_LABEL = { free: "Free", pro: "Pro", studio: "Studio" } as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const credits = useCreditBalance();
  const { user, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-4" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">
            Roblox AI Builder
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="rounded-lg px-3 py-2 text-sm transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/projects"
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="rounded-lg px-3 py-2 text-sm transition-colors hover:text-foreground"
            >
              My Projects
            </Link>
          )}
          <span className="ml-2 rounded-lg border border-border bg-surface/60 px-3 py-1.5 font-mono text-xs text-muted-foreground">
            ⚡ Credits: {formatCredits(credits)}
          </span>
          {user ? (
            <>
              <span className="ml-2 max-w-[200px] truncate rounded-lg border border-border bg-surface/60 px-3 py-1.5 font-mono text-xs text-muted-foreground">
                {user.email} · {PLAN_LABEL[profile?.plan ?? "free"]}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Log In
              </Link>
              <Link
                to="/auth"
                className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-border p-2 text-muted-foreground md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-5 py-3 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/projects"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              My Projects
            </Link>
          )}
          <span className="mt-1 block rounded-lg px-2 py-2.5 font-mono text-xs text-muted-foreground">
            ⚡ Credits: {formatCredits(credits)}
          </span>
          {user ? (
            <>
              <span className="block truncate rounded-lg px-2 py-2.5 font-mono text-xs text-muted-foreground">
                {user.email} · {PLAN_LABEL[profile?.plan ?? "free"]}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="block w-full rounded-lg px-2 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Log In / Sign Up
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
