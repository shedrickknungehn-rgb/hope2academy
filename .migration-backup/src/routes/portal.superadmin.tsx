
import { useEffect, useState } from "react";
import { Shield, Users, GraduationCap, Database, TrendingUp } from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { mockAuth } from "@/lib/mock-backend";
import { StaggerGroup, Reveal } from "@/components/Motion";

function SuperAdminPage() {
  const [counts, setCounts] = useState({ users: 0, roles: 0 });
  useEffect(() => {
    (async () => {
      const all = await mockAuth.listUsers();
      setCounts({ users: all.length, roles: all.length });
    })();
  }, []);
  return (
    <PortalShell title="Super Admin" subtitle="Full system oversight and governance">
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={counts.users} delta="+ live" />
        <StatCard icon={Shield} label="Role Assignments" value={counts.roles} accent="accent" />
        <StatCard icon={GraduationCap} label="Active Schools" value={4} accent="secondary" />
        <StatCard icon={Database} label="System Health" value="100%" />
      </StaggerGroup>

      <Reveal className="mt-8 rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Governance</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          As Super Admin you can create administrators, transfer ownership, view audit trails and configure org-wide policies.
        </p>
        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          {["Audit Logs", "Backups", "Org Settings", "API Keys", "Permissions", "Billing"].map((x) => (
            <button key={x} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-left hover:border-primary hover:text-primary transition">
              {x}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground p-6">
        <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /><h3 className="font-display text-lg font-semibold">This week</h3></div>
        <p className="mt-2 text-primary-foreground/90">All systems nominal. Schedule a board sync to review pillar metrics.</p>
      </Reveal>
    </PortalShell>
  );
}

function RouteComponent() {
  return (
    <RequireAuth allow={["superadmin"]}>
      <SuperAdminPage />
    </RequireAuth>
  );
}

export default RouteComponent;
