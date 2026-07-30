import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Roblox AI Builder" },
      { name: "description", content: "How Roblox AI Builder handles your prompts and account data." },
      { property: "og:title", content: "Privacy Policy — Roblox AI Builder" },
      {
        property: "og:description",
        content: "How Roblox AI Builder handles your prompts and account data.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-20">
      <h1 className="text-4xl font-semibold">Privacy Policy</h1>
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          Prompts you enter are processed only to generate your project. This preview runs entirely in
          your browser with placeholder responses and stores nothing on a server.
        </p>
        <p>
          When accounts launch, we will store an email address and your generation history so you can
          return to past projects. You will be able to delete them at any time.
        </p>
        <p>We do not sell personal data. This placeholder policy will be replaced before launch.</p>
      </div>
    </main>
  );
}
