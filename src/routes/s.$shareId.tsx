import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Loader2, Sparkles, Trash2, User } from "lucide-react";
import { loadSharedProject, unshareProject, type SharedProject } from "@/lib/projects";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/s/$shareId")({
  head: () => ({
    meta: [
      { title: "Shared Roblox game — ForgeBloxAI" },
      {
        name: "description",
        content: "A Roblox game concept generated with ForgeBloxAI — scripts, mechanics and more.",
      },
      { property: "og:title", content: "Shared Roblox game — ForgeBloxAI" },
      {
        property: "og:description",
        content: "View this AI-generated Roblox project and create your own with ForgeBloxAI.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const { shareId } = Route.useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadSharedProject(shareId).then((p) => {
      if (!active) return;
      setProject(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [shareId]);

  if (loading) {
    return (
      <main className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-24 text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" /> Loading shared game…
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold">This shared game is no longer available.</h1>
        <Link to="/" className="btn-primary mt-8 inline-block rounded-xl px-6 py-3 text-sm font-semibold">
          Generate Your Own Game
        </Link>
      </main>
    );
  }

  const isOwner = user?.id === project.user_id;

  return (
    <main className="relative mx-auto max-w-3xl px-5 py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] hero-glow opacity-60" />
      <div className="relative">
        <div className="panel grid h-48 place-items-center overflow-hidden bg-surface/60">
          <div className="hero-glow absolute inset-0 opacity-70" />
          <Sparkles className="relative size-10 text-primary" />
        </div>

        <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
          Made with ForgeBloxAI
        </span>
        <h1 className="mt-4 text-4xl font-semibold">{project.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <User className="size-3.5 text-primary" />
            {project.creator_name ?? "ForgeBlox creator"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" />
            {new Date(project.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="panel mt-8 p-6">
          <p className="text-sm font-medium">Prompt</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.prompt}</p>
        </div>

        <div className="panel mt-4 p-6">
          <p className="text-sm font-medium">Description</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {project.data?.description}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold">
            Generate Your Own Game
          </Link>
          {isOwner && (
            <button
              type="button"
              onClick={async () => {
                await unshareProject(project.share_id);
                setProject(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Trash2 className="size-4" /> Delete shared page
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
