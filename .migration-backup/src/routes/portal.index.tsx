import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

function PortalRedirect() {
  const { loading, user, primaryRole } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }
    if (primaryRole) navigate(`/portal/${primaryRole}`);
  }, [loading, user, primaryRole, navigate]);
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default PortalRedirect;
