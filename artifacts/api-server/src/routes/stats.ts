/**
 * GET /api/stats — aggregated dashboard statistics for each role.
 * Requires a valid JWT; response is scoped to the caller's role.
 */
import { Router } from "express";
import { dbStore, type User } from "../lib/db-store.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/stats", requireAuth, async (req, res) => {
  const { sub, role } = req.jwtPayload!;
  const user = await dbStore.findUserById(sub);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const users       = await dbStore.listUsers();
  const students    = users.filter((u) => u.role === "student");
  const teachers    = users.filter((u) => u.role === "teacher");
  const alumni      = users.filter((u) => u.role === "alumni");

  const grades      = await dbStore.list("grades");
  const attendance  = await dbStore.list<any>("attendance");
  const assignments = await dbStore.list<any>("assignments");
  const fees        = await dbStore.list<any>("fees");
  const classes     = await dbStore.list<any>("classes");
  const behavior    = await dbStore.list<any>("behavior");
  const lessonplans = await dbStore.list<any>("lessonplans");
  const exams       = await dbStore.list<any>("exams");
  const admissions  = await dbStore.list<any>("admissions");
  const jobs        = await dbStore.list<any>("jobs");
  const events      = await dbStore.list<any>("events");
  const donations   = await dbStore.list<any>("donations");
  const scholarships= await dbStore.list<any>("scholarships");

  switch (role) {
    case "superadmin":
    case "admin": {
      const totalFees = fees.reduce((s: number, f: any) => s + Number(f.amount ?? 0), 0);
      const outstanding = fees.filter((f: any) => f.status === "Outstanding").reduce((s: number, f: any) => s + Number(f.amount ?? 0), 0);
      res.json({
        totalUsers: users.length,
        students: students.length,
        teachers: teachers.length,
        alumni: alumni.length,
        classes: classes.length,
        pendingAdmissions: admissions.filter((a: any) => a.status === "Pending" || a.status === "Interview").length,
        totalFeesUsd: totalFees,
        outstandingFeesUsd: outstanding,
      });
      break;
    }

    case "teacher": {
      const dept = user.department ?? "";
      const teacherSubjects = user.subjects ?? [];
      const myGrades = grades.filter((g: any) => teacherSubjects.includes(g.subject));
      const myAttendance = attendance.filter((a: any) =>
        teacherSubjects.some((s) => a.class.includes(s)),
      );
      const todaySlots = await (async () => {
        const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const timetable = await dbStore.list<any>("timetable");
        const tt = timetable.find((d: any) => d.day === day);
        return tt?.slots?.length ?? 0;
      })();
      res.json({
        myStudents: students.length,
        classesToday: todaySlots,
        pendingGrades: assignments.filter((a: any) => a.status === "Grading").length,
        lessonPlans: lessonplans.length,
        behaviorLogs: behavior.length,
        subjects: teacherSubjects,
        department: dept,
      });
      break;
    }

    case "student": {
      const name = user.name;
      const myGrades = grades.filter((g: any) => g.student === name);
      const avgScore = myGrades.length
        ? Math.round(myGrades.reduce((s: number, g: any) => s + (g.score ?? 0), 0) / myGrades.length)
        : 0;
      const upcomingExams = exams.filter((e: any) => e.status === "Scheduled" && (e.class ?? "").includes(user.grade ?? "")).length;
      res.json({
        activeCourses: user.subjects?.length ?? 6,
        gpa: avgScore >= 90 ? "A" : avgScore >= 80 ? "B+" : avgScore >= 70 ? "B" : "C+",
        upcomingTests: upcomingExams,
        attendance: "96%",
        grades: myGrades,
        className: user.class_name ?? null,
      });
      break;
    }

    case "parent": {
      const children = await Promise.all(
        (user.linked_children ?? []).map(async (cName: string) => {
          const childGrades = grades.filter((g: any) => g.student === cName);
          const childFees   = fees.filter((f: any) => f.student === cName);
          return { name: cName, grades: childGrades, fees: childFees };
        }),
      );
      res.json({
        children,
        upcomingEvents: events.length,
        outstandingFees: fees
          .filter((f: any) => (user.linked_children ?? []).includes(f.student) && f.status === "Outstanding")
          .reduce((s: number, f: any) => s + Number(f.amount ?? 0), 0),
      });
      break;
    }

    case "alumni": {
      res.json({
        jobListings: jobs.length,
        upcomingEvents: events.length,
        donations: donations.filter((d: any) => d.donor === user.name).length,
        scholarships: scholarships.length,
        graduationYear: user.graduation_year,
      });
      break;
    }

    default:
      res.json({});
  }
});

export default router;
