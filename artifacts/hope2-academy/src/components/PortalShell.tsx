import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, ROLE_LABEL, type AppRole } from "@/hooks/use-auth";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar, Heart,
  LogOut, Settings, Bell, Award, FileText, UserCog, Shield,
  Image as ImageIcon, Newspaper, MessageSquare, ClipboardList,
  DollarSign, Briefcase, Library, BarChart3, FolderTree, Megaphone,
  ListTree, Search as SearchIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import {
  Sidebar, SidebarProvider, SidebarTrigger, SidebarContent, SidebarHeader,
  SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";
import { mockDb } from "@/lib/mock-backend";
import { Logo, BrandWordmark } from "@/components/Logo";

type NavItem = { to: string; label: string; icon: any };
type NavGroup = { group: string; items: NavItem[] };

const m = (key: string) => `/portal/m/${key}`;

const navByRole: Record<AppRole, NavGroup[]> = {
  superadmin: [
    { group: "Command Center", items: [
      { to: "/portal/superadmin", label: "Dashboard", icon: Shield },
      { to: m("analytics"), label: "Analytics", icon: BarChart3 },
      { to: m("audit"), label: "Audit Logs", icon: ClipboardList },
    ]},
    { group: "People & Access", items: [
      { to: "/portal/admin", label: "User Management", icon: Users },
      { to: m("departments"), label: "Departments", icon: FolderTree },
      { to: m("staff"), label: "Staff & HR", icon: Users },
    ]},
    { group: "Admissions & Academics", items: [
      { to: m("admissions"), label: "Admissions", icon: ClipboardList },
      { to: m("classes"), label: "Classes", icon: GraduationCap },
      { to: m("exams"), label: "Exams & Reports", icon: Award },
      { to: m("behavior"), label: "Behavior & Discipline", icon: Award },
      { to: m("lessonplans"), label: "Lesson Plans", icon: BookOpen },
      { to: m("calendar"), label: "School Calendar", icon: Calendar },
    ]},
    { group: "Operations", items: [
      { to: m("transport"), label: "Transport", icon: FolderTree },
      { to: m("clinic"), label: "Clinic & Health", icon: Award },
      { to: m("inventory"), label: "Assets & Inventory", icon: FolderTree },
      { to: m("scholarships"), label: "Scholarships", icon: Award },
      { to: m("fees"), label: "Fees & Donations", icon: DollarSign },
    ]},
    { group: "Website (CMS)", items: [
      { to: m("hero"), label: "Hero Slider", icon: ImageIcon },
      { to: m("team"), label: "Team Page", icon: Users },
      { to: m("pages"), label: "Pages (CMS)", icon: FileText },
      { to: m("posts"), label: "Posts & Stories", icon: Newspaper },
      { to: m("media"), label: "Media Library", icon: ImageIcon },
      { to: m("navigation"), label: "Navigation", icon: ListTree },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
    ]},
    { group: "System", items: [
      { to: m("settings"), label: "Site Settings", icon: Settings },
    ]},
  ],
  admin: [
    { group: "Command Center", items: [
      { to: "/portal/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: m("analytics"), label: "Analytics", icon: BarChart3 },
    ]},
    { group: "People", items: [
      { to: "/portal/admin", label: "User Management", icon: Users },
      { to: m("departments"), label: "Departments", icon: FolderTree },
      { to: m("staff"), label: "Staff & HR", icon: Users },
    ]},
    { group: "Admissions & Academics", items: [
      { to: m("admissions"), label: "Admissions", icon: ClipboardList },
      { to: m("classes"), label: "Classes", icon: GraduationCap },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
      { to: m("attendance"), label: "Attendance", icon: ClipboardList },
      { to: m("grades"), label: "Grades", icon: Award },
      { to: m("exams"), label: "Exams & Reports", icon: Award },
      { to: m("behavior"), label: "Behavior", icon: Award },
      { to: m("lessonplans"), label: "Lesson Plans", icon: BookOpen },
      { to: m("calendar"), label: "School Calendar", icon: Calendar },
    ]},
    { group: "Operations", items: [
      { to: m("transport"), label: "Transport", icon: FolderTree },
      { to: m("clinic"), label: "Clinic & Health", icon: Award },
      { to: m("inventory"), label: "Inventory", icon: FolderTree },
      { to: m("scholarships"), label: "Scholarships", icon: Award },
    ]},
    { group: "Finance", items: [
      { to: m("fees"), label: "Fees & Donations", icon: DollarSign },
    ]},
    { group: "Content", items: [
      { to: m("hero"), label: "Hero Slider", icon: ImageIcon },
      { to: m("team"), label: "Team Page", icon: Users },
      { to: m("posts"), label: "Stories & News", icon: Newspaper },
      { to: m("media"), label: "Media Library", icon: ImageIcon },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
    ]},
    { group: "System", items: [
      { to: m("settings"), label: "Site Settings", icon: Settings },
    ]},
  ],
  teacher: [
    { group: "Today", items: [
      { to: "/portal/teacher", label: "Dashboard", icon: LayoutDashboard },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
      { to: m("attendance"), label: "Attendance", icon: ClipboardList },
      { to: m("calendar"), label: "Calendar", icon: Calendar },
    ]},
    { group: "Teaching", items: [
      { to: m("classes"), label: "My Classes", icon: BookOpen },
      { to: m("assignments"), label: "Assignments", icon: ClipboardList },
      { to: m("lessonplans"), label: "Lesson Plans", icon: BookOpen },
      { to: m("exams"), label: "Exams", icon: Award },
      { to: m("grades"), label: "Grade Book", icon: Award },
      { to: m("behavior"), label: "Behavior Log", icon: Award },
      { to: m("resources"), label: "Resources", icon: Library },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
    ]},
  ],
  student: [
    { group: "Today", items: [
      { to: "/portal/student", label: "Dashboard", icon: LayoutDashboard },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
      { to: m("assignments"), label: "Assignments", icon: ClipboardList },
      { to: m("calendar"), label: "School Calendar", icon: Calendar },
    ]},
    { group: "Learning", items: [
      { to: m("classes"), label: "My Courses", icon: BookOpen },
      { to: m("grades"), label: "Grades & Reports", icon: Award },
      { to: m("exams"), label: "Exams", icon: Award },
      { to: m("library"), label: "Library", icon: Library },
    ]},
    { group: "School Life", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
    ]},
  ],
  parent: [
    { group: "My Family", items: [
      { to: "/portal/parent", label: "Dashboard", icon: LayoutDashboard },
      { to: m("children"), label: "Children", icon: Heart },
    ]},
    { group: "Academic Progress", items: [
      { to: m("grades"), label: "Grades & Progress", icon: Award },
      { to: m("exams"), label: "Exams", icon: Award },
      { to: m("attendance"), label: "Attendance", icon: Calendar },
      { to: m("behavior"), label: "Behavior", icon: Award },
      { to: m("calendar"), label: "School Calendar", icon: Calendar },
    ]},
    { group: "Finance", items: [
      { to: m("fees"), label: "Fees & Donations", icon: DollarSign },
      { to: m("scholarships"), label: "Scholarships", icon: Award },
      { to: m("transport"), label: "Transport", icon: FolderTree },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
    ]},
  ],
  alumni: [
    { group: "Network", items: [
      { to: "/portal/alumni", label: "Dashboard", icon: LayoutDashboard },
      { to: m("directory"), label: "Alumni Directory", icon: Users },
    ]},
    { group: "Opportunities", items: [
      { to: m("events"), label: "Events & Reunions", icon: Calendar },
      { to: m("jobs"), label: "Job Board", icon: Briefcase },
      { to: m("mentorship"), label: "Mentorship", icon: Heart },
    ]},
    { group: "Give Back", items: [
      { to: m("donations"), label: "Donations", icon: DollarSign },
      { to: m("scholarships"), label: "Scholarships", icon: Award },
      { to: m("posts"), label: "Stories", icon: Newspaper },
    ]},
  ],
};

// ── Sub-component rendered INSIDE SidebarProvider so useSidebar() works ──
function PortalSidebarContent({
  groups,
  pathname,
  onSignOut,
}: {
  groups: NavGroup[];
  pathname: string;
  onSignOut: () => void;
}) {
  const { setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false);

  return (
    <>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.group}>
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider">{g.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it, idx) => {
                  const Icon = it.icon;
                  const active = pathname === it.to;
                  return (
                    <SidebarMenuItem key={`${g.group}-${idx}`}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={it.label}
                        className="h-11 text-[15px] font-medium"
                      >
                        <Link to={it.to} onClick={close}>
                          <Icon className="h-5 w-5" />
                          <span>{it.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/portal/profile"}
                  tooltip="My Profile"
                  className="h-11 text-[15px] font-medium"
                >
                  <Link to="/portal/profile" onClick={close}>
                    <UserCog className="h-5 w-5" />
                    <span>My Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              className="h-11 text-[15px] font-medium"
              onClick={() => { close(); onSignOut(); }}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

export function PortalShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { profile, primaryRole, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const groups = primaryRole ? navByRole[primaryRole] : [];

  const sidebarDefaultOpen = (() => {
    if (typeof document === "undefined") return true;
    const match = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/);
    return match ? match[1] === "true" : true;
  })();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <div className="flex min-h-[calc(100vh-5rem)] w-full bg-muted/30">
        <Sidebar collapsible="icon" className="top-20 !h-[calc(100svh-5rem)] text-[15px]">
          <SidebarHeader>
            <Link to="/portal" className="flex items-center gap-3 px-2 py-3">
              <Logo size={44} />
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="font-display font-bold text-[15px] leading-tight truncate"><BrandWordmark /></p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {profile?.full_name ?? profile?.name ?? "User"} · {primaryRole ? ROLE_LABEL[primaryRole] : "—"}
                </p>
              </div>
            </Link>
          </SidebarHeader>

          <PortalSidebarContent
            groups={groups}
            pathname={pathname}
            onSignOut={handleSignOut}
          />
        </Sidebar>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-20 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 backdrop-blur px-5">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border mx-1" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-semibold">{title}</p>
            </div>
            <CommandPalette role={primaryRole} groups={groups} />
            <button className="h-10 w-10 rounded-full bg-card border border-border grid place-items-center hover:bg-muted">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button className="hidden sm:grid h-10 w-10 rounded-full bg-card border border-border place-items-center hover:bg-muted">
              <Settings className="h-[18px] w-[18px]" />
            </button>
          </header>

          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 text-[15px]"
          >
            <div className="mb-6">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </motion.main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function CommandPalette({ role, groups }: { role: AppRole | null; groups: NavGroup[] }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const go = (to: string) => { setOpen(false); navigate(to); };
  const classes = mockDb.list<any>("classes");
  const assignments = mockDb.list<any>("assignments");
  const directory = mockDb.list<any>("directory");
  const posts = mockDb.list<any>("posts");
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 rounded-full border border-border bg-card pl-3 pr-2 py-1.5 text-sm text-muted-foreground hover:border-primary/40 transition"
        aria-label="Open command palette"
      >
        <SearchIcon className="h-4 w-4" />
        <span>Quick search…</span>
        <kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
      </button>
      <button onClick={() => setOpen(true)} className="md:hidden h-10 w-10 rounded-full bg-card border border-border grid place-items-center hover:bg-muted" aria-label="Search">
        <SearchIcon className="h-[18px] w-[18px]" />
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search modules, classes, assignments, people…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading={role ? `${ROLE_LABEL[role]} modules` : "Modules"}>
            {groups.flatMap((g) =>
              g.items.map((it) => (
                <CommandItem key={`${g.group}-${it.to}-${it.label}`} value={`${g.group} ${it.label}`} onSelect={() => go(it.to)}>
                  <it.icon className="mr-2 h-4 w-4" />
                  <span>{it.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{g.group}</span>
                </CommandItem>
              ))
            )}
          </CommandGroup>
          {classes.length > 0 && (
            <CommandGroup heading="Classes">
              {classes.slice(0, 8).map((c) => (
                <CommandItem key={c.id} value={`class ${c.name} ${c.teacher}`} onSelect={() => go("/portal/m/classes")}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <span>{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{c.teacher}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {assignments.length > 0 && (
            <CommandGroup heading="Assignments">
              {assignments.slice(0, 8).map((a) => (
                <CommandItem key={a.id} value={`assignment ${a.title} ${a.class}`} onSelect={() => go("/portal/m/assignments")}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  <span>{a.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{a.class}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {directory.length > 0 && (
            <CommandGroup heading="People">
              {directory.slice(0, 6).map((p) => (
                <CommandItem key={p.id} value={`person ${p.name} ${p.role}`} onSelect={() => go("/portal/m/directory")}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{p.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Class of {p.year}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {posts.length > 0 && (
            <CommandGroup heading="Posts">
              {posts.slice(0, 6).map((p) => (
                <CommandItem key={p.id} value={`post ${p.title}`} onSelect={() => go("/portal/m/posts")}>
                  <Newspaper className="mr-2 h-4 w-4" />
                  <span>{p.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{p.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function StatCard({ icon: Icon, label, value, delta, accent = "primary" }: { icon: any; label: string; value: string | number; delta?: string; accent?: "primary" | "secondary" | "accent" }) {
  const bg = accent === "secondary" ? "bg-secondary/10 text-secondary" : accent === "accent" ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary";
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="rounded-2xl bg-card border border-border p-5 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between">
        <div className={`h-11 w-11 rounded-xl grid place-items-center ${bg}`}><Icon className="h-5 w-5" /></div>
        {delta && <span className="text-sm font-semibold text-primary">{delta}</span>}
      </div>
      <p className="mt-3 text-3xl font-bold font-display">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

export { FileText, Calendar, Users, BookOpen, GraduationCap, Heart, Award };
