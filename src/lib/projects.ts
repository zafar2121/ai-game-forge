import { supabase } from "@/integrations/supabase/client";
import type { GeneratedProject } from "@/lib/generate-project";

export type SavedProject = {
  id: string;
  title: string;
  prompt: string;
  created_at: string;
  data: GeneratedProject;
};

export async function saveProject(userId: string, prompt: string, project: GeneratedProject) {
  const { error } = await supabase.from("projects").insert({
    user_id: userId,
    title: project.title,
    prompt,
    data: JSON.parse(JSON.stringify(project)),
  });
  if (error) throw error;
}

export async function listProjects(): Promise<SavedProject[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, prompt, created_at, data")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SavedProject[];
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}
