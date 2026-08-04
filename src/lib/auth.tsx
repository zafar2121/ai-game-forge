import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { claimStarterCredit } from "@/lib/anti-abuse.functions";
import { PLAN_CREDITS, type Plan } from "@/lib/credits";

export type Profile = {
  user_id: string;
  email: string | null;
  plan: Plan;
  credits: number;
  last_credit_reset: string;
  created_at: string;
  email_verified?: boolean;
  starter_credit_granted?: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  emailVerified: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  spendProfileCredit: () => Promise<boolean>;
  addCredits: (amount: number) => Promise<void>;
  updatePlan: (plan: Plan) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DAY_MS = 24 * 60 * 60 * 1000;

function allowanceFor(plan: Plan) {
  const max = PLAN_CREDITS[plan];
  return Number.isFinite(max) ? max : 0;
}

async function loadProfile(user: User): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let profile = data as Profile | null;

  // First login (e.g. via Google) before the row exists.
  if (!profile) {
    const { data: created } = await supabase
      .from("profiles")
      .insert({ user_id: user.id, email: user.email ?? null })
      .select("*")
      .maybeSingle();
    profile = created as Profile | null;
  }

  if (!profile) return null;

  // Paid plans receive their credit allowance every 24 hours.
  // Free users never receive automatic credits — they earn them from Daily Tasks only.
  const verified = Boolean(user.email_confirmed_at ?? user.confirmed_at);
  const last = new Date(profile.last_credit_reset).getTime();
  if (
    verified &&
    profile.plan !== "free" &&
    Number.isFinite(last) &&
    Date.now() - last >= DAY_MS
  ) {
    const { data: reset } = await supabase
      .from("profiles")
      .update({
        credits: allowanceFor(profile.plan),
        last_credit_reset: new Date().toISOString(),
      })
      .eq("user_id", profile.user_id)
      .select("*")
      .maybeSingle();
    if (reset) profile = reset as Profile;
  }

  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      if (!next) setProfile(null);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      // The starter credit is only granted server-side after email verification.
      if (user.email_confirmed_at) {
        await claimStarterCredit().catch(() => undefined);
      }
      const p = await loadProfile(user);
      if (active) setProfile(p);
    })();
    return () => {
      active = false;
    };
  }, [user?.id, user?.email_confirmed_at]);


  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfile(await loadProfile(user));
  }, [user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const spendProfileCredit = useCallback(async () => {
    if (!profile) return false;
    if (profile.credits < 1) return false;
    const next = Math.round((profile.credits - 1) * 100) / 100;
    setProfile({ ...profile, credits: next });
    const { error } = await supabase
      .from("profiles")
      .update({ credits: next })
      .eq("user_id", profile.user_id);
    if (error) {
      setProfile(profile);
      return false;
    }
    return true;
  }, [profile]);

  const addCredits = useCallback(
    async (amount: number) => {
      if (!profile || amount <= 0) return;
      const next = Math.round((profile.credits + amount) * 100) / 100;
      const { data } = await supabase
        .from("profiles")
        .update({ credits: next })
        .eq("user_id", profile.user_id)
        .select("*")
        .maybeSingle();
      setProfile((data as Profile | null) ?? { ...profile, credits: next });
    },
    [profile],
  );

  const updatePlan = useCallback(
    async (plan: Plan) => {
      if (!profile) return;
      const { data } = await supabase
        .from("profiles")
        .update({
          plan,
          credits: allowanceFor(plan),
          last_credit_reset: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id)
        .select("*")
        .maybeSingle();
      if (data) setProfile(data as Profile);
    },
    [profile],
  );

  const emailVerified = Boolean(user?.email_confirmed_at ?? user?.confirmed_at);

  const value = useMemo(
    () => ({ session, user, profile, emailVerified, loading, refreshProfile, signOut, spendProfileCredit, addCredits, updatePlan }),
    [session, user, profile, emailVerified, loading, refreshProfile, signOut, spendProfileCredit, addCredits, updatePlan],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Credit balance for the current visitor: profile-backed when signed in, 0 for guests. */
export function useCreditBalance(): number | null {
  const { user, profile, emailVerified } = useAuth();
  if (!user) return 0;
  if (!emailVerified) return 0;
  if (!profile) return null;
  return profile.plan === "studio" ? Infinity : profile.credits;
}

/** Spend one credit through the right store for the current visitor. */
export function useSpendCredit() {
  const { user, spendProfileCredit } = useAuth();
  return useCallback(async () => {
    if (user) return spendProfileCredit();
    return false;
  }, [user, spendProfileCredit]);
}
