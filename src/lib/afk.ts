import { supabase } from "@/integrations/supabase/client";

/** Server-authoritative AFK earning rate, shown in the UI only. */
export const AFK_RATE_PER_SECOND = 0.0001;

/** How often the browser pings the server; the server decides what is earned. */
export const AFK_TICK_MS = 10_000;

function toNumber(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

/** Read the stored pending balance without accruing anything. */
export async function readAfkPending(userId: string): Promise<number> {
  const { data } = await supabase
    .from("profiles")
    .select("afk_pending")
    .eq("user_id", userId)
    .maybeSingle();
  return toNumber((data as { afk_pending?: number } | null)?.afk_pending);
}

/** Accrue AFK earnings server-side. Returns the new pending balance. */
export async function afkTick(): Promise<number> {
  const { data, error } = await supabase.rpc("afk_tick");
  if (error) throw error;
  return toNumber(data);
}

/** Stop accrual (leaving the zone). The pending balance is kept. */
export async function afkStop(): Promise<number> {
  const { data, error } = await supabase.rpc("afk_stop");
  if (error) throw error;
  return toNumber(data);
}

/** Atomically move the whole pending balance into the main credit balance. */
export async function afkClaim(): Promise<{ credits: number; pending: number }> {
  const { data, error } = await supabase.rpc("afk_claim");
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as
    | { credits?: number; afk_pending?: number }
    | null;
  return { credits: toNumber(row?.credits), pending: toNumber(row?.afk_pending) };
}

export function formatAfk(value: number) {
  return value.toFixed(4);
}
