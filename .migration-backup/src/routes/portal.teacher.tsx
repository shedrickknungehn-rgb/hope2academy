
import { BookOpen, Users, Calendar, ClipboardCheck } from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup } from "@/components/Motion";
import { useAuth } from "@/hooks/use-auth";

function TeacherPage() {
  const { profile } = useAuth();
  return (
    <PortalShell title="Teacher Dashboard" subtitle={profile?.department ? `${profile.department} department` : "Plan lessons, track students, log attendance"}>
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="My Students" value={42} />
        <StatCard icon={BookOpen} label="Classes Today" value={5} accent="accent" />
        <StatCard icon={ClipboardCheck} label="Pending Grades" value={18} accent="secondary" />
        <StatCard icon={Calendar} label="Next Meeting" value="Fri" />
      </StaggerGroup>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <Reveal className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
          <h3 className="font-display text-xl font-semibold">Today's schedule</h3>
          <ul className="mt-4 space-y-3">
            {[{t:"08:00",s:"Grade 5 — Mathematics"},{t:"10:00",s:"Grade 7 — Civic Education"},{t:"12:30",s:"Grade 9 — Literature"},{t:"14:00",s:"Staff briefing"}].map((x)=>(
              <li key={x.t} className="flex items-center gap-4 rounded-xl bg-muted/50 px-4 py-3">
                <span className="font-display font-semibold text-primary tabular-nums">{x.t}</span>
                <span className="text-sm">{x.s}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]" delay={0.1}>
          <h3 className="font-display text-xl font-semibold">Subjects</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {(profile?.subjects ?? ["Mathematics","Civics","Literature","Health"]).map((s)=> (
              <span key={s} className="px-3 py-1.5 rounded-full bg-accent/30 text-accent-foreground text-xs font-semibold">{s}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </PortalShell>
  );
}

function RouteComponent() {
  return (
    <RequireAuth allow={["teacher","superadmin"]}>
      <TeacherPage />
    </RequireAuth>
  );
}

export default RouteComponent;
