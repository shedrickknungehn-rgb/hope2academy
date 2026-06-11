import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { ROLE_LABEL, type AppRole } from "@/lib/mock-backend-mobile";

export type { AppRole };
export { ROLE_LABEL };

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  full_name: string;
  avatar_url?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  emergency_contact?: string | null;
  grade?: string | null;
  class_name?: string | null;
  department?: string | null;
  subjects?: string[] | null;
  graduation_year?: number | null;
  linked_children?: string[] | null;
  createdAt?: string;
}

interface AuthCtx {
  user: { id: string; email: string; name: string } | null;
  profile: Profile | null;
  primaryRole: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function toProfile(u: any): Profile {
  return {
    ...u,
    full_name: u.name,
    avatar_url: u.avatar ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthCtx["user"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    try {
      const me = await apiClient.getMe();
      if (me) {
        setUser({ id: me.id, email: me.email, name: me.name });
        setProfile(toProfile(me));
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
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  const signOut = async () => {
    await apiClient.logout();
    setUser(null);
    setProfile(null);
  };

  const primaryRole: AppRole | null = (profile?.role as AppRole) ?? null;

  return (
    <Ctx.Provider value={{ user, profile, primaryRole, loading, signOut, refresh: hydrate }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
