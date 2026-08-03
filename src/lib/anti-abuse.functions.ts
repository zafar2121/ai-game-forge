import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const MAX_SIGNUPS_PER_DAY = 2;

function clientIp(): string {
  const request = getRequest();
  const headers = request?.headers;
  const raw =
    headers?.get("cf-connecting-ip") ??
    headers?.get("x-real-ip") ??
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return raw || "unknown";
}

async function hashIp(ip: string): Promise<string> {
  const salt = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "forgeblox";
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Checks the per-device/IP registration quota and, when allowed, records the
 * attempt. Server-side only, so refreshing or clearing browser data cannot
 * bypass it.
 */
export const guardSignup = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ipHash = await hashIp(clientIp());
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from("signup_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (error) throw new Error("Could not verify registration limit. Please try again.");

  if ((count ?? 0) >= MAX_SIGNUPS_PER_DAY) {
    return { allowed: false as const };
  }

  await supabaseAdmin.from("signup_attempts").insert({ ip_hash: ipHash });
  return { allowed: true as const };
});

/**
 * Grants the one-time starter credit, but only once the user's email address
 * has actually been confirmed. Verified server-side against the auth user.
 */
export const claimStarterCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.auth.getUser();
    const authUser = data?.user;
    if (error || !authUser) return { verified: false as const, granted: false };

    const verified = Boolean(authUser.email_confirmed_at ?? authUser.confirmed_at);
    if (!verified) return { verified: false as const, granted: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("starter_credit_granted, credits")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!profile) return { verified: true as const, granted: false };

    if (profile.starter_credit_granted) {
      await supabaseAdmin
        .from("profiles")
        .update({ email_verified: true })
        .eq("user_id", context.userId);
      return { verified: true as const, granted: false };
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        email_verified: true,
        starter_credit_granted: true,
        credits: Math.max(profile.credits ?? 0, 1),
        last_credit_reset: new Date().toISOString(),
      })
      .eq("user_id", context.userId);

    return { verified: true as const, granted: true };
  });
