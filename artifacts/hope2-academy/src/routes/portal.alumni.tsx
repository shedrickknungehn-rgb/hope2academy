
import { Award, Users, Briefcase, Calendar } from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup } from "@/components/Motion";
import { useAuth } from "@/hooks/use-auth";

function AlumniPage() {
  const { profile } = useAuth();
  return (
    <PortalShell title="Alumni Portal" subtitle={profile?.graduation_year ? `Class of ${profile.graduation_year}` : "Stay connected with HOPE2 ACADEMY"}>
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Alumni Network" value="1,240" />
        <StatCard icon={Calendar} label="Next Reunion" value="Dec" accent="accent" />
        <StatCard icon={Briefcase} label="Job Board" value={37} accent="secondary" />
        <StatCard icon={Award} label="Mentorships" value={12} />
      </StaggerGroup>

      <Reveal className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
          <h3 className="font-display text-xl font-semibold">Give back</h3>
          <p className="mt-2 text-sm text-muted-foreground">Mentor a current student, sponsor a scholarship, or share your story with the next generation.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">Become a mentor</button>
            <button className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Sponsor a child</button>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-accent to-primary text-primary-foreground p-6">
          <h3 className="font-display text-xl font-semibold">Upcoming alumni events</h3>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
            <li>· Monrovia mixer — Aug 12</li>
            <li>· Annual reunion — Dec 21</li>
            <li>· Career fair — Jan 14</li>
          </ul>
        </div>
      </Reveal>
    </PortalShell>
  );
}

function RouteComponent() {
  return (
    <RequireAuth allow={["alumni","superadmin"]}>
      <AlumniPage />
    </RequireAuth>
  );
}

export default RouteComponent;
