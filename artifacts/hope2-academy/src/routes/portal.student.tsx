import { useEffect, useState } from "react";
import { BookOpen, Award, Calendar, GraduationCap } from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup } from "@/components/Motion";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { mockDb } from "@/lib/mock-backend";

interface Grade { id: string; student: string; subject: string; grade: string; score: number; term: string; }
interface Assignment { id: string; title: string; due: string; status: string; }

interface StudentStats {
  activeCourses?: number;
  gpa?: string;
  upcomingTests?: number;
  attendance?: string;
  grades?: Grade[];
  className?: string | null;
}

function StudentPage() {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<number>(0);
  const [nextAssignment, setNextAssignment] = useState<Assignment | null>(null);
  const [apiStats, setApiStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stats = await apiClient.getStats() as StudentStats;
        setApiStats(stats);
        setGrades(stats.grades ?? []);
        setUpcomingTests(stats.upcomingTests ?? 0);
      } catch {
        const name = profile?.name ?? profile?.full_name ?? "";
        const allGrades = mockDb.list<Grade>("grades");
        const mine = allGrades.filter((g) => g.student === name);
        setGrades(mine.length > 0 ? mine : allGrades.slice(0, 4));

        const allExams = mockDb.list<{ status: string; class: string }>("exams");
        const grade = profile?.grade ?? "";
        const scheduledInGrade = allExams.filter((e) => e.status === "Scheduled" && e.class.includes(grade)).length;
        const scheduledAll = allExams.filter((e) => e.status === "Scheduled").length;
        setUpcomingTests(scheduledInGrade > 0 ? scheduledInGrade : scheduledAll);
      }

      try {
        const assignments = await apiClient.list<Assignment>("assignments");
        const open = assignments.filter((a) => a.status === "Open");
        setNextAssignment(open[0] ?? null);
      } catch {
        const allAssignments = mockDb.list<Assignment>("assignments");
        const open = allAssignments.filter((a) => a.status === "Open");
        setNextAssignment(open[0] ?? null);
      }
    })();
  }, [profile]);

  const name = profile?.name ?? profile?.full_name ?? "";
  const firstName = name.split(" ")[0] || "Student";
  const grade = profile?.grade ?? "—";
  const className = apiStats?.className ?? profile?.class_name ?? (grade !== "—" ? `Grade ${grade}` : null);

  const gpaLabel = apiStats?.gpa ?? (() => {
    const avgScore = grades.length > 0
      ? Math.round(grades.reduce((s, g) => s + (g.score ?? 0), 0) / grades.length)
      : 0;
    return avgScore >= 93 ? "A" : avgScore >= 90 ? "A-" : avgScore >= 87 ? "B+" : avgScore >= 83 ? "B" : avgScore >= 80 ? "B-" : "—";
  })();

  return (
    <PortalShell
      title={`Welcome, ${firstName}`}
      subtitle={className ? `${className}` : `Grade ${grade}`}
    >
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}      label="Active Courses"  value={apiStats?.activeCourses ?? (profile?.subjects?.length ?? grades.length ?? 6)} />
        <StatCard icon={Award}         label="GPA"             value={gpaLabel || "B+"} accent="accent" />
        <StatCard icon={Calendar}      label="Upcoming Tests"  value={upcomingTests}    accent="secondary" />
        <StatCard icon={GraduationCap} label="Attendance"      value={apiStats?.attendance ?? "96%"} />
      </StaggerGroup>

      <Reveal className="mt-8 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground p-8">
        <h3 className="font-display text-2xl font-semibold">Keep going.</h3>
        <p className="mt-2 text-primary-foreground/90 max-w-xl">
          {nextAssignment
            ? `Next assignment: "${nextAssignment.title}" — due ${nextAssignment.due}.`
            : "You're all caught up. Check the library for extra reading."}
        </p>
      </Reveal>

      <Reveal className="mt-6 rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]" delay={0.1}>
        <h3 className="font-display text-xl font-semibold">Recent grades</h3>
        <ul className="mt-4 divide-y divide-border">
          {grades.slice(0, 5).map((g) => (
            <li key={g.id} className="py-3 flex justify-between items-center">
              <div>
                <span className="font-medium">{g.subject}</span>
                <span className="ml-2 text-xs text-muted-foreground">{g.term}</span>
              </div>
              <span className="font-display font-bold text-primary">{g.grade}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </PortalShell>
  );
}

function RouteComponent() {
  return (
    <RequireAuth allow={["student", "superadmin"]}>
      <StudentPage />
    </RequireAuth>
  );
}

export default RouteComponent;
