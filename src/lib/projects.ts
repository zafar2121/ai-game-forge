import { supabase } from "@/integrations/supabase/client";
import type { GeneratedProject } from "@/lib/generate-project";

export type SavedProject = {
  id: string;
  title: string;
  prompt: string;
  created_at: string;
  data: GeneratedProject;
  share_id?: string;
  is_shared?: boolean;
};

export type SharedProject = {
  share_id: string;
  title: string;
  prompt: string;
  created_at: string;
  creator_name: string | null;
  data: GeneratedProject;
  user_id: string;
};

export async function saveProject(
  userId: string,
  prompt: string,
  project: GeneratedProject,
  creatorName?: string | null,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      title: project.title,
      prompt,
      creator_name: creatorName ?? null,
      data: JSON.parse(JSON.stringify(project)),
    })
    .select("share_id")
    .maybeSingle();
  if (error) throw error;
  return (data as { share_id: string } | null)?.share_id ?? null;
}

export async function listProjects(): Promise<SavedProject[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, prompt, created_at, data, share_id, is_shared")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SavedProject[];
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

/** Public read of a shared project — works for signed-out visitors. */
export async function loadSharedProject(shareId: string): Promise<SharedProject | null> {
  const { data } = await supabase
    .from("projects")
    .select("share_id, title, prompt, created_at, creator_name, data, user_id")
    .eq("share_id", shareId)
    .eq("is_shared", true)
    .maybeSingle();
  return (data as unknown as SharedProject | null) ?? null;
}

/** Owner-only: stop sharing a generated project. */
export async function unshareProject(shareId: string) {
  const { error } = await supabase
    .from("projects")
    .update({ is_shared: false })
    .eq("share_id", shareId);
  if (error) throw error;
}
