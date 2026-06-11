import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { mockAuth, ROLE_LABEL, type AppRole, type MockUser } from "@/lib/mock-backend";
import { apiClient, isNetworkError, type ApiUser } from "@/lib/api-client";

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

function fromMockUser(u: MockUser): Profile {
  const { password, ...rest } = u;
  return { ...rest, $id: u.id, full_name: u.name, avatar_url: u.avatar ?? null };
}

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async () => {
    try {
      const apiUser = await apiClient.getCurrent();
      if (apiUser) {
        setUser({ $id: apiUser.id, email: apiUser.email, name: apiUser.name });
        setProfile(fromApiUser(apiUser));
        return;
      }
      mockAuth.init();
      const me = await mockAuth.getCurrent();
      if (me) {
        setUser({ $id: me.id, email: me.email, name: me.name });
        setProfile(fromMockUser(me));
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { hydrate(); }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const apiUser = await apiClient.signIn(email, password);
      setUser({ $id: apiUser.id, email: apiUser.email, name: apiUser.name });
      setProfile(fromApiUser(apiUser));
    } catch (e) {
      if (!isNetworkError(e)) throw e;
      await mockAuth.signIn(email, password);
      await hydrate();
    }
  };

  const signOut = async () => {
    await apiClient.signOut();
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
