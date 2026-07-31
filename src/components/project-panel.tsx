import { useState } from "react";
import {
  ChevronRight,
  Coins,
  Cpu,
  Download,
  FolderTree,
  Gem,
  Gamepad2,
  Users,
  FileCode2,
  Check,
  Copy,
  Loader2,
} from "lucide-react";
import type { GeneratedProject } from "@/lib/generate-project";
import { buildProjectZip, downloadBlob } from "@/lib/build-project-zip";


function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary">
          <Icon className="size-4" />
        </span>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function ProjectPanel({ project }: { project: GeneratedProject }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const script = project.scripts[active];

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setError(null);
    try {
      const blob = await buildProjectZip(project);
      const name =
        project.title.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") || "RobloxProject";
      downloadBlob(blob, `${name}.zip`);
    } catch (e) {
      setError(
        e instanceof Error ? `Could not create the ZIP: ${e.message}` : "Could not create the ZIP.",
      );
    } finally {
      setDownloading(false);
    }
  }


  return (
    <div className="animate-fade-in space-y-5">
      <div className="panel relative overflow-hidden p-7">
        <div className="pointer-events-none absolute inset-0 hero-glow opacity-40" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Check className="size-3" /> Project generated
          </span>
          <h2 className="mt-4 text-3xl font-semibold">{project.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section icon={FolderTree} title="Folder Structure">
          <pre className="max-h-80 overflow-auto rounded-lg bg-background/60 p-4 font-mono text-[12.5px] leading-6 text-muted-foreground">
            {project.folders.join("\n")}
          </pre>
        </Section>

        <Section icon={FileCode2} title="Lua Scripts">
          <div className="mb-3 flex flex-wrap gap-2">
            {project.scripts.map((s, i) => (
              <button
                key={s.name}
                onClick={() => {
                  setActive(i);
                  setCopied(false);
                }}
                className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                  i === active
                    ? "border-primary/40 bg-primary/12 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="relative">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(script.code);
                setCopied(true);
              }}
              className="absolute right-2 top-2 rounded-md border border-border bg-surface-2 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Copy script"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
            <p className="mb-1 font-mono text-[11px] text-muted-foreground">{script.path}</p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-background/60 p-4 font-mono text-[12.5px] leading-6 text-foreground/85">
              {script.code}
            </pre>
          </div>
        </Section>

        <Section icon={Gamepad2} title="Game Mechanics">
          <ul className="space-y-2.5">
            {project.mechanics.map((m) => (
              <li key={m} className="flex gap-2.5 text-sm text-muted-foreground">
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Users} title="NPC Systems">
          <div className="space-y-3">
            {project.npcs.map((n) => (
              <div key={n.name} className="rounded-lg border border-border bg-background/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{n.name}</p>
                  <span className="rounded-full bg-accent/12 px-2.5 py-0.5 text-[11px] text-accent">
                    {n.role}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{n.behavior}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Coins} title="Economy">
          <dl className="space-y-3">
            {project.economy.map((e) => (
              <div key={e.label} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <dt className="text-sm font-medium">{e.label}</dt>
                <dd className="mt-0.5 text-sm text-muted-foreground">{e.value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section icon={Gem} title="Monetization Ideas">
          <div className="space-y-3">
            {project.monetization.map((m) => (
              <div key={m.name} className="rounded-lg border border-border bg-background/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{m.name}</p>
                  <span className="font-mono text-xs text-primary">{m.price}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{m.detail}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="panel flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <Cpu className="size-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Export includes every script, folder map and design doc as a .rbxl-ready bundle.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:w-auto"
        >
          <Download className="size-4" />
          Download Project
        </button>
      </div>
    </div>
  );
}
