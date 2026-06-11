
import { useEffect, useState } from "react";
import { Heart, Users, Calendar, MessageSquare } from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup } from "@/components/Motion";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";

interface ParentStats {
  children?: Array<{ name: string; grades: unknown[]; fees: unknown[] }>;
  upcomingEvents?: number;
  outstandingFees?: number;
}

const FALLBACK_UPDATES = [
  "Parent-Teacher meeting scheduled for Friday at 4pm",
  "Vaccination drive complete — all participants healthy",
  "New library books arrived in Marshall Road campus",
];

function ParentPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<ParentStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await apiClient.getStats() as ParentStats;
        setStats(s);
      } catch { /* use fallback */ }
    })();
  }, []);

  const childCount = stats?.children?.length ?? profile?.linked_children?.length ?? 0;

  return (
    <PortalShell title="Parent Portal" subtitle="Follow your child's journey at HOPE2 ACADEMY">
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Children" value={childCount || 1} />
        <StatCard icon={Calendar} label="Next Event" value={stats?.upcomingEvents ? `${stats.upcomingEvents} upcoming` : "PTA"} accent="accent" />
        <StatCard icon={MessageSquare} label="New Messages" value={3} accent="secondary" />
        <StatCard icon={Heart} label="Account" value="Active" />
      </StaggerGroup>

      <Reveal className="mt-8 rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
        <h3 className="font-display text-xl font-semibold">Recent updates from school</h3>
        <ul className="mt-4 space-y-3">
          {FALLBACK_UPDATES.map((x) => (
            <li key={x} className="rounded-xl bg-muted/50 px-4 py-3 text-sm">{x}</li>
          ))}
        </ul>
      </Reveal>

      {stats?.children && stats.children.length > 0 && (
        <Reveal className="mt-6 rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]" delay={0.1}>
          <h3 className="font-display text-xl font-semibold">My children</h3>
          <ul className="mt-4 divide-y divide-border">
            {stats.children.map((child) => (
              <li key={child.name} className="py-3 flex items-center justify-between">
                <span className="font-medium">{child.name}</span>
                <span className="text-xs text-muted-foreground">{child.grades.length} grades on record</span>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </PortalShell>
  );
}

function RouteComponent() {
  return (
    <RequireAuth allow={["parent","superadmin"]}>
      <ParentPage />
    </RequireAuth>
  );
}

export default RouteComponent;
