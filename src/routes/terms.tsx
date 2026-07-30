import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Roblox AI Builder" },
      { name: "description", content: "The terms that govern your use of Roblox AI Builder." },
      { property: "og:title", content: "Terms of Service — Roblox AI Builder" },
      { property: "og:description", content: "The terms that govern your use of Roblox AI Builder." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-20">
      <h1 className="text-4xl font-semibold">Terms of Service</h1>
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          By using Roblox AI Builder you agree to use generated code and design documents at your own
          discretion and to comply with the Roblox Terms of Use and Community Standards.
        </p>
        <p>
          Generated output is provided as-is. You are responsible for reviewing, testing and moderating
          any experience you publish.
        </p>
        <p>
          Roblox AI Builder is an independent tool and is not affiliated with, sponsored by, or endorsed
          by Roblox Corporation.
        </p>
        <p>These placeholder terms will be replaced before launch.</p>
      </div>
    </main>
  );
}
