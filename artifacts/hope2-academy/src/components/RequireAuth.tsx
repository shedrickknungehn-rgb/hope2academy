import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/hooks/use-auth";

export function RequireAuth({ children, allow }: { children: React.ReactNode; allow?: AppRole[] }) {
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (allow && !allow.some((r) => roles.includes(r))) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center px-6">
        <div>
          <h2 className="font-display text-3xl font-semibold">Access restricted</h2>
          <p className="mt-2 text-muted-foreground">You don't have permission to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}