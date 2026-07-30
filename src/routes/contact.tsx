import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Roblox AI Builder" },
      { name: "description", content: "Get in touch with the Roblox AI Builder team." },
      { property: "og:title", content: "Contact — Roblox AI Builder" },
      { property: "og:description", content: "Get in touch with the Roblox AI Builder team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-20">
      <h1 className="text-4xl font-semibold">Contact</h1>
      <p className="mt-3 text-muted-foreground">
        Questions, feedback or partnership ideas — we read everything.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="panel p-6">
          <Mail className="size-5 text-primary" />
          <p className="mt-3 text-sm font-medium">Email</p>
          <p className="mt-1 text-sm text-muted-foreground">hello@robloxaibuilder.app</p>
        </div>
        <div className="panel p-6">
          <MessageSquare className="size-5 text-primary" />
          <p className="mt-3 text-sm font-medium">Community</p>
          <p className="mt-1 text-sm text-muted-foreground">Discord — creators & devs</p>
        </div>
      </div>
      <form className="panel mt-6 space-y-4 p-7" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="c-email" className="text-sm text-muted-foreground">
            Your email
          </label>
          <input
            id="c-email"
            type="email"
            className="mt-1.5 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label htmlFor="c-msg" className="text-sm text-muted-foreground">
            Message
          </label>
          <textarea
            id="c-msg"
            rows={4}
            className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <button type="submit" className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold">
          Send message
        </button>
      </form>
    </main>
  );
}
