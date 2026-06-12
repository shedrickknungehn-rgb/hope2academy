import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiClient, type ApiUser } from "@/lib/api-client";
import { mockAuth, ROLE_LABEL, type AppRole, type MockUser } from "@/lib/mock-backend";

export type { AppRole };
export { ROLE_LABEL };

export interface SessionUser {
  $id: string;
  email: string;
  name: string;
}

export interface Profile extends Omit<MockUser, "password"> {
  $id: string;
  full_name: string;
  avatar_url?: string | null;
}

interface AuthCtx {
  user: SessionUser | null;
  profile: Profile | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function fromApiUser(u: ApiUser): Profile {
  return {
    ...u,
    $id: u.id,
    full_name: u.name,
    avatar_url: u.avatar ?? null,
    avatar: u.avatar,
    password: "",
    createdAt: u.createdAt,
  } as unknown as Profile;
}

function fromMockUser(u: MockUser): Profile {
  const { password, ...rest } = u;
  return { ...rest, $id: u.id, full_name: u.name, avatar_url: u.avatar ?? null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateFromSupabase = async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      // Ensure our DB has a row for this user, then fetch the full profile
      let apiUser: ApiUser;
      try {
        apiUser = await apiClient.syncUser();
      } catch {
        const maybe = await apiClient.getCurrent();
        if (!maybe) return false;
        apiUser = maybe;
      }

      setUser({ $id: apiUser.id, email: apiUser.email, name: apiUser.name });
      setProfile(fromApiUser(apiUser));
      return true;
    } catch {
      return false;
    }
  };

  const hydrateFromMock = async () => {
    mockAuth.init();
    const me = await mockAuth.getCurrent();
    if (me) {
      setUser({ $id: me.id, email: me.email, name: me.name });
      setProfile(fromMockUser(me));
    } else {
      setUser(null);
      setProfile(null);
    }
  };

  const hydrate = async () => {
    try {
      const ok = await hydrateFromSupabase();
      if (!ok) await hydrateFromMock();
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await hydrateFromSupabase();
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Try Supabase first
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      // hydrateFromSupabase will be triggered by onAuthStateChange
      return;
    }
    // Fall back to mock backend (demo mode)
    await mockAuth.signIn(email, password);
    await hydrateFromMock();
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await mockAuth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refresh = async () => { await hydrate(); };

  const primaryRole: AppRole | null = profile?.role ?? null;
  const roles: AppRole[] = primaryRole ? [primaryRole] : [];

  return (
    <Ctx.Provider value={{ user, profile, roles, primaryRole, loading, signIn, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
