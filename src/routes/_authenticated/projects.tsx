import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { ProjectPanel } from "@/components/project-panel";
import { deleteProject, listProjects, type SavedProject } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "My Projects — Roblox AI Builder" },
      {
        name: "description",
        content: "Every Roblox project you generated, saved to your account.",
      },
      { property: "og:title", content: "My Projects — Roblox AI Builder" },
      {
        property: "og:description",
        content: "Every Roblox project you generated, saved to your account.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [projects, setProjects] = useState<SavedProject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load your projects."));
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteProject(id);
      setProjects((p) => (p ?? []).filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete this project.");
    }
  }

  const open = projects?.find((p) => p.id === openId) ?? null;

  return (
    <main className="mx-auto max-w-5xl px-5 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-semibold">My Projects</h1>
        <p className="mt-3 text-muted-foreground">Everything you generated, saved to your account.</p>
      </div>

      {error && <p className="mt-6 text-center text-sm text-destructive">{error}</p>}

      {!projects && !error && (
        <div className="mt-12 flex justify-center">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}

      {projects && projects.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No saved projects yet. Generate one from the home page.
        </p>
      )}

      {projects && projects.length > 0 && (
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {projects.map((p) => (
            <div key={p.id} className="panel p-7">
              <h2 className="text-sm font-medium text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString()}
              </h2>
              <p className="mt-3 text-xl font-semibold">{p.title}</p>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.prompt}</p>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpenId(openId === p.id ? null : p.id)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  {openId === p.id ? "Hide" : "Open"}
                </button>
                <button
                  type="button"
                  aria-label="Delete project"
                  onClick={() => handleDelete(p.id)}
                  className="rounded-xl border border-border px-3 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-14">
          <ProjectPanel project={open.data} />
        </div>
      )}
    </main>
  );
}
