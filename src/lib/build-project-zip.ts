import JSZip from "jszip";
import type { GeneratedProject } from "./generate-project";

/** Turn the indented folder listing into real paths. */
function resolvePaths(lines: string[]) {
  const stack: string[] = [];
  const out: { path: string; isDir: boolean }[] = [];

  for (const raw of lines) {
    if (!raw.trim()) continue;
    const indent = raw.length - raw.trimStart().length;
    const depth = Math.floor(indent / 2);
    const name = raw.trim();
    stack.length = depth;
    const isDir = name.endsWith("/") || !name.includes(".");
    const clean = name.replace(/\/$/, "").replace(/\s+\(.*\)$/, "").replace(/\s+….*$/, "");
    stack[depth] = clean;
    out.push({ path: stack.slice(0, depth + 1).join("/"), isDir });
  }
  return out;
}

export async function buildProjectZip(project: GeneratedProject): Promise<Blob> {
  const zip = new JSZip();
  const safeTitle = project.title.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") || "RobloxProject";
  const root = zip.folder(safeTitle);
  if (!root) throw new Error("Could not create project folder in ZIP");

  for (const entry of resolvePaths(project.folders)) {
    if (entry.isDir) {
      root.folder(entry.path);
    } else if (!root.file(entry.path)) {
      root.file(entry.path, "-- placeholder module\nreturn {}\n");
    }
  }

  for (const script of project.scripts) {
    root.file(script.path, script.code);
  }

  const doc = [
    `# ${project.title}`,
    "",
    project.description,
    "",
    "## Game Mechanics",
    ...project.mechanics.map((m) => `- ${m}`),
    "",
    "## NPC Systems",
    ...project.npcs.map((n) => `- **${n.name}** (${n.role}) — ${n.behavior}`),
    "",
    "## Economy",
    ...project.economy.map((e) => `- **${e.label}**: ${e.value}`),
    "",
    "## Monetization",
    ...project.monetization.map((m) => `- **${m.name}** (${m.price}) — ${m.detail}`),
    "",
    "## Folder Structure",
    "```",
    ...project.folders,
    "```",
    "",
  ].join("\n");
  root.file("README.md", doc);

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
