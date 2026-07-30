import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Roblox AI Builder" },
      { name: "description", content: "Sign in to your Roblox AI Builder workspace." },
      { property: "og:title", content: "Login — Roblox AI Builder" },
      { property: "og:description", content: "Sign in to your Roblox AI Builder workspace." },
    ],
  }),
  component: Login,
});

function Login() {
  return (
    <main className="mx-auto flex max-w-md flex-col justify-center px-5 py-24">
      <h1 className="text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to keep your generated projects in one place.
      </p>
      <form className="panel mt-8 space-y-4 p-7" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="email" className="text-sm text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@studio.com"
            className="mt-1.5 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <button type="submit" className="btn-primary w-full rounded-xl py-3 text-sm font-semibold">
          Sign in
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Authentication is not wired up yet in this preview.
        </p>
      </form>
    </main>
  );
}
