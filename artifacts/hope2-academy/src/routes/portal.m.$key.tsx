import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useCallback, type ReactNode, type ReactElement } from "react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup, motion } from "@/components/Motion";
import { mockDb } from "@/lib/mock-backend";
import { apiClient, isNetworkError, mediaUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Calendar, ClipboardList, Award, Users, BookOpen, Heart,
  DollarSign, Briefcase, Library, FileText, Image as ImageIcon, Newspaper,
  MessageSquare, Megaphone, BarChart3, FolderTree, Settings, Search,
  Plus, Inbox, CheckCircle2, Upload, Download, ArrowUpRight, Sparkles,
  Trash2, Edit3, Copy, ChevronUp, ChevronDown as ChevronDownIcon, ListTree, RotateCcw, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { cmsStore, useCmsVersion, type CmsPage, type CmsMedia, type NavItem } from "@/lib/cms-store";
import { brandStore, useBrand, type BrandSettings } from "@/lib/brand";
import { heroStore, useHeroSlides, type HeroSlide } from "@/lib/hero-store";
import { teamStore, useTeamContent, type TeamMember } from "@/lib/team-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// All finances are tracked in USD; we display the LRD equivalent alongside.
// Editable rate persisted in localStorage so Admins can update it.
const LRD_KEY = "h2l.fx.lrd_per_usd";
function getLrdRate(): number {
  if (typeof localStorage === "undefined") return 200;
  const v = Number(localStorage.getItem(LRD_KEY));
  return v > 0 ? v : 200;
}
function fmtUSD(v: number | string) {
  const n = Number(v || 0);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function fmtMoney(v: number | string) {
  const n = Number(v || 0);
  const lrd = Math.round(n * getLrdRate());
  return `${fmtUSD(n)} · LRD ${lrd.toLocaleString()}`;
}

type ModuleDef = {
  title: string;
  subtitle: string;
  icon: any;
  allow?: AppRole[];
  render: () => ReactElement;
};

function Toolbar({ children, action }: { children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-9 bg-card" />
      </div>
      {children}
      {action}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] ${className}`}>{children}</div>;
}

function TableShell({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>{head.map(h => <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => (
              <motion.tr key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }} className="hover:bg-muted/30">
                {r.map((c, j) => <td key={j} className="px-5 py-3.5">{c}</td>)}
              </motion.tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-muted-foreground">No records yet.</p>}
      </div>
    </Card>
  );
}

function statusBadge(s: string) {
  const tone = s.toLowerCase();
  const cls =
    tone === "published" || tone === "paid" || tone === "active" || tone === "approved" || tone === "accepted" || tone === "enrolled"
      ? "bg-primary/10 text-primary"
      : tone === "draft" || tone === "open" || tone === "pending" || tone === "scheduled"
      ? "bg-accent/30 text-accent-foreground"
      : tone === "outstanding" || tone === "absent" || tone === "rejected"
      ? "bg-destructive/10 text-destructive"
      : tone === "submitted" || tone === "interview"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      : "bg-muted text-foreground/70";
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${cls}`}>{s}</span>;
}

// ── Role-aware workflow banner ───────────────────────────────────────────────
type WorkflowStep = { label: string; active?: boolean; done?: boolean };
function WorkflowBanner({
  icon: Icon,
  title,
  body,
  steps,
  accent = "primary",
}: {
  icon: any;
  title: string;
  body: string;
  steps?: WorkflowStep[];
  accent?: "primary" | "blue" | "accent";
}) {
  const bg = accent === "blue"
    ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
    : accent === "accent"
    ? "bg-accent/10 border-accent/30"
    : "bg-primary/8 border-primary/20";
  const iconCls = accent === "blue"
    ? "text-blue-600 dark:text-blue-400"
    : accent === "accent"
    ? "text-accent-foreground"
    : "text-primary";
  return (
    <div className={`mb-5 rounded-2xl border p-4 ${bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${iconCls}`} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
          {steps && steps.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {steps.map((s, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    s.done ? "bg-primary/10 text-primary" :
                    s.active ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-400/40" :
                    "bg-muted text-muted-foreground"
                  }`}>{s.label}</span>
                  {i < steps.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Lesson Plans — role-aware wrapper ────────────────────────────────────────
function LessonPlansModule() {
  const { primaryRole } = useAuth();
  const plans = mockDb.list<any>("lessonplans");
  const submitted = plans.filter((p: any) => p.status === "Submitted").length;
  const draft = plans.filter((p: any) => p.status === "Draft").length;

  const isTeacher = primaryRole === "teacher";
  const isAdmin = primaryRole === "admin" || primaryRole === "superadmin";

  return (
    <>
      {isTeacher && (
        <WorkflowBanner
          icon={BookOpen}
          accent="accent"
          title="Lesson plan workflow: Draft → Submit → Admin approves"
          body={`You have ${draft} draft${draft !== 1 ? "s" : ""}. When a plan is ready, edit it and change the status to "Submitted" — the admin will then review and approve it.`}
          steps={[
            { label: "Draft", done: false, active: true },
            { label: "Submitted" },
            { label: "Approved" },
          ]}
        />
      )}
      {isAdmin && submitted > 0 && (
        <WorkflowBanner
          icon={CheckCircle2}
          accent="primary"
          title={`${submitted} lesson plan${submitted !== 1 ? "s" : ""} awaiting your approval`}
          body='Open any plan with status "Submitted" and change it to "Approved" to complete the review cycle.'
          steps={[
            { label: "Draft", done: true },
            { label: "Submitted", active: true },
            { label: "Approved" },
          ]}
        />
      )}
      {isAdmin && submitted === 0 && (
        <WorkflowBanner
          icon={CheckCircle2}
          accent="primary"
          title="Lesson plan review queue is clear"
          body="Teachers submit plans for your approval here. Approve them to publish for the teacher's record."
          steps={[
            { label: "Draft" },
            { label: "Submitted" },
            { label: "Approved" },
          ]}
        />
      )}
      <SimpleCrud
        collection="lessonplans"
        itemLabel="lesson plan"
        createLabel={isTeacher ? "New lesson plan" : isAdmin ? "Create lesson plan" : "New lesson plan"}
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "subject", label: "Subject", type: "text", required: true },
          { name: "class", label: "Class", type: "text", required: true },
          { name: "week", label: "Week", type: "text", placeholder: "Week 4" },
          { name: "objectives", label: "Objectives", type: "textarea", required: true },
          { name: "status", label: "Status", type: "select", options: isTeacher ? ["Draft", "Submitted"] : ["Draft", "Submitted", "Approved"], required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "subject", label: "Subject" },
          { key: "class", label: "Class" },
          { key: "week", label: "Week" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    </>
  );
}

// ── Behavior & Discipline — role-aware wrapper ────────────────────────────────
function BehaviorModule() {
  const { primaryRole } = useAuth();
  const isTeacher = primaryRole === "teacher";
  const isAdmin = primaryRole === "admin" || primaryRole === "superadmin";
  const records = mockDb.list<any>("behavior");
  const warnings = records.filter((r: any) => r.type === "Warning" || r.type === "Detention" || r.type === "Suspension").length;

  return (
    <>
      {isTeacher && (
        <WorkflowBanner
          icon={ClipboardList}
          accent="accent"
          title="Log behavior incidents and commendations"
          body="Every entry you submit is reviewed by the Admin. Use commendations liberally — they go on the student's record."
        />
      )}
      {isAdmin && warnings > 0 && (
        <WorkflowBanner
          icon={CheckCircle2}
          accent="blue"
          title={`${warnings} disciplinary record${warnings !== 1 ? "s" : ""} on file`}
          body="Teachers log behavior events here. Review serious incidents (Detention/Suspension) and follow up with parents as needed."
        />
      )}
      <SimpleCrud
        collection="behavior"
        itemLabel="entry"
        createLabel={isTeacher ? "Log entry" : "Add entry"}
        fields={[
          { name: "student", label: "Student", type: "text", required: true },
          { name: "class", label: "Class", type: "text" },
          { name: "type", label: "Type", type: "select", options: ["Commendation", "Warning", "Detention", "Suspension", "Note"], required: true },
          { name: "description", label: "Description", type: "textarea", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "reporter", label: "Reported by", type: "text", required: true },
        ]}
        columns={[
          { key: "student", label: "Student", render: (v) => <span className="font-medium">{v}</span> },
          { key: "type", label: "Type", render: (v) => <Badge variant="secondary">{v}</Badge> },
          { key: "date", label: "Date" },
          { key: "reporter", label: "Reporter" },
        ]}
      />
    </>
  );
}

// ── Admissions — role-aware wrapper ──────────────────────────────────────────
function AdmissionsModule() {
  const { primaryRole } = useAuth();
  const isAdmin = primaryRole === "admin" || primaryRole === "superadmin";
  const apps = mockDb.list<any>("admissions");
  const pending = apps.filter((a: any) => a.status === "Pending").length;
  const interview = apps.filter((a: any) => a.status === "Interview").length;

  return (
    <>
      {isAdmin && (pending + interview) > 0 && (
        <WorkflowBanner
          icon={Inbox}
          accent="blue"
          title={`${pending + interview} application${(pending + interview) !== 1 ? "s" : ""} need attention`}
          body={`${pending} pending review${pending !== 1 ? "s" : ""}, ${interview} at interview stage. Move each through the pipeline: Pending → Interview → Accepted / Enrolled.`}
          steps={[
            { label: "Pending", active: pending > 0, done: false },
            { label: "Interview", active: interview > 0 },
            { label: "Accepted" },
            { label: "Enrolled" },
          ]}
        />
      )}
      {isAdmin && (pending + interview) === 0 && (
        <WorkflowBanner
          icon={Inbox}
          accent="primary"
          title="Admissions pipeline"
          body="Process incoming applications: move them from Pending → Interview → Accepted → Enrolled. Rejected applications are archived automatically."
          steps={[
            { label: "Pending" },
            { label: "Interview" },
            { label: "Accepted" },
            { label: "Enrolled" },
          ]}
        />
      )}
      <SimpleCrud
        collection="admissions"
        itemLabel="application"
        createLabel="New application"
        fields={[
          { name: "applicant", label: "Applicant name", type: "text", required: true },
          { name: "grade", label: "Applying for grade", type: "select", required: true,
            options: ["ABC", "Nursery", "KG-1", "KG-2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
          { name: "guardian", label: "Parent/Guardian", type: "text", required: true },
          { name: "phone", label: "Phone", type: "text" },
          { name: "submitted", label: "Submitted", type: "date", required: true },
          { name: "status", label: "Status", type: "select", required: true,
            options: ["Pending", "Interview", "Accepted", "Enrolled", "Rejected", "Waitlist"] },
        ]}
        columns={[
          { key: "applicant", label: "Applicant", render: (v) => <span className="font-medium">{v}</span> },
          { key: "grade", label: "Grade" },
          { key: "guardian", label: "Guardian" },
          { key: "submitted", label: "Submitted" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    </>
  );
}

const MODULES: Record<string, ModuleDef> = {
  classes: {
    title: "Classes", subtitle: "All active classes across campuses", icon: GraduationCap,
    render: () => <ClassesModule/>,
  },
  assignments: {
    title: "Assignments", subtitle: "Track open and graded work", icon: ClipboardList,
    render: () => <AssignmentsModule/>,
  },
  grades: {
    title: "Grades", subtitle: "Scores by student and subject", icon: Award,
    render: () => (
      <>
        <GradesStats/>
        <SimpleCrud
          collection="grades"
          itemLabel="grade entry"
          fields={[
            { name: "student", label: "Student", type: "text", required: true },
            { name: "subject", label: "Subject", type: "text", required: true },
            { name: "score", label: "Score (0-100)", type: "number", required: true },
            { name: "grade", label: "Letter grade", type: "text", required: true, placeholder: "A, B+, …" },
            { name: "term", label: "Term", type: "select", options: ["Term 1","Term 2","Term 3"], required: true },
          ]}
          columns={[
            { key: "student", label: "Student" },
            { key: "subject", label: "Subject" },
            { key: "score", label: "Score", render: (v) => `${v}%` },
            { key: "grade", label: "Grade", render: (v) => <span className="font-display font-bold text-primary">{v}</span> },
            { key: "term", label: "Term" },
          ]}
        />
      </>
    ),
  },
  attendance: {
    title: "Attendance", subtitle: "Daily roll-call across classes", icon: Calendar,
    render: () => (
      <SimpleCrud
        collection="attendance"
        itemLabel="attendance record"
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          { name: "class", label: "Class", type: "text", required: true },
          { name: "present", label: "Present", type: "number", required: true },
          { name: "absent", label: "Absent", type: "number", required: true },
          { name: "late", label: "Late", type: "number" },
        ]}
        columns={[
          { key: "date", label: "Date" },
          { key: "class", label: "Class" },
          { key: "present", label: "Present" },
          { key: "absent", label: "Absent" },
          { key: "late", label: "Late" },
        ]}
      />
    ),
  },
  timetable: {
    title: "Timetable", subtitle: "Weekly schedule", icon: Calendar,
    render: () => <TimetableModule/>,
  },
  announcements: {
    title: "Announcements", subtitle: "School-wide notices", icon: Megaphone,
    render: () => (
      <SimpleCrud
        collection="announcements"
        itemLabel="announcement"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "audience", label: "Audience", type: "select", options: ["All","Students","Parents","Staff","Alumni"], required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "body", label: "Body", type: "textarea", required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "audience", label: "Audience", render: (v) => <Badge variant="secondary">{v}</Badge> },
          { key: "date", label: "Date" },
        ]}
      />
    ),
  },
  messages: {
    title: "Messages", subtitle: "Direct messages and broadcasts", icon: MessageSquare,
    render: () => <MessagesModule/>,
  },
  fees: {
    title: "Fees & Donations", subtitle: "Track tuition and contributions", icon: DollarSign,
    render: () => (
      <>
        <FeesStats/>
        <SimpleCrud
          collection="fees"
          itemLabel="fee"
          fields={[
            { name: "student", label: "Student", type: "text", required: true },
            { name: "item", label: "Item", type: "text", required: true, placeholder: "Term tuition, Lab fee…" },
            { name: "amount", label: "Amount (USD)", type: "number", required: true },
            { name: "due", label: "Due date", type: "date", required: true },
            { name: "status", label: "Status", type: "select", options: ["Outstanding","Paid"], required: true },
          ]}
          columns={[
            { key: "student", label: "Student" },
            { key: "item", label: "Item" },
            { key: "amount", label: "Amount (USD · LRD)", render: (v) => fmtMoney(v) },
            { key: "due", label: "Due" },
            { key: "status", label: "Status", render: (v) => statusBadge(v) },
          ]}
        />
      </>
    ),
  },
  children: {
    title: "My Children", subtitle: "Linked student records", icon: Heart,
    render: () => <ChildrenModule/>,
  },
  events: {
    title: "Events & Reunions", subtitle: "Upcoming alumni events", icon: Calendar,
    render: () => (
      <SimpleCrud
        collection="events"
        itemLabel="event"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "location", label: "Location", type: "text", required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "date", label: "Date" },
          { key: "location", label: "Location" },
        ]}
      />
    ),
  },
  jobs: {
    title: "Job Board", subtitle: "Opportunities shared with our network", icon: Briefcase,
    render: () => (
      <SimpleCrud
        collection="jobs"
        itemLabel="job"
        createLabel="Post a job"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "company", label: "Company", type: "text", required: true },
          { name: "location", label: "Location", type: "text", required: true },
          { name: "posted", label: "Posted", type: "date", required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "company", label: "Company" },
          { key: "location", label: "Location" },
          { key: "posted", label: "Posted" },
        ]}
      />
    ),
  },
  directory: {
    title: "Alumni Directory", subtitle: "Reconnect with classmates", icon: Users,
    render: () => (
      <SimpleCrud
        collection="directory"
        itemLabel="alumni"
        createLabel="Add alumni"
        fields={[
          { name: "name", label: "Name", type: "text", required: true },
          { name: "year", label: "Graduation year", type: "number", required: true },
          { name: "role", label: "Current role", type: "text" },
          { name: "city", label: "City", type: "text" },
        ]}
        columns={[
          { key: "name", label: "Name", render: (v) => <span className="font-medium">{v}</span> },
          { key: "year", label: "Class of" },
          { key: "role", label: "Role" },
          { key: "city", label: "City" },
        ]}
      />
    ),
  },
  mentorship: {
    title: "Mentorship", subtitle: "Guide a current student", icon: Heart,
    render: () => (
      <Card className="p-8 text-center">
        <Heart className="h-10 w-10 text-primary mx-auto"/>
        <h3 className="mt-3 font-display text-2xl font-semibold">Become a mentor</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">Pair with a student in their final two years and meet monthly. We provide structure, you provide perspective.</p>
        <Button className="mt-5" onClick={()=>toast.success("Application submitted — our team will reach out")}>Sign me up</Button>
      </Card>
    ),
  },
  donations: {
    title: "Donations", subtitle: "Recent contributions to the school", icon: DollarSign,
    render: () => (
      <>
        <DonationsStats/>
        <SimpleCrud
          collection="donations"
          itemLabel="donation"
          createLabel="Record donation"
          fields={[
            { name: "donor", label: "Donor", type: "text", required: true },
            { name: "fund", label: "Fund", type: "select", options: ["Scholarship","Capital","Library","General"], required: true },
            { name: "amount", label: "Amount (USD)", type: "number", required: true },
            { name: "date", label: "Date", type: "date", required: true },
          ]}
          columns={[
            { key: "donor", label: "Donor" },
            { key: "fund", label: "Fund" },
            { key: "amount", label: "Amount (USD · LRD)", render: (v) => fmtMoney(v) },
            { key: "date", label: "Date" },
          ]}
        />
      </>
    ),
  },
  library: {
    title: "Library", subtitle: "Catalog and availability", icon: Library,
    render: () => (
      <SimpleCrud
        collection="library"
        itemLabel="book"
        createLabel="Add title"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "author", label: "Author", type: "text", required: true },
          { name: "available", label: "Copies available", type: "number", required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "author", label: "Author" },
          { key: "available", label: "Available" },
        ]}
      />
    ),
  },
  resources: {
    title: "Teaching Resources", subtitle: "Shared documents for staff", icon: Library,
    render: () => (
      <SimpleCrud
        collection="resources"
        itemLabel="resource"
        createLabel="Add resource"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "type", label: "Type", type: "select", options: ["PDF","DOCX","XLSX","Link"], required: true },
          { name: "size", label: "Size", type: "text", placeholder: "1.2 MB" },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "type", label: "Type" },
          { key: "size", label: "Size" },
        ]}
      />
    ),
  },
  // ----- CMS / Super-admin
  pages: {
    title: "Pages (CMS)", subtitle: "Manage public website pages", icon: FileText,
    allow: ["superadmin", "admin"],
    render: () => <PagesModule/>,
  },
  posts: {
    title: "Posts & Stories", subtitle: "Editorial content for the website", icon: Newspaper,
    render: () => (
      <SimpleCrud
        collection="posts"
        itemLabel="post"
        createLabel="Write a post"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "author", label: "Author", type: "text", required: true },
          { name: "status", label: "Status", type: "select", options: ["Draft","Published"], required: true },
          { name: "date", label: "Date", type: "date", required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "author", label: "Author" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
          { key: "date", label: "Date" },
        ]}
      />
    ),
  },
  media: {
    title: "Media Library", subtitle: "Images, videos and documents", icon: ImageIcon,
    allow: ["superadmin", "admin"],
    render: () => <MediaModule/>,
  },
  navigation: {
    title: "Navigation",
    subtitle: "Manage the public website menu",
    icon: ListTree,
    allow: ["superadmin"],
    render: () => <NavigationModule/>,
  },
  settings: {
    title: "Site Settings", subtitle: "Branding, contact, logo & system text — Super Admin / Admin only", icon: Settings,
    allow: ["superadmin", "admin"],
    render: () => <SiteSettingsModule />,
  },
  departments: {
    title: "Departments", subtitle: "Organisational structure", icon: FolderTree,
    render: () => (
      <SimpleCrud
        collection="departments"
        itemLabel="department"
        createLabel="Add department"
        fields={[
          { name: "name", label: "Department name", type: "text", required: true },
          { name: "lead", label: "Department lead", type: "text", required: true },
          { name: "staff", label: "Staff count", type: "number", required: true },
        ]}
        columns={[
          { key: "name", label: "Name", render: (v) => <span className="font-medium">{v}</span> },
          { key: "lead", label: "Lead" },
          { key: "staff", label: "Staff" },
        ]}
      />
    ),
  },
  audit: {
    title: "Audit Logs", subtitle: "Recent administrator activity", icon: ClipboardList,
    allow: ["superadmin"],
    render: () => <AuditModule/>,
  },
  analytics: {
    title: "Analytics", subtitle: "Real-time platform health", icon: BarChart3,
    render: () => (
      <>
        <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard icon={Users} label="Active users (7d)" value={184} delta="+12%"/>
          <StatCard icon={BookOpen} label="Classes" value={42} accent="accent"/>
          <StatCard icon={ClipboardList} label="Assignments" value={89} accent="secondary"/>
          <StatCard icon={Heart} label="Donations (mo)" value="$3,240"/>
        </StaggerGroup>
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Engagement by role</h3>
          <div className="space-y-3">
            {[
              { r: "Students", v: 92 }, { r: "Teachers", v: 78 }, { r: "Parents", v: 64 },
              { r: "Alumni", v: 41 }, { r: "Admin", v: 96 },
            ].map(b => (
              <div key={b.r}>
                <div className="flex justify-between text-sm"><span>{b.r}</span><span className="font-semibold">{b.v}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${b.v}%` }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }} className="h-full bg-gradient-to-r from-primary to-accent"/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </>
    ),
  },
};

// Append additional modules (hero editor + new school modules)
Object.assign(MODULES, {
  hero: {
    title: "Hero Slider", subtitle: "Manage homepage carousel images, captions and CTAs",
    icon: ImageIcon, allow: ["superadmin", "admin"],
    render: () => <HeroSliderModule/>,
  },
  team: {
    title: "Team Page", subtitle: "Edit the public Team page — heading, copy, quote and member cards",
    icon: Users, allow: ["superadmin", "admin"],
    render: () => <TeamPageModule/>,
  },
  admissions: {
    title: "Admissions", subtitle: "Application pipeline & enrolment", icon: Inbox,
    allow: ["superadmin", "admin"],
    render: () => <AdmissionsModule />,
  },
  exams: {
    title: "Exams & Report Cards", subtitle: "Schedule term exams and publish report cards",
    icon: Award,
    render: () => (
      <SimpleCrud
        collection="exams"
        itemLabel="exam"
        createLabel="Schedule exam"
        fields={[
          { name: "subject", label: "Subject", type: "text", required: true },
          { name: "class", label: "Class", type: "text", required: true },
          { name: "term", label: "Term", type: "select", options: ["Term 1","Term 2","Term 3","Mid-Term","Final"], required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "room", label: "Room", type: "text" },
          { name: "status", label: "Status", type: "select", options: ["Scheduled","In Progress","Completed","Published"], required: true },
        ]}
        columns={[
          { key: "subject", label: "Subject", render: (v) => <span className="font-medium">{v}</span> },
          { key: "class", label: "Class" },
          { key: "term", label: "Term" },
          { key: "date", label: "Date" },
          { key: "room", label: "Room" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  behavior: {
    title: "Behavior & Discipline", subtitle: "Log incidents and commendations", icon: CheckCircle2,
    allow: ["superadmin", "admin", "teacher"],
    render: () => <BehaviorModule />,
  },
  lessonplans: {
    title: "Lesson Plans", subtitle: "Teacher planning and curriculum tracking",
    icon: BookOpen, allow: ["superadmin", "admin", "teacher"],
    render: () => <LessonPlansModule />,
  },
  transport: {
    title: "Transport & Bus Routes", subtitle: "School bus routes and rider rosters",
    icon: FolderTree, allow: ["superadmin", "admin"],
    render: () => (
      <SimpleCrud
        collection="transport"
        itemLabel="route"
        createLabel="Add route"
        fields={[
          { name: "route", label: "Route", type: "text", required: true, placeholder: "Marshall Road Loop" },
          { name: "driver", label: "Driver", type: "text", required: true },
          { name: "vehicle", label: "Vehicle / Plate", type: "text" },
          { name: "departure", label: "Departure", type: "text", placeholder: "06:30" },
          { name: "riders", label: "Riders", type: "number", required: true },
          { name: "feeUsd", label: "Monthly fee (USD)", type: "number" },
        ]}
        columns={[
          { key: "route", label: "Route", render: (v) => <span className="font-medium">{v}</span> },
          { key: "driver", label: "Driver" },
          { key: "vehicle", label: "Vehicle" },
          { key: "departure", label: "Departs" },
          { key: "riders", label: "Riders" },
          { key: "feeUsd", label: "Fee/mo (USD · LRD)", render: (v) => fmtMoney(v) },
        ]}
      />
    ),
  },
  clinic: {
    title: "Clinic & Health Records", subtitle: "Health log and immunisations",
    icon: Heart, allow: ["superadmin", "admin"],
    render: () => (
      <SimpleCrud
        collection="clinic"
        itemLabel="health record"
        createLabel="Add record"
        fields={[
          { name: "student", label: "Student", type: "text", required: true },
          { name: "visitDate", label: "Visit date", type: "date", required: true },
          { name: "reason", label: "Reason", type: "text", required: true },
          { name: "action", label: "Action taken", type: "textarea" },
          { name: "nurse", label: "Attended by", type: "text" },
          { name: "status", label: "Status", type: "select", options: ["Treated","Referred","Monitoring"], required: true },
        ]}
        columns={[
          { key: "student", label: "Student", render: (v) => <span className="font-medium">{v}</span> },
          { key: "visitDate", label: "Date" },
          { key: "reason", label: "Reason" },
          { key: "nurse", label: "Nurse" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  calendar: {
    title: "School Calendar", subtitle: "Holidays, exam weeks and school events",
    icon: Calendar,
    render: () => (
      <SimpleCrud
        collection="calendar"
        itemLabel="calendar entry"
        createLabel="Add entry"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "type", label: "Type", type: "select", options: ["Holiday","Exam","Event","PTA","Sports","Devotion"], required: true },
          { name: "startDate", label: "Start", type: "date", required: true },
          { name: "endDate", label: "End", type: "date" },
          { name: "audience", label: "Audience", type: "select", options: ["All","Students","Parents","Staff","Alumni"] },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "type", label: "Type", render: (v) => <Badge variant="secondary">{v}</Badge> },
          { key: "startDate", label: "Start" },
          { key: "endDate", label: "End" },
          { key: "audience", label: "Audience" },
        ]}
      />
    ),
  },
  inventory: {
    title: "Assets & Inventory", subtitle: "School equipment, supplies and stock",
    icon: FolderTree, allow: ["superadmin", "admin"],
    render: () => (
      <SimpleCrud
        collection="inventory"
        itemLabel="item"
        createLabel="Add item"
        fields={[
          { name: "item", label: "Item", type: "text", required: true },
          { name: "category", label: "Category", type: "select", options: ["Furniture","Electronics","Books","Stationery","Sports","Lab","Vehicle"], required: true },
          { name: "quantity", label: "Quantity", type: "number", required: true },
          { name: "location", label: "Location", type: "text" },
          { name: "condition", label: "Condition", type: "select", options: ["New","Good","Fair","Damaged"], required: true },
        ]}
        columns={[
          { key: "item", label: "Item", render: (v) => <span className="font-medium">{v}</span> },
          { key: "category", label: "Category" },
          { key: "quantity", label: "Qty" },
          { key: "location", label: "Location" },
          { key: "condition", label: "Condition", render: (v) => <Badge variant="secondary">{v}</Badge> },
        ]}
      />
    ),
  },
  staff: {
    title: "Staff & HR", subtitle: "Employees, contracts and payroll snapshots",
    icon: Users, allow: ["superadmin", "admin"],
    render: () => (
      <SimpleCrud
        collection="staff"
        itemLabel="staff member"
        createLabel="Add staff"
        fields={[
          { name: "name", label: "Full name", type: "text", required: true },
          { name: "role", label: "Role", type: "text", required: true, placeholder: "Teacher, Bursar…" },
          { name: "department", label: "Department", type: "select",
            options: ["HOPE2 MISSION","HOPE2 ACADEMY","HOPE2 CHURCH","HOPE2 MEDIA"], required: true },
          { name: "phone", label: "Phone", type: "text" },
          { name: "salaryUsd", label: "Monthly salary (USD)", type: "number" },
          { name: "status", label: "Status", type: "select", options: ["Active","On Leave","Terminated"], required: true },
        ]}
        columns={[
          { key: "name", label: "Name", render: (v) => <span className="font-medium">{v}</span> },
          { key: "role", label: "Role" },
          { key: "department", label: "Department" },
          { key: "salaryUsd", label: "Salary (USD · LRD)", render: (v) => fmtMoney(v) },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  scholarships: {
    title: "Scholarships & Sponsorships", subtitle: "Sponsored students and award tracking",
    icon: Award, allow: ["superadmin", "admin"],
    render: () => (
      <SimpleCrud
        collection="scholarships"
        itemLabel="scholarship"
        createLabel="Add scholarship"
        fields={[
          { name: "student", label: "Student", type: "text", required: true },
          { name: "sponsor", label: "Sponsor", type: "text", required: true },
          { name: "amountUsd", label: "Award amount (USD)", type: "number", required: true },
          { name: "term", label: "Term", type: "select", options: ["Term 1","Term 2","Term 3","Annual"], required: true },
          { name: "status", label: "Status", type: "select", options: ["Active","Paid","Outstanding","Ended"], required: true },
        ]}
        columns={[
          { key: "student", label: "Student", render: (v) => <span className="font-medium">{v}</span> },
          { key: "sponsor", label: "Sponsor" },
          { key: "amountUsd", label: "Amount (USD · LRD)", render: (v) => fmtMoney(v) },
          { key: "term", label: "Term" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
} satisfies Record<string, ModuleDef>);

// =========================================================================
// CMS — Pages module
// =========================================================================
function PagesModule() {
  useCmsVersion();
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");

  const pages = cmsStore.listPages().filter(p =>
    !q || p.title.toLowerCase().includes(q.toLowerCase()) || p.slug.toLowerCase().includes(q.toLowerCase())
  );

  const remove = (p: CmsPage) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    cmsStore.deletePage(p.id);
    toast.success("Page deleted");
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search pages…" className="pl-9 bg-card" />
        </div>
        <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/> New page</Button>
      </div>

      <TableShell
        head={["Title", "Slug", "Status", "Updated", ""]}
        rows={pages.map(p => [
          <span className="font-medium">{p.title}</span>,
          <code className="text-xs text-muted-foreground">{p.slug}</code>,
          statusBadge(p.status),
          p.updated,
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={()=>setEditing(p)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
            <Button size="sm" variant="ghost" onClick={()=>remove(p)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </div>,
        ])}
      />

      {(editing || creating) && (
        <PageEditor
          page={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </>
  );
}

function PageEditor({ page, onClose }: { page: CmsPage | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<CmsPage>>(page ?? { title: "", slug: "/", body: "", status: "Draft" });
  const save = (status?: "Draft" | "Published") => {
    if (!form.title || !form.slug) { toast.error("Title and slug are required"); return; }
    if (!form.slug.startsWith("/")) form.slug = "/" + form.slug;
    const saved = cmsStore.upsertPage({ ...form, status: status ?? form.status });
    toast.success(`Saved "${saved.title}"${saved.status === "Published" ? " — published" : ""}`);
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{page ? "Edit page" : "New page"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={form.title ?? ""} onChange={e=>setForm({...form, title:e.target.value})} placeholder="About Us"/></div>
            <div><Label>Slug</Label><Input value={form.slug ?? ""} onChange={e=>setForm({...form, slug:e.target.value})} placeholder="/about"/></div>
          </div>
          <div>
            <Label>Excerpt</Label>
            <Input value={form.excerpt ?? ""} onChange={e=>setForm({...form, excerpt:e.target.value})} placeholder="Short summary shown in listings"/>
          </div>
          <div>
            <Label>Body (Markdown)</Label>
            <Textarea rows={10} value={form.body ?? ""} onChange={e=>setForm({...form, body:e.target.value})} placeholder="Write your page content here…"/>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>SEO title</Label><Input value={form.seoTitle ?? ""} onChange={e=>setForm({...form, seoTitle:e.target.value})}/></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status ?? "Draft"} onValueChange={(v)=>setForm({...form, status: v as any})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>SEO description</Label>
            <Textarea rows={2} value={form.seoDescription ?? ""} onChange={e=>setForm({...form, seoDescription:e.target.value})}/>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={()=>save("Draft")}>Save draft</Button>
          <Button onClick={()=>save("Published")}>Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// CMS — Media Library
// =========================================================================
function MediaModule() {
  useCmsVersion();
  const [folder, setFolder] = useState<string>("All");
  const [renaming, setRenaming] = useState<CmsMedia | null>(null);
  const media = cmsStore.listMedia();
  const folders = ["All", ...Array.from(new Set(media.map(m => m.folder))).filter(Boolean)];
  const filtered = folder === "All" ? media : media.filter(m => m.folder === folder);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const limit = 4 * 1024 * 1024;
    for (const f of Array.from(files)) {
      if (f.size > limit) { toast.error(`${f.name} is larger than 4 MB`); continue; }
      try {
        const url = await apiClient.uploadFile(f);
        cmsStore.addMedia({ name: f.name, type: f.type || "application/octet-stream", size: f.size, folder: folder === "All" ? "Uploads" : folder, url });
      } catch { toast.error(`Failed to upload ${f.name}`); }
    }
    toast.success("Upload complete");
  };

  const fmt = (b: number) => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(1)} MB`;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2 overflow-x-auto">
          {folders.map(f => (
            <button key={f} onClick={()=>setFolder(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${folder===f ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:bg-muted/70"}`}>{f}</button>
          ))}
        </div>
        <div className="flex-1"/>
        <label className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium cursor-pointer hover:opacity-90">
          <Upload className="h-4 w-4"/> Upload media
          <input type="file" multiple className="hidden" onChange={e=>{ onUpload(e.target.files); e.currentTarget.value=""; }}/>
        </label>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="h-10 w-10 text-primary/70 mx-auto"/>
          <h3 className="mt-3 font-display text-xl font-semibold">No media yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload images, videos or documents to use across the site.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m, i) => (
            <Reveal key={m.id} delay={i*0.03}>
              <Card className="overflow-hidden group">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/20 grid place-items-center overflow-hidden">
                  {m.type.startsWith("image/") ? (
                    <img src={mediaUrl(m.url)} alt={m.alt ?? m.name} className="h-full w-full object-cover"/>
                  ) : m.type.startsWith("video/") ? (
                    <video src={mediaUrl(m.url)} className="h-full w-full object-cover" muted/>
                  ) : (
                    <FileText className="h-10 w-10 text-primary/70"/>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate" title={m.name}>{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.folder} · {fmt(m.size)}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={()=>{ navigator.clipboard.writeText(mediaUrl(m.url)); toast.success("URL copied"); }}><Copy className="h-3.5 w-3.5"/></Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={()=>setRenaming(m)}><Edit3 className="h-3.5 w-3.5"/></Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2 ml-auto" onClick={()=>{ cmsStore.deleteMedia(m.id); toast.success("Removed"); }}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}

      {renaming && (
        <Dialog open onOpenChange={(o)=>!o && setRenaming(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit media</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>File name</Label><Input value={renaming.name} onChange={e=>setRenaming({...renaming, name:e.target.value})}/></div>
              <div><Label>Folder</Label><Input value={renaming.folder} onChange={e=>setRenaming({...renaming, folder:e.target.value})}/></div>
              <div><Label>Alt text</Label><Input value={renaming.alt ?? ""} onChange={e=>setRenaming({...renaming, alt:e.target.value})}/></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setRenaming(null)}>Cancel</Button>
              <Button onClick={()=>{ cmsStore.updateMedia(renaming.id, { name: renaming.name, folder: renaming.folder, alt: renaming.alt }); toast.success("Saved"); setRenaming(null); }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// =========================================================================
// CMS — Navigation Manager
// =========================================================================
function NavigationModule() {
  useCmsVersion();
  const [items, setItems] = useState<NavItem[]>(() => cmsStore.listNav());
  const dirty = JSON.stringify(items) !== JSON.stringify(cmsStore.listNav());

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  const moveChild = (pi: number, ci: number, dir: -1 | 1) => {
    const parent = items[pi]; if (!parent.children) return;
    const j = ci + dir; if (j < 0 || j >= parent.children.length) return;
    const cs = [...parent.children]; [cs[ci], cs[j]] = [cs[j], cs[ci]];
    const next = [...items]; next[pi] = { ...parent, children: cs }; setItems(next);
  };
  const update = (i: number, patch: Partial<NavItem>) => {
    const next = [...items]; next[i] = { ...next[i], ...patch }; setItems(next);
  };
  const updateChild = (pi: number, ci: number, patch: Partial<NavItem["children"] extends (infer T)[] | undefined ? T : never>) => {
    const parent = items[pi]; if (!parent.children) return;
    const cs = [...parent.children]; cs[ci] = { ...cs[ci], ...patch } as any;
    const next = [...items]; next[pi] = { ...parent, children: cs }; setItems(next);
  };
  const addItem = () => setItems([...items, { id: cmsStore.newId(), label: "New link", to: "/" }]);
  const addChild = (pi: number) => {
    const parent = items[pi];
    const cs = parent.children ?? [];
    const next = [...items];
    next[pi] = { ...parent, to: undefined, children: [...cs, { id: cmsStore.newId(), label: "New sub-link", to: "/" }] };
    setItems(next);
  };
  const removeItem = (i: number) => setItems(items.filter((_, x) => x !== i));
  const removeChild = (pi: number, ci: number) => {
    const parent = items[pi]; if (!parent.children) return;
    const cs = parent.children.filter((_, x) => x !== ci);
    const next = [...items];
    next[pi] = { ...parent, children: cs.length ? cs : undefined };
    setItems(next);
  };

  return (
    <>
      <Card className="p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold">Public website menu</h3>
          <p className="text-sm text-muted-foreground">Drag-free editor: reorder, add or remove items. Changes apply immediately on save.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={addItem}><Plus className="h-4 w-4"/> Add item</Button>
        <Button variant="ghost" className="gap-2" onClick={()=>{ if(confirm("Reset to defaults?")) { cmsStore.resetNav(); setItems(cmsStore.listNav()); toast.success("Reset to defaults"); } }}><RotateCcw className="h-4 w-4"/> Reset</Button>
        <Button disabled={!dirty} onClick={()=>{ cmsStore.saveNav(items); toast.success("Menu published"); }}>Save changes</Button>
      </Card>

      <div className="space-y-3">
        {items.map((it, i) => (
          <Card key={it.id} className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>move(i,-1)} disabled={i===0}><ChevronUp className="h-4 w-4"/></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>move(i,1)} disabled={i===items.length-1}><ChevronDownIcon className="h-4 w-4"/></Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 flex-1">
                <div><Label className="text-xs">Label</Label><Input value={it.label} onChange={e=>update(i,{ label: e.target.value })}/></div>
                <div><Label className="text-xs">Path {it.children && it.children.length > 0 && <span className="text-muted-foreground">(ignored — has children)</span>}</Label>
                  <Input value={it.to ?? ""} placeholder="/about" disabled={!!(it.children && it.children.length>0)} onChange={e=>update(i,{ to: e.target.value })}/>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={()=>addChild(i)}><Plus className="h-3.5 w-3.5"/>Sub-link</Button>
                <Button size="sm" variant="ghost" onClick={()=>removeItem(i)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
              </div>
            </div>

            {it.children && it.children.length > 0 && (
              <div className="mt-4 pl-6 border-l-2 border-muted space-y-2">
                {it.children.map((c, ci) => (
                  <div key={c.id} className="flex flex-col md:flex-row md:items-center gap-2 bg-muted/30 rounded-lg p-2.5">
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=>moveChild(i,ci,-1)} disabled={ci===0}><ChevronUp className="h-3 w-3"/></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=>moveChild(i,ci,1)} disabled={ci===(it.children!.length-1)}><ChevronDownIcon className="h-3 w-3"/></Button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 flex-1">
                      <Input value={c.label} onChange={e=>updateChild(i,ci,{ label: e.target.value } as any)} placeholder="Label"/>
                      <Input value={c.to} onChange={e=>updateChild(i,ci,{ to: e.target.value } as any)} placeholder="/path"/>
                      <Input value={c.description ?? ""} onChange={e=>updateChild(i,ci,{ description: e.target.value } as any)} placeholder="Short description"/>
                    </div>
                    <Button size="icon" variant="ghost" onClick={()=>removeChild(i,ci)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

// =========================================================================
// Extracted async modules: Timetable, Children, Audit
// =========================================================================
function TimetableModule() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("timetable").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("timetable"));
    });
  }, []);
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {data.map((d: any, i) => (
        <Reveal key={d.day ?? i} delay={i * 0.05}>
          <Card className="p-5">
            <h3 className="font-display text-lg font-semibold">{d.day}</h3>
            <ul className="mt-3 space-y-2">
              {(d.slots ?? []).map((s: any) => (
                <li key={s.t + s.s} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
                  <span className="font-display font-semibold text-primary tabular-nums w-14">{s.t}</span>
                  <span className="text-sm">{s.s}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}

function ChildrenModule() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("children").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("children"));
    });
  }, []);
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {data.map((c: any, i) => (
        <Reveal key={c.id ?? i} delay={i * 0.05}>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground grid place-items-center font-bold text-xl">
                {c.name?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-display text-lg font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.grade}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="font-display font-bold text-primary text-lg">{c.attendance}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">GPA</p>
                <p className="font-display font-bold text-primary text-lg">{c.gpa}</p>
              </div>
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}

function AuditModule() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("audit").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("audit"));
    });
  }, []);
  return (
    <TableShell
      head={["When", "Actor", "Action"]}
      rows={data.map(a => [a.at, a.actor, a.action])}
    />
  );
}

function ModuleRoute() {
  const { key } = useParams<{ key: string }>();
  const def = key ? MODULES[key] : undefined;

  if (!def) {
    return (
      <RequireAuth>
        <PortalShell title="Module not found" subtitle={`No module is registered at /portal/m/${key}`}>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">This module hasn't been wired up yet.</p>
            <Link to="/portal" className="mt-4 inline-flex text-primary font-semibold underline">Back to portal</Link>
          </Card>
        </PortalShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allow={def.allow}>
      <PortalShell title={def.title} subtitle={def.subtitle}>
        {def.render()}
      </PortalShell>
    </RequireAuth>
  );
}

export default ModuleRoute;

// =========================================================================
// Site Settings — deep editor for brand, contact, logo, colors and system text
// Editable by Super Admin and Admin. Persists via brandStore (localStorage).
// =========================================================================
function SiteSettingsModule() {
  const brand = useBrand();
  const [form, setForm] = useState<BrandSettings>(brand);
  const [tab, setTab] = useState<"brand" | "contact" | "appearance" | "system">("brand");
  const dirty = JSON.stringify(form) !== JSON.stringify(brand);

  const set = <K extends keyof BrandSettings>(k: K, v: BrandSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onLogo = async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Logo must be under 4 MB"); return; }
    try {
      const url = await apiClient.uploadFile(file);
      set("logoUrl", url);
      toast.success("Logo updated — click Save to publish");
    } catch { toast.error("Logo upload failed"); }
  };
  const onFavicon = async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Favicon must be under 4 MB"); return; }
    try {
      const url = await apiClient.uploadFile(file);
      set("faviconUrl", url);
      toast.success("Favicon updated — click Save to publish");
    } catch { toast.error("Favicon upload failed"); }
  };

  const save = () => {
    brandStore.set(form);
    toast.success("Site settings published");
  };
  const reset = () => {
    if (!confirm("Reset all branding to defaults? This cannot be undone.")) return;
    const d = brandStore.reset();
    setForm(d);
    toast.success("Restored defaults");
  };

  const TabBtn = ({ id, label }: { id: typeof tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
        tab === id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
      }`}
    >{label}</button>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold">Brand & system settings</h3>
          <p className="text-sm text-muted-foreground">Changes apply instantly everywhere — navbar, footer, sidebar, login, chatbot.</p>
        </div>
        <Button variant="ghost" className="gap-2" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset to defaults</Button>
        <Button disabled={!dirty} onClick={save}>Save changes</Button>
      </Card>

      <div className="flex flex-wrap gap-2">
        <TabBtn id="brand" label="Brand & Identity" />
        <TabBtn id="contact" label="Contact & Address" />
        <TabBtn id="appearance" label="Appearance & Logo" />
        <TabBtn id="system" label="System Text" />
      </div>

      {tab === "brand" && (
        <Card className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Full name</Label><Input value={form.name} onChange={(e)=>set("name", e.target.value)} placeholder="HOPE2 ACADEMY"/></div>
            <div><Label>Short name</Label><Input value={form.shortName} onChange={(e)=>set("shortName", e.target.value)}/></div>
          </div>
          <div><Label>Tagline</Label><Input value={form.tagline} onChange={(e)=>set("tagline", e.target.value)}/></div>
          <div><Label>Motto</Label><Input value={form.motto} onChange={(e)=>set("motto", e.target.value)}/></div>
          <div><Label>Year established</Label><Input value={form.established} onChange={(e)=>set("established", e.target.value)} className="max-w-[180px]"/></div>
        </Card>
      )}

      {tab === "contact" && (
        <Card className="p-6 space-y-4">
          <div><Label>Street address</Label><Input value={form.address} onChange={(e)=>set("address", e.target.value)}/></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>City / county</Label><Input value={form.city} onChange={(e)=>set("city", e.target.value)}/></div>
            <div><Label>Country</Label><Input value={form.country} onChange={(e)=>set("country", e.target.value)}/></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Contact email</Label><Input type="email" value={form.email} onChange={(e)=>set("email", e.target.value)}/></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e)=>set("phone", e.target.value)}/></div>
          </div>
          <div><Label>Office hours</Label><Input value={form.officeHours} onChange={(e)=>set("officeHours", e.target.value)} placeholder="Mon–Fri · 7:00 AM – 4:00 PM"/></div>
        </Card>
      )}

      {tab === "appearance" && (
        <Card className="p-6 space-y-6">
          <div>
            <Label>Primary logo</Label>
            <div className="mt-2 flex items-center gap-5">
              <img src={mediaUrl(form.logoUrl)} alt="Logo preview" className="h-24 w-24 rounded-full object-cover ring-2 ring-border bg-white" />
              <div className="space-y-2">
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e)=>onLogo(e.target.files?.[0] ?? null)}/>
                <label htmlFor="logo-upload"><Button asChild className="gap-2"><span><Upload className="h-4 w-4"/>Upload new logo</span></Button></label>
                <p className="text-xs text-muted-foreground">PNG, JPG or SVG up to 4 MB. Used in navbar, footer, sidebar, login & chatbot.</p>
                <Input value={form.logoUrl} onChange={(e)=>set("logoUrl", e.target.value)} placeholder="…or paste an image URL" className="text-xs"/>
              </div>
            </div>
          </div>
          <div>
            <Label>Favicon</Label>
            <div className="mt-2 flex items-center gap-5">
              <img src={mediaUrl(form.faviconUrl)} alt="Favicon preview" className="h-12 w-12 rounded object-cover ring-1 ring-border bg-white" />
              <div className="space-y-2">
                <input id="fav-upload" type="file" accept="image/*" className="hidden" onChange={(e)=>onFavicon(e.target.files?.[0] ?? null)}/>
                <label htmlFor="fav-upload"><Button asChild variant="outline" className="gap-2"><span><Upload className="h-4 w-4"/>Upload favicon</span></Button></label>
                <Input value={form.faviconUrl} onChange={(e)=>set("faviconUrl", e.target.value)} placeholder="…or paste an image URL" className="text-xs"/>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Primary colour</Label>
              <div className="flex items-center gap-3 mt-1">
                <input type="color" value={form.primaryHex} onChange={(e)=>set("primaryHex", e.target.value)} className="h-10 w-14 rounded border border-border"/>
                <Input value={form.primaryHex} onChange={(e)=>set("primaryHex", e.target.value)}/>
              </div>
            </div>
            <div>
              <Label>Accent colour</Label>
              <div className="flex items-center gap-3 mt-1">
                <input type="color" value={form.accentHex} onChange={(e)=>set("accentHex", e.target.value)} className="h-10 w-14 rounded border border-border"/>
                <Input value={form.accentHex} onChange={(e)=>set("accentHex", e.target.value)}/>
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === "system" && (
        <Card className="p-6 space-y-4">
          <div>
            <Label>Footer blurb</Label>
            <Textarea rows={3} value={form.footerBlurb} onChange={(e)=>set("footerBlurb", e.target.value)}/>
          </div>
          <div>
            <Label>Chatbot greeting</Label>
            <Textarea rows={3} value={form.chatGreeting} onChange={(e)=>set("chatGreeting", e.target.value)}/>
            <p className="text-xs text-muted-foreground mt-1">First message visitors see when they open the live chat.</p>
          </div>
          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold mb-2">Public pages (CMS)</h4>
            <p className="text-sm text-muted-foreground mb-3">Edit page text, SEO and navigation in the dedicated CMS modules.</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/portal/m/pages" className="inline-flex"><Button variant="outline" className="gap-2"><FileText className="h-4 w-4"/>Pages</Button></Link>
              <Link to="/portal/m/posts" className="inline-flex"><Button variant="outline" className="gap-2"><Newspaper className="h-4 w-4"/>Posts</Button></Link>
              <Link to="/portal/m/media" className="inline-flex"><Button variant="outline" className="gap-2"><ImageIcon className="h-4 w-4"/>Media</Button></Link>
              <Link to="/portal/m/navigation" className="inline-flex"><Button variant="outline" className="gap-2"><ListTree className="h-4 w-4"/>Navigation</Button></Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// =========================================================================
// Generic CRUD helper — drives most list modules
// =========================================================================
type FieldDef = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};
type ColumnDef = { key: string; label: string; render?: (value: any, row: any) => ReactNode };

function SimpleCrud({
  collection,
  itemLabel,
  createLabel,
  fields,
  columns,
}: {
  collection: string;
  itemLabel: string;
  createLabel?: string;
  fields: FieldDef[];
  columns: ColumnDef[];
}) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [all, setAll] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.list(collection);
      setAll(data as any[]);
    } catch (e) {
      if (isNetworkError(e)) setAll(mockDb.list<any>(collection));
    }
  }, [collection]);

  useEffect(() => { load(); }, [load]);

  const rows = all.filter((r) =>
    !q || columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

  const remove = async (row: any) => {
    if (!confirm(`Delete this ${itemLabel}?`)) return;
    try {
      await apiClient.remove(collection, row.id);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not delete"); return; }
      mockDb.remove(collection, row.id);
    }
    toast.success(`${cap(itemLabel)} deleted`);
    load();
  };

  const handleSave = async (values: Record<string, any>) => {
    const normalized: any = {};
    for (const f of fields) {
      const v = values[f.name];
      normalized[f.name] = f.type === "number" ? Number(v ?? 0) : v ?? "";
    }
    try {
      if (editing) {
        await apiClient.update(collection, editing.id, normalized);
      } else {
        await apiClient.create(collection, normalized);
      }
      toast.success(`${cap(itemLabel)} ${editing ? "updated" : "created"}`);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not save"); return; }
      if (editing) mockDb.update(collection, editing.id, normalized);
      else mockDb.create(collection, normalized);
      toast.success(`${cap(itemLabel)} ${editing ? "updated" : "created"}`);
    }
    setEditing(null);
    setCreating(false);
    load();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${itemLabel}s…`} className="pl-9 bg-card" />
        </div>
        <Button className="gap-2" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> {createLabel ?? `New ${itemLabel}`}
        </Button>
      </div>
      <TableShell
        head={[...columns.map((c) => c.label), ""]}
        rows={rows.map((r) => [
          ...columns.map((c) => (c.render ? c.render(r[c.key], r) : (r[c.key] ?? "—"))),
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(r)}>
              <Edit3 className="h-3.5 w-3.5" />Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove(r)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>,
        ])}
      />
      {(editing || creating) && (
        <SimpleEditor
          itemLabel={itemLabel}
          fields={fields}
          row={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}

function SimpleEditor({
  itemLabel, fields, row, onClose, onSave,
}: {
  itemLabel: string;
  fields: FieldDef[];
  row: any | null;
  onClose: () => void;
  onSave: (values: Record<string, any>) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of fields) init[f.name] = row?.[f.name] ?? (f.type === "number" ? 0 : "");
    return init;
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    for (const f of fields) {
      if (f.required && (form[f.name] === "" || form[f.name] === null || form[f.name] === undefined)) {
        toast.error(`${f.label} is required`); return;
      }
    }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{row ? `Edit ${itemLabel}` : `New ${itemLabel}`}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <Label>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
              {f.type === "textarea" ? (
                <Textarea rows={4} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} placeholder={f.placeholder} />
              ) : f.type === "select" ? (
                <Select value={String(form[f.name] ?? "")} onValueChange={(v) => setForm({ ...form, [f.name]: v })}>
                  <SelectTrigger><SelectValue placeholder={f.placeholder ?? "Select…"} /></SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={f.type}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin"/>}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// Hero Slider — admin module to edit homepage slides without redeploying
// =========================================================================
function HeroSliderModule() {
  const slides = useHeroSlides();
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [creating, setCreating] = useState(false);

  const remove = (s: HeroSlide) => {
    if (!confirm(`Delete slide "${s.title} ${s.titleAccent}"?`)) return;
    heroStore.remove(s.id); toast.success("Slide removed");
  };
  const toggle = (s: HeroSlide) => {
    heroStore.upsert({ ...s, enabled: !s.enabled });
  };
  const reset = () => {
    if (!confirm("Reset hero slides to defaults? Custom slides will be lost.")) return;
    heroStore.reset(); toast.success("Slides reset to defaults");
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {slides.length} slide{slides.length === 1 ? "" : "s"} · {slides.filter(s=>s.enabled).length} active on the homepage carousel.
          </p>
        </div>
        <Button variant="ghost" className="gap-2" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset</Button>
        <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/>New slide</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {slides.map((s, i) => (
          <Reveal key={s.id} delay={i*0.04}>
            <Card className="overflow-hidden">
              <div className="aspect-[16/9] bg-muted relative">
                {s.img && <img src={mediaUrl(s.img)} alt={s.alt} className="absolute inset-0 h-full w-full object-cover"/>}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent"/>
                <div className="absolute bottom-3 left-3 right-3 text-background">
                  <p className="text-[10px] uppercase tracking-wider opacity-90">{s.kicker}</p>
                  <p className="font-display font-bold text-lg leading-tight">{s.title} <span className="text-accent">{s.titleAccent}</span></p>
                </div>
                {!s.enabled && (
                  <span className="absolute top-3 left-3 rounded-full bg-foreground/70 text-background px-2 py-0.5 text-[10px] font-semibold">Hidden</span>
                )}
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{s.body}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{s.primaryLabel} → {s.primaryTo}</Badge>
                  <Badge variant="outline">{s.secondaryLabel} → {s.secondaryTo}</Badge>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={()=>heroStore.move(s.id, -1)} disabled={i===0} aria-label="Move up"><ChevronUp className="h-4 w-4"/></Button>
                  <Button size="sm" variant="outline" onClick={()=>heroStore.move(s.id, 1)} disabled={i===slides.length-1} aria-label="Move down"><ChevronDownIcon className="h-4 w-4"/></Button>
                  <Button size="sm" variant="outline" onClick={()=>toggle(s)}>{s.enabled ? "Hide" : "Show"}</Button>
                  <Button size="sm" variant="outline" className="gap-1.5 ml-auto" onClick={()=>setEditing(s)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={()=>remove(s)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      {(editing || creating) && (
        <HeroSlideEditor
          slide={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </>
  );
}

function HeroSlideEditor({ slide, onClose }: { slide: HeroSlide | null; onClose: () => void }) {
  const [form, setForm] = useState<HeroSlide>(() => slide ?? {
    id: heroStore.newId(), img: "", alt: "",
    kicker: "", title: "", titleAccent: "", body: "",
    primaryLabel: "Learn more", primaryTo: "/about",
    secondaryLabel: "Contact us", secondaryTo: "/contact",
    enabled: true,
  });
  const set = <K extends keyof HeroSlide>(k: K, v: HeroSlide[K]) => setForm(f => ({ ...f, [k]: v }));

  const onImage = async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Image must be under 4 MB"); return; }
    try {
      const url = await apiClient.uploadFile(file);
      set("img", url);
      toast.success("Image attached — click Save to publish");
    } catch { toast.error("Image upload failed"); }
  };

  const save = () => {
    if (!form.title.trim() || !form.img.trim()) {
      toast.error("Image and title are required"); return;
    }
    heroStore.upsert(form);
    toast.success(`Slide ${slide ? "updated" : "added"} — live on the homepage`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{slide ? "Edit slide" : "New slide"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Image</Label>
            <div className="mt-2 flex items-start gap-4">
              <div className="h-24 w-40 rounded-lg overflow-hidden bg-muted shrink-0">
                {form.img ? <img src={mediaUrl(form.img)} alt="preview" className="h-full w-full object-cover"/> : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">No image</div>}
              </div>
              <div className="flex-1 space-y-2">
                <input id="hero-upload" type="file" accept="image/*" className="hidden" onChange={(e)=>onImage(e.target.files?.[0] ?? null)}/>
                <label htmlFor="hero-upload"><Button asChild variant="outline" className="gap-2"><span><Upload className="h-4 w-4"/>Upload image</span></Button></label>
                <Input value={form.img} onChange={(e)=>set("img", e.target.value)} placeholder="…or paste an image URL" className="text-xs"/>
              </div>
            </div>
          </div>
          <div><Label>Alt text</Label><Input value={form.alt} onChange={(e)=>set("alt", e.target.value)} placeholder="Describe the image for accessibility"/></div>
          <div><Label>Kicker (small uppercase label)</Label><Input value={form.kicker} onChange={(e)=>set("kicker", e.target.value)} placeholder="HOPE2 MISSION · Capacity Building"/></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e)=>set("title", e.target.value)} placeholder="Raising leaders"/></div>
            <div><Label>Title accent (highlighted)</Label><Input value={form.titleAccent} onChange={(e)=>set("titleAccent", e.target.value)} placeholder="rooted in purpose"/></div>
          </div>
          <div><Label>Body copy</Label><Textarea rows={3} value={form.body} onChange={(e)=>set("body", e.target.value)}/></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Primary button text</Label><Input value={form.primaryLabel} onChange={(e)=>set("primaryLabel", e.target.value)}/></div>
            <div><Label>Primary button link</Label><Input value={form.primaryTo} onChange={(e)=>set("primaryTo", e.target.value)} placeholder="/get-involved"/></div>
            <div><Label>Secondary button text</Label><Input value={form.secondaryLabel} onChange={(e)=>set("secondaryLabel", e.target.value)}/></div>
            <div><Label>Secondary button link</Label><Input value={form.secondaryTo} onChange={(e)=>set("secondaryTo", e.target.value)} placeholder="/about"/></div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={(e)=>set("enabled", e.target.checked)} className="h-4 w-4"/>
            Show this slide on the public homepage
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save slide</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// Stat strips for modules that need quick KPIs above the CRUD table
// =========================================================================

// =========================================================================
// Team Page editor — edit public Team page content + member cards
// =========================================================================
function TeamPageModule() {
  const content = useTeamContent();
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [creating, setCreating] = useState(false);

  const removeMember = (m: TeamMember) => {
    if (!confirm(`Delete member "${m.name}"?`)) return;
    teamStore.removeMember(m.id); toast.success("Member removed");
  };
  const toggle = (m: TeamMember) => teamStore.upsertMember({ ...m, enabled: !m.enabled });
  const reset = () => {
    if (!confirm("Reset Team page to defaults? Edits will be lost.")) return;
    teamStore.reset(); toast.success("Team page reset");
  };

  return (
    <>
      <Card className="p-5 mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Page copy</p>
          <Button variant="ghost" size="sm" className="gap-2" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset all</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Eyebrow</Label><Input value={content.eyebrow} onChange={(e)=>teamStore.setContent({ eyebrow: e.target.value })}/></div>
          <div><Label>Section heading</Label><Input value={content.sectionHeading} onChange={(e)=>teamStore.setContent({ sectionHeading: e.target.value })}/></div>
        </div>
        <div><Label>Hero title</Label><Input value={content.title} onChange={(e)=>teamStore.setContent({ title: e.target.value })}/></div>
        <div><Label>Hero lead</Label><Textarea rows={2} value={content.lead} onChange={(e)=>teamStore.setContent({ lead: e.target.value })}/></div>
        <div><Label>Section lead</Label><Textarea rows={2} value={content.sectionLead} onChange={(e)=>teamStore.setContent({ sectionLead: e.target.value })}/></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Closing quote</Label><Textarea rows={2} value={content.quote} onChange={(e)=>teamStore.setContent({ quote: e.target.value })}/></div>
          <div><Label>Quote attribution</Label><Input value={content.quoteAuthor} onChange={(e)=>teamStore.setContent({ quoteAuthor: e.target.value })}/></div>
        </div>
        <p className="text-xs text-muted-foreground">Changes save automatically and appear on the public /team page immediately.</p>
      </Card>

      <div className="flex items-center gap-3 mb-4">
        <p className="text-sm text-muted-foreground flex-1">{content.members.length} member{content.members.length===1?"":"s"} · {content.members.filter(m=>m.enabled).length} shown publicly</p>
        <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/>Add member</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.members.map((m, i) => (
          <Card key={m.id} className="overflow-hidden">
            <div className="aspect-[4/3] bg-muted relative">
              {m.img && <img src={mediaUrl(m.img)} alt={m.name} className="absolute inset-0 h-full w-full object-cover"/>}
              {!m.enabled && <span className="absolute top-2 left-2 rounded-full bg-foreground/70 text-background px-2 py-0.5 text-[10px] font-semibold">Hidden</span>}
            </div>
            <div className="p-4 space-y-2">
              <p className="font-semibold leading-tight">{m.name}</p>
              <p className="text-xs text-secondary font-medium">{m.role}</p>
              {m.bio && <p className="text-xs text-muted-foreground line-clamp-2">{m.bio}</p>}
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={()=>teamStore.moveMember(m.id, -1)} disabled={i===0}><ChevronUp className="h-4 w-4"/></Button>
                <Button size="sm" variant="outline" onClick={()=>teamStore.moveMember(m.id, 1)} disabled={i===content.members.length-1}><ChevronDownIcon className="h-4 w-4"/></Button>
                <Button size="sm" variant="outline" onClick={()=>toggle(m)}>{m.enabled?"Hide":"Show"}</Button>
                <Button size="sm" variant="outline" className="gap-1.5 ml-auto" onClick={()=>setEditing(m)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
                <Button size="sm" variant="ghost" onClick={()=>removeMember(m)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {(editing || creating) && (
        <TeamMemberEditor member={editing} onClose={()=>{ setEditing(null); setCreating(false); }}/>
      )}
    </>
  );
}

function TeamMemberEditor({ member, onClose }: { member: TeamMember | null; onClose: () => void }) {
  const [form, setForm] = useState<TeamMember>(() => member ?? {
    id: teamStore.newId(), img: "", name: "", role: "", bio: "", email: "", linkedin: "", enabled: true,
  });
  const set = <K extends keyof TeamMember>(k: K, v: TeamMember[K]) => setForm(f => ({ ...f, [k]: v }));
  const onImage = async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Image must be under 4 MB"); return; }
    try {
      const url = await apiClient.uploadFile(file);
      set("img", url); toast.success("Photo attached — click Save");
    } catch { toast.error("Photo upload failed"); }
  };
  const save = () => {
    if (!form.name.trim() || !form.role.trim()) { toast.error("Name and role are required"); return; }
    teamStore.upsertMember(form);
    toast.success(`Member ${member ? "updated" : "added"}`); onClose();
  };
  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{member ? "Edit member" : "Add member"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Photo</Label>
            <div className="mt-2 flex items-start gap-4">
              <div className="h-24 w-24 rounded-lg overflow-hidden bg-muted shrink-0">
                {form.img ? <img src={mediaUrl(form.img)} alt="preview" className="h-full w-full object-cover"/> : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">No photo</div>}
              </div>
              <div className="flex-1 space-y-2">
                <input id="tm-upload" type="file" accept="image/*" className="hidden" onChange={(e)=>onImage(e.target.files?.[0] ?? null)}/>
                <label htmlFor="tm-upload"><Button asChild variant="outline" className="gap-2"><span><Upload className="h-4 w-4"/>Upload photo</span></Button></label>
                <Input value={form.img} onChange={(e)=>set("img", e.target.value)} placeholder="…or paste an image URL" className="text-xs"/>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e)=>set("name", e.target.value)}/></div>
            <div><Label>Role / Title</Label><Input value={form.role} onChange={(e)=>set("role", e.target.value)}/></div>
          </div>
          <div><Label>Short bio</Label><Textarea rows={3} value={form.bio ?? ""} onChange={(e)=>set("bio", e.target.value)}/></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={form.email ?? ""} onChange={(e)=>set("email", e.target.value)} placeholder="name@hope2academy.org"/></div>
            <div><Label>LinkedIn URL</Label><Input value={form.linkedin ?? ""} onChange={(e)=>set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/…"/></div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={(e)=>set("enabled", e.target.checked)} className="h-4 w-4"/>
            Show this member on the public Team page
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// =========================================================================
function GradesStats() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("grades").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("grades"));
    });
  }, []);
  const avg = Math.round(data.reduce((s, g) => s + Number(g.score || 0), 0) / Math.max(1, data.length));
  return (
    <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
      <StatCard icon={Award} label="Entries" value={data.length} />
      <StatCard icon={BarChart3} label="Class Average" value={`${avg}%`} accent="accent" />
      <StatCard icon={CheckCircle2} label="Above 90%" value={data.filter((d) => Number(d.score) >= 90).length} accent="secondary" />
    </StaggerGroup>
  );
}

function FeesStats() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("fees").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("fees"));
    });
  }, []);
  const outstanding = data.filter((f) => f.status === "Outstanding").reduce((s, f) => s + Number(f.amount || 0), 0);
  const paid = data.filter((f) => f.status === "Paid").reduce((s, f) => s + Number(f.amount || 0), 0);
  return (
    <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
      <StatCard icon={DollarSign} label="Outstanding" value={fmtMoney(outstanding)} />
      <StatCard icon={CheckCircle2} label="Paid this term" value={fmtMoney(paid)} accent="secondary" />
      <StatCard icon={Heart} label="Donations YTD" value={fmtMoney(1325)} accent="accent" />
    </StaggerGroup>
  );
}

function DonationsStats() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("donations").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("donations"));
    });
  }, []);
  const total = data.reduce((s, d) => s + Number(d.amount || 0), 0);
  return (
    <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
      <StatCard icon={DollarSign} label="Total raised" value={fmtMoney(total)} />
      <StatCard icon={Users} label="Donors" value={data.length} accent="accent" />
      <StatCard icon={Heart} label="Recurring" value={3} accent="secondary" />
    </StaggerGroup>
  );
}

// =========================================================================
// Messages — inbox with mark read + delete
// =========================================================================
function MessagesModule() {
  const [data, setData] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const list = await apiClient.list("messages");
      setData(list as any[]);
    } catch (e) {
      if (isNetworkError(e)) setData(mockDb.list<any>("messages"));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const unread = data.filter((m) => m.unread).length;

  const markRead = async (id: string) => {
    try {
      await apiClient.update("messages", id, { unread: false });
    } catch (e) {
      if (isNetworkError(e)) mockDb.update<any>("messages", id, { unread: false });
    }
    load();
  };
  const remove = async (id: string) => {
    try {
      await apiClient.remove("messages", id);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error("Could not delete"); return; }
      mockDb.remove("messages", id);
    }
    toast.success("Message deleted");
    load();
  };

  return (
    <>
      <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
        <StatCard icon={Inbox} label="Inbox" value={data.length} />
        <StatCard icon={Sparkles} label="Unread" value={unread} accent="accent" />
        <StatCard icon={CheckCircle2} label="Read" value={data.length - unread} accent="secondary" />
      </StaggerGroup>
      <Card className="divide-y divide-border">
        {data.map((m: any) => (
          <div key={m.id} className="p-4 hover:bg-muted/30 flex items-start gap-4">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => markRead(m.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {m.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <p className="font-semibold">{m.from}</p>
                  <span className="text-xs text-muted-foreground">→ {m.to}</span>
                </div>
                <span className="text-xs text-muted-foreground">{m.date}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{m.subject}</p>
              <p className="text-xs text-muted-foreground truncate">{m.preview}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {data.length === 0 && <p className="p-8 text-center text-muted-foreground">Inbox is empty.</p>}
      </Card>
    </>
  );
}

// =========================================================================
// Academics — Classes (full CRUD)
// =========================================================================
type ClassRow = { id: string; name: string; teacher: string; room: string; students: number; schedule: string };

function ClassesModule() {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [all, setAll] = useState<ClassRow[]>([]);

  const load = useCallback(async () => {
    try {
      const list = await apiClient.list("classes");
      setAll(list as ClassRow[]);
    } catch (e) {
      if (isNetworkError(e)) setAll(mockDb.list<ClassRow>("classes"));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = all.filter((c) => !q || `${c.name} ${c.teacher} ${c.room}`.toLowerCase().includes(q.toLowerCase()));

  const remove = async (c: ClassRow) => {
    if (!confirm(`Delete class "${c.name}"?`)) return;
    try {
      await apiClient.remove("classes", c.id);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not delete"); return; }
      mockDb.remove("classes", c.id);
    }
    toast.success("Class deleted");
    load();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search classes…" className="pl-9 bg-card" />
        </div>
        <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/> New class</Button>
      </div>
      <TableShell
        head={["Class", "Teacher", "Room", "Students", "Schedule", ""]}
        rows={rows.map((c) => [
          <span className="font-medium">{c.name}</span>,
          c.teacher,
          c.room,
          c.students,
          c.schedule,
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={()=>setEditing(c)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
            <Button size="sm" variant="ghost" onClick={()=>remove(c)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </div>,
        ])}
      />
      {(editing || creating) && (
        <ClassEditor
          row={editing}
          onClose={()=>{ setEditing(null); setCreating(false); load(); }}
        />
      )}
    </>
  );
}

function ClassEditor({ row, onClose }: { row: ClassRow | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<ClassRow>>(row ?? { name: "", teacher: "", room: "", students: 0, schedule: "" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name || !form.teacher) { toast.error("Name and teacher are required"); return; }
    setSaving(true);
    const data = { ...(form as ClassRow), students: Number(form.students) || 0 };
    try {
      if (row) await apiClient.update("classes", row.id, data);
      else await apiClient.create("classes", data);
      toast.success(row ? "Class updated" : "Class created");
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not save"); setSaving(false); return; }
      if (row) mockDb.update<ClassRow>("classes", row.id, data);
      else mockDb.create<ClassRow>("classes", data);
      toast.success(row ? "Class updated" : "Class created");
    }
    setSaving(false);
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{row ? "Edit class" : "New class"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Class name</Label><Input value={form.name ?? ""} onChange={(e)=>setForm({...form, name:e.target.value})} placeholder="Grade 9 — Mathematics"/></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Teacher</Label><Input value={form.teacher ?? ""} onChange={(e)=>setForm({...form, teacher:e.target.value})}/></div>
            <div><Label>Room</Label><Input value={form.room ?? ""} onChange={(e)=>setForm({...form, room:e.target.value})}/></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Students</Label><Input type="number" value={form.students ?? 0} onChange={(e)=>setForm({...form, students:Number(e.target.value)})}/></div>
            <div><Label>Schedule</Label><Input value={form.schedule ?? ""} onChange={(e)=>setForm({...form, schedule:e.target.value})} placeholder="Mon/Wed/Fri 08:00"/></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin"/>}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// Academics — Assignments (full CRUD)
// =========================================================================
type AssignmentRow = { id: string; title: string; class: string; due: string; submissions: number; status: string };

function AssignmentsModule() {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<AssignmentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [all, setAll] = useState<AssignmentRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);

  const load = useCallback(async () => {
    try {
      const [asgns, cls] = await Promise.all([
        apiClient.list("assignments"),
        apiClient.list("classes"),
      ]);
      setAll(asgns as AssignmentRow[]);
      setClasses(cls as ClassRow[]);
    } catch (e) {
      if (isNetworkError(e)) {
        setAll(mockDb.list<AssignmentRow>("assignments"));
        setClasses(mockDb.list<ClassRow>("classes"));
      }
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = all.filter((a) => !q || `${a.title} ${a.class}`.toLowerCase().includes(q.toLowerCase()));

  const remove = async (a: AssignmentRow) => {
    if (!confirm(`Delete assignment "${a.title}"?`)) return;
    try {
      await apiClient.remove("assignments", a.id);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not delete"); return; }
      mockDb.remove("assignments", a.id);
    }
    toast.success("Assignment deleted");
    load();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search assignments…" className="pl-9 bg-card" />
        </div>
        <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/> New assignment</Button>
      </div>
      <TableShell
        head={["Title", "Class", "Due", "Submissions", "Status", ""]}
        rows={rows.map((a) => [
          <span className="font-medium">{a.title}</span>,
          a.class,
          a.due,
          a.submissions,
          statusBadge(a.status),
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={()=>setEditing(a)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
            <Button size="sm" variant="ghost" onClick={()=>remove(a)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </div>,
        ])}
      />
      {(editing || creating) && (
        <AssignmentEditor
          row={editing}
          classes={classes}
          onClose={()=>{ setEditing(null); setCreating(false); load(); }}
        />
      )}
    </>
  );
}

function AssignmentEditor({ row, classes, onClose }: { row: AssignmentRow | null; classes: ClassRow[]; onClose: () => void }) {
  const [form, setForm] = useState<Partial<AssignmentRow>>(row ?? { title: "", class: classes[0]?.name ?? "", due: "", submissions: 0, status: "Open" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.title || !form.class || !form.due) { toast.error("Title, class and due date are required"); return; }
    setSaving(true);
    const data = { ...(form as AssignmentRow), submissions: Number(form.submissions) || 0 };
    try {
      if (row) await apiClient.update("assignments", row.id, data);
      else await apiClient.create("assignments", data);
      toast.success(row ? "Assignment updated" : "Assignment created");
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not save"); setSaving(false); return; }
      if (row) mockDb.update<AssignmentRow>("assignments", row.id, data);
      else mockDb.create<AssignmentRow>("assignments", data);
      toast.success(row ? "Assignment updated" : "Assignment created");
    }
    setSaving(false);
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{row ? "Edit assignment" : "New assignment"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title ?? ""} onChange={(e)=>setForm({...form, title:e.target.value})}/></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Class</Label>
              <Select value={form.class ?? ""} onValueChange={(v)=>setForm({...form, class:v})}>
                <SelectTrigger><SelectValue placeholder="Select a class"/></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Due date</Label><Input type="date" value={form.due ?? ""} onChange={(e)=>setForm({...form, due:e.target.value})}/></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Submissions</Label><Input type="number" value={form.submissions ?? 0} onChange={(e)=>setForm({...form, submissions:Number(e.target.value)})}/></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status ?? "Open"} onValueChange={(v)=>setForm({...form, status:v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Grading">Grading</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin"/>}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
