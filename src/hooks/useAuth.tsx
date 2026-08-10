import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "approver" | "analyst";

export interface Profile {
  id: string;
  org_id: string | null;
  email: string;
  full_name: string | null;
  title: string | null;
  deactivated_at: string | null;
}

export interface Organization {
  id: string;
  name: string;
  domain: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  roles: AppRole[];
  loading: boolean;
  canApprove: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/** Compliance requirement (§2.2): auto sign-out after inactivity. */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadContext = useCallback(async (userId: string) => {
    const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("id, org_id, email, full_name, title, deactivated_at").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((profileRow as Profile) ?? null);
    setRoles(((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role));
    if (profileRow?.org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name, domain")
        .eq("id", profileRow.org_id)
        .maybeSingle();
      setOrganization((org as Organization) ?? null);
    } else {
      setOrganization(null);
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        setTimeout(() => void loadContext(nextSession.user.id), 0);
      } else {
        setProfile(null);
        setOrganization(null);
        setRoles([]);
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadContext(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadContext]);

  useEffect(() => {
    if (!session) return;
    const reset = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        void supabase.auth.signOut();
      }, IDLE_TIMEOUT_MS);
    };
    const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((event) => window.removeEventListener(event, reset));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [session]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      profile,
      organization,
      roles,
      loading,
      canApprove: roles.includes("admin") || roles.includes("approver"),
      isAdmin: roles.includes("admin"),
      refresh: async () => {
        if (user) await loadContext(user.id);
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, session, profile, organization, roles, loading, loadContext],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
