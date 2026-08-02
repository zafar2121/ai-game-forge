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
import { PLAN_CREDITS, useCredits, type Plan } from "@/lib/credits";

export type Profile = {
  user_id: string;
  email: string | null;
  plan: Plan;
  credits: number;
  last_credit_reset: string;
  created_at: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  spendProfileCredit: () => Promise<boolean>;
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

  // Daily credit reset every 24 hours.
  const last = new Date(profile.last_credit_reset).getTime();
  if (Number.isFinite(last) && Date.now() - last >= DAY_MS) {
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
    loadProfile(user).then((p) => {
      if (active) setProfile(p);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

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
    if (profile.plan === "studio") return true;
    if (profile.credits <= 0) return false;
    const next = profile.credits - 1;
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

  const value = useMemo(
    () => ({ session, user, profile, loading, refreshProfile, signOut, spendProfileCredit, updatePlan }),
    [session, user, profile, loading, refreshProfile, signOut, spendProfileCredit, updatePlan],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Credit balance for the current visitor: profile-backed when signed in, local otherwise. */
export function useCreditBalance(): number | null {
  const { user, profile } = useAuth();
  const local = useCredits();
  if (!user) return 0;
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
