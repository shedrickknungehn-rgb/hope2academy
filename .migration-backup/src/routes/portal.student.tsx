
import { BookOpen, Award, Calendar, GraduationCap } from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup } from "@/components/Motion";
import { useAuth } from "@/hooks/use-auth";

function StudentPage() {
  const { profile } = useAuth();
  const grade = profile?.grade ?? "—";
  return (
    <PortalShell title={`Welcome, ${profile?.full_name?.split(" ")[0] ?? "Student"}`} subtitle={`Grade ${grade} · ${profile?.class_name ?? "Class TBD"}`}>
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Active Courses" value={6} />
        <StatCard icon={Award} label="GPA" value="3.7" accent="accent" />
        <StatCard icon={Calendar} label="Upcoming Tests" value={2} accent="secondary" />
        <StatCard icon={GraduationCap} label="Attendance" value="96%" />
      </StaggerGroup>

      <Reveal className="mt-8 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground p-8">
        <h3 className="font-display text-2xl font-semibold">Keep going.</h3>
        <p className="mt-2 text-primary-foreground/90 max-w-xl">Your next assignment is due Friday. Your tutor session is Wednesday at 3pm in the library.</p>
      </Reveal>

      <Reveal className="mt-6 rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]" delay={0.1}>
        <h3 className="font-display text-xl font-semibold">Recent grades</h3>
        <ul className="mt-4 divide-y divide-border">
          {[{c:"Mathematics",g:"A-"},{c:"English",g:"B+"},{c:"Science",g:"A"},{c:"Civics",g:"A"}].map((x)=>(
            <li key={x.c} className="py-3 flex justify-between"><span>{x.c}</span><span className="font-display font-bold text-primary">{x.g}</span></li>
          ))}
        </ul>
      </Reveal>
    </PortalShell>
  );
}

function RouteComponent() {
  return (
    <RequireAuth allow={["student","superadmin"]}>
      <StudentPage />
    </RequireAuth>
  );
}

export default RouteComponent;
