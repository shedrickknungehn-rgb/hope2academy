import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function toProfile(u: MockUser): Profile {
  const { password, ...rest } = u;
  return { ...rest, $id: u.id, full_name: u.name, avatar_url: u.avatar ?? null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async () => {
    try {
      mockAuth.init();
      const me = await mockAuth.getCurrent();
      if (me) {
        setUser({ $id: me.id, email: me.email, name: me.name });
        setProfile(toProfile(me));
      } else {
        setUser(null); setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { hydrate(); }, []);

  const signOut = async () => {
    await mockAuth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refresh = async () => { await hydrate(); };

  const primaryRole: AppRole | null = profile?.role ?? null;
  const roles: AppRole[] = primaryRole ? [primaryRole] : [];

  return (
    <Ctx.Provider value={{ user, profile, roles, primaryRole, loading, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}