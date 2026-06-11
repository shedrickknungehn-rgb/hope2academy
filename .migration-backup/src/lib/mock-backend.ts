/**
 * Mock backend — localStorage-only. No network calls.
 * Provides auth, profiles, and per-module data so the app runs end-to-end
 * for the demo without Appwrite/Supabase.
 */

export const APP_ROLES = ["superadmin", "admin", "teacher", "student", "parent", "alumni"] as const;
export type AppRole = typeof APP_ROLES[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  alumni: "Alumni",
};

export interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: AppRole;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  emergency_contact?: string | null;
  grade?: string | null;
  class_name?: string | null;
  department?: string | null;
  subjects?: string[] | null;
  graduation_year?: number | null;
  linked_children?: string[] | null;
  createdAt: string;
}

const KEY_USERS = "h2l.users";
const KEY_SESSION = "h2l.session";
const KEY_DATA = "h2l.data";

export const DEMO_CREDENTIALS: Array<{ role: AppRole; email: string; password: string; name: string }> = [
  { role: "superadmin", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole" },
  { role: "admin",      email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah" },
  { role: "teacher",    email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman" },
  { role: "student",    email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe" },
  { role: "parent",     email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe" },
  { role: "alumni",     email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie" },
];

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readUsers(): MockUser[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(KEY_USERS);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
function writeUsers(u: MockUser[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_USERS, JSON.stringify(u));
}

function seedIfEmpty() {
  if (!isBrowser()) return;
  if (readUsers().length > 0) return;

  const now = new Date().toISOString();
  const base: Partial<Record<AppRole, Partial<MockUser>>> = {
    superadmin: { bio: "Director of Programs and Governance." },
    admin: { department: "Operations", bio: "Manages campuses and staffing." },
    teacher: { department: "Mathematics", subjects: ["Mathematics", "Civics", "Literature"], bio: "Lead teacher, Marshall Road Campus." },
    student: { grade: "9", class_name: "Grade 9 — Blue", bio: "Aspiring engineer." },
    parent: { linked_children: ["Mariama Doe", "Ezekiel Doe"], bio: "Father of two HOPE2 students." },
    alumni: { graduation_year: 2019, bio: "Class of 2019. Software engineer in Monrovia." },
  };

  const seed: MockUser[] = DEMO_CREDENTIALS.map((c, i) => ({
    id: `usr_${c.role}`,
    email: c.email,
    password: c.password,
    name: c.name,
    role: c.role,
    phone: `+231 775 975 544`,
    address: "Barber's Joe Town, Marshall Road, Lower Margibi County, Liberia",
    officeHours: "Mon–Fri · 7:00 AM – 4:00 PM",
    createdAt: now,
    ...(base[c.role] ?? {}),
  }));

  // Add a few extra realistic users so admin list isn't bare
  const extras: MockUser[] = [
    { id: "usr_2", email: "ruth.gonpu@hope2.demo", password: "demo1234", name: "Ruth Gonpu", role: "teacher", department: "Science", subjects: ["Biology","Chemistry"], createdAt: now },
    { id: "usr_3", email: "kollie.boima@hope2.demo", password: "demo1234", name: "Kollie Boima", role: "student", grade: "11", class_name: "Grade 11 — Gold", createdAt: now },
    { id: "usr_4", email: "fatu.kanneh@hope2.demo", password: "demo1234", name: "Fatu Kanneh", role: "student", grade: "7", class_name: "Grade 7 — Red", createdAt: now },
    { id: "usr_5", email: "moses.weah@hope2.demo", password: "demo1234", name: "Moses Weah", role: "alumni", graduation_year: 2016, createdAt: now },
    { id: "usr_6", email: "elizabeth.tarr@hope2.demo", password: "demo1234", name: "Elizabeth Tarr", role: "parent", linked_children: ["Kollie Boima"], createdAt: now },
    { id: "usr_7", email: "amos.flomo@hope2.demo", password: "demo1234", name: "Amos Flomo", role: "teacher", department: "Literature", subjects: ["Literature","History"], createdAt: now },
  ];
  writeUsers([...seed, ...extras]);
}

// ---------- Auth ----------
export const mockAuth = {
  init() { seedIfEmpty(); ensureSeedData(); },

  async signIn(email: string, password: string): Promise<MockUser> {
    seedIfEmpty();
    const u = readUsers().find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.password !== password) throw new Error("Invalid email or password");
    if (isBrowser()) localStorage.setItem(KEY_SESSION, u.id);
    return u;
  },

  async getCurrent(): Promise<MockUser | null> {
    if (!isBrowser()) return null;
    seedIfEmpty();
    const id = localStorage.getItem(KEY_SESSION);
    if (!id) return null;
    return readUsers().find(u => u.id === id) ?? null;
  },

  async signOut() {
    if (isBrowser()) localStorage.removeItem(KEY_SESSION);
  },

  async updateProfile(id: string, patch: Partial<MockUser>) {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error("User not found");
    users[idx] = { ...users[idx], ...patch };
    writeUsers(users);
    return users[idx];
  },

  async listUsers(): Promise<MockUser[]> {
    seedIfEmpty();
    return readUsers();
  },

  async changeRole(id: string, role: AppRole) {
    return this.updateProfile(id, { role });
  },

  async createUser(input: { email: string; name: string; role: AppRole; password?: string }) {
    const users = readUsers();
    if (users.some(u => u.email.toLowerCase() === input.email.toLowerCase()))
      throw new Error("Email already exists");
    const u: MockUser = {
      id: `usr_${Math.random().toString(36).slice(2, 9)}`,
      email: input.email,
      password: input.password || "demo1234",
      name: input.name,
      role: input.role,
      createdAt: new Date().toISOString(),
    };
    writeUsers([u, ...users]);
    return u;
  },

  async deleteUser(id: string) {
    writeUsers(readUsers().filter(u => u.id !== id));
  },
};

// ---------- Generic mock data store ----------
type DataShape = Record<string, any[]>;

function readData(): DataShape {
  if (!isBrowser()) return {};
  try { return JSON.parse(localStorage.getItem(KEY_DATA) || "{}"); }
  catch { return {}; }
}
function writeData(d: DataShape) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_DATA, JSON.stringify(d));
}

function ensureSeedData() {
  if (!isBrowser()) return;
  const d = readData();
  if (d.__seeded) {
    // One-shot migration: replace legacy departments with the four HOPE2 divisions.
    if (!d.__migrated_v2) {
      d.departments = [
        { id: "dp1", name: "HOPE2 MISSION",  lead: "Esther Pewee",    staff: 18 },
        { id: "dp2", name: "HOPE2 ACADEMY",  lead: "Grace Kollie",    staff: 42 },
        { id: "dp3", name: "HOPE2 CHURCH",   lead: "Joseph Wreh",     staff: 12 },
        { id: "dp4", name: "HOPE2 MEDIA",    lead: "Patience Kollie", staff: 7  },
      ];
      d.__migrated_v2 = [true];
      writeData(d);
    }
    // v3 migration: expand classes from ABC through Grade 12.
    if (!d.__migrated_v3) {
      const classLevels = [
        "ABC", "Nursery", "KG-1", "KG-2",
        "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
        "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
      ];
      const teachers = ["Grace Tubman", "Amos Flomo", "Ruth Gonpu", "Joseph Karpeh", "Esther Wonkeh", "Patience Kollie"];
      d.classes = classLevels.map((lvl, i) => ({
        id: `c${i + 1}`,
        name: lvl,
        teacher: teachers[i % teachers.length],
        room: `R-${100 + i}`,
        students: 18 + ((i * 3) % 18),
        schedule: i % 2 === 0 ? "Mon/Wed/Fri 08:00" : "Tue/Thu 10:30",
      }));
      d.__migrated_v3 = [true];
      writeData(d);
    }
    // v4 migration: seed new school management modules.
    if (!d.__migrated_v4) {
      seedNewModules(d);
      d.__migrated_v4 = [true];
      writeData(d);
    }
    return;
  }

  // Full class roster from ABC (pre-nursery) through 12th grade.
  const classLevels = [
    "ABC", "Nursery", "KG-1", "KG-2",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
    "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
  ];
  const teachers = ["Grace Tubman", "Amos Flomo", "Ruth Gonpu", "Joseph Karpeh", "Esther Wonkeh", "Patience Kollie"];
  d.classes = classLevels.map((lvl, i) => ({
    id: `c${i + 1}`,
    name: lvl,
    teacher: teachers[i % teachers.length],
    room: `R-${100 + i}`,
    students: 18 + ((i * 3) % 18),
    schedule: i % 2 === 0 ? "Mon/Wed/Fri 08:00" : "Tue/Thu 10:30",
  }));
  d.assignments = [
    { id: "a1", title: "Quadratic Equations — Set 4", class: "Grade 9 — Mathematics", due: "2026-05-27", status: "Open", submissions: 12 },
    { id: "a2", title: "Essay: The Things They Carried", class: "Grade 11 — Literature", due: "2026-05-29", status: "Open", submissions: 8 },
    { id: "a3", title: "Photosynthesis Lab Report", class: "Grade 10 — Biology", due: "2026-05-24", status: "Grading", submissions: 26 },
    { id: "a4", title: "Civic Duty Reflection", class: "Grade 7 — Civic Education", due: "2026-06-02", status: "Open", submissions: 0 },
  ];
  d.grades = [
    { id: "g1", student: "Mariama Doe", subject: "Mathematics", grade: "A-", score: 91, term: "Term 2" },
    { id: "g2", student: "Mariama Doe", subject: "English", grade: "B+", score: 87, term: "Term 2" },
    { id: "g3", student: "Mariama Doe", subject: "Biology", grade: "A", score: 95, term: "Term 2" },
    { id: "g4", student: "Kollie Boima", subject: "Literature", grade: "A", score: 94, term: "Term 2" },
    { id: "g5", student: "Kollie Boima", subject: "Mathematics", grade: "B", score: 82, term: "Term 2" },
    { id: "g6", student: "Fatu Kanneh", subject: "Civics", grade: "A+", score: 98, term: "Term 2" },
  ];
  d.attendance = [
    { id: "at1", date: "2026-05-21", class: "Grade 9 — Mathematics", present: 26, absent: 2, late: 0 },
    { id: "at2", date: "2026-05-21", class: "Grade 11 — Literature", present: 20, absent: 1, late: 1 },
    { id: "at3", date: "2026-05-20", class: "Grade 10 — Biology", present: 25, absent: 0, late: 1 },
    { id: "at4", date: "2026-05-20", class: "Grade 7 — Civic Education", present: 29, absent: 2, late: 0 },
  ];
  d.timetable = [
    { day: "Monday",    slots: [{ t: "08:00", s: "Grade 9 — Mathematics" }, { t: "10:30", s: "Grade 11 — Literature" }, { t: "12:30", s: "Grade 7 — Civic Education" }] },
    { day: "Tuesday",   slots: [{ t: "09:00", s: "Grade 10 — Biology" }, { t: "11:00", s: "Staff briefing" }] },
    { day: "Wednesday", slots: [{ t: "08:00", s: "Grade 9 — Mathematics" }, { t: "12:30", s: "Grade 7 — Civic Education" }] },
    { day: "Thursday",  slots: [{ t: "10:30", s: "Grade 11 — Literature" }, { t: "09:00", s: "Grade 10 — Biology" }] },
    { day: "Friday",    slots: [{ t: "08:00", s: "Grade 9 — Mathematics" }, { t: "09:00", s: "Grade 10 — Biology" }, { t: "15:00", s: "Assembly" }] },
  ];
  d.announcements = [
    { id: "an1", title: "Parent-Teacher meeting Friday 4pm", body: "All parents invited to Marshall Road auditorium.", audience: "All", date: "2026-05-22" },
    { id: "an2", title: "Library now open until 7pm", body: "Extended hours for exam season.", audience: "Students", date: "2026-05-20" },
    { id: "an3", title: "Vaccination drive complete", body: "All participants reported healthy.", audience: "Parents", date: "2026-05-19" },
    { id: "an4", title: "Donor visit on Tuesday", body: "Staff please prepare classroom showcases.", audience: "Staff", date: "2026-05-18" },
  ];
  d.messages = [
    { id: "m1", from: "Grace Tubman", to: "Samuel Doe", subject: "Mariama's mid-term progress", preview: "I wanted to share some great news…", date: "2026-05-21", unread: true },
    { id: "m2", from: "Admin Office", to: "All Staff", subject: "Payroll cycle update", preview: "Please confirm bank details by Friday.", date: "2026-05-20", unread: true },
    { id: "m3", from: "Patience Kollie", to: "Alumni Network", subject: "Mentor sign-up open", preview: "We have 12 spots remaining.", date: "2026-05-18", unread: false },
  ];
  d.fees = [
    { id: "f1", student: "Mariama Doe", item: "Term 2 Tuition", amount: 320, due: "2026-06-01", status: "Outstanding" },
    { id: "f2", student: "Ezekiel Doe", item: "Term 2 Tuition", amount: 280, due: "2026-06-01", status: "Outstanding" },
    { id: "f3", student: "Mariama Doe", item: "Lab fee", amount: 45, due: "2026-05-15", status: "Paid" },
  ];
  d.children = [
    { id: "ch1", name: "Mariama Doe", grade: "Grade 9 — Blue", attendance: "96%", gpa: 3.7 },
    { id: "ch2", name: "Ezekiel Doe", grade: "Grade 6 — Red", attendance: "92%", gpa: 3.4 },
  ];
  d.events = [
    { id: "e1", title: "Monrovia Alumni Mixer", date: "2026-08-12", location: "Royal Hotel" },
    { id: "e2", title: "Annual Reunion", date: "2026-12-21", location: "Marshall Road Campus" },
    { id: "e3", title: "Career Fair", date: "2027-01-14", location: "Marshall Road Campus" },
  ];
  d.jobs = [
    { id: "j1", title: "Junior Software Engineer", company: "Liberia Telecoms", location: "Monrovia", posted: "2026-05-12" },
    { id: "j2", title: "Project Coordinator", company: "Liberia Water Trust", location: "Buchanan", posted: "2026-05-10" },
    { id: "j3", title: "Field Nurse", company: "HOPE2 Health", location: "Gbarnga", posted: "2026-05-08" },
  ];
  d.directory = [
    { id: "dir1", name: "Patience Kollie", year: 2019, role: "Software Engineer", city: "Monrovia" },
    { id: "dir2", name: "Moses Weah", year: 2016, role: "Civil Engineer", city: "Buchanan" },
    { id: "dir3", name: "Bendu Sirleaf", year: 2020, role: "Teacher", city: "Gbarnga" },
    { id: "dir4", name: "Prince Karpeh", year: 2018, role: "Public Health Officer", city: "Monrovia" },
  ];
  d.donations = [
    { id: "d1", donor: "Patience Kollie", amount: 250, fund: "Scholarship", date: "2026-05-12" },
    { id: "d2", donor: "Anonymous", amount: 1000, fund: "Capital", date: "2026-05-09" },
    { id: "d3", donor: "Moses Weah", amount: 75, fund: "Library", date: "2026-05-02" },
  ];
  d.pages = [
    { id: "p1", title: "Home", slug: "/", status: "Published", updated: "2026-05-15" },
    { id: "p2", title: "About", slug: "/about", status: "Published", updated: "2026-05-15" },
    { id: "p3", title: "Programs", slug: "/departments", status: "Published", updated: "2026-05-14" },
    { id: "p4", title: "Contact", slug: "/contact", status: "Published", updated: "2026-05-10" },
  ];
  d.posts = [
    { id: "po1", title: "How clean water changed Gbarnga", author: "Editorial", status: "Published", date: "2026-05-10" },
    { id: "po2", title: "Top of class — meet Mariama", author: "Editorial", status: "Draft", date: "2026-05-18" },
    { id: "po3", title: "Volunteer week recap", author: "Editorial", status: "Published", date: "2026-05-04" },
  ];
  d.media = [
    { id: "md1", name: "campus-hero.jpg", type: "image/jpeg", size: "1.2 MB", folder: "Hero" },
    { id: "md2", name: "classroom-7.jpg", type: "image/jpeg", size: "880 KB", folder: "Classrooms" },
    { id: "md3", name: "graduation-2024.mp4", type: "video/mp4", size: "12.4 MB", folder: "Events" },
    { id: "md4", name: "annual-report.pdf", type: "application/pdf", size: "3.1 MB", folder: "Reports" },
    { id: "md5", name: "logo.svg", type: "image/svg+xml", size: "8 KB", folder: "Brand" },
    { id: "md6", name: "water-project.jpg", type: "image/jpeg", size: "1.0 MB", folder: "Projects" },
  ];
  d.departments = [
    { id: "dp1", name: "HOPE2 MISSION",  lead: "Esther Pewee",  staff: 18 },
    { id: "dp2", name: "HOPE2 ACADEMY",  lead: "Grace Kollie",  staff: 42 },
    { id: "dp3", name: "HOPE2 CHURCH",   lead: "Joseph Wreh",   staff: 12 },
    { id: "dp4", name: "HOPE2 MEDIA",    lead: "Patience Kollie", staff: 7  },
  ];
  d.audit = [
    { id: "au1", actor: "superadmin@hope2.demo", action: "Updated role for Kollie Boima → student", at: "2026-05-22 09:14" },
    { id: "au2", actor: "admin@hope2.demo",      action: "Published page /departments",            at: "2026-05-21 17:02" },
    { id: "au3", actor: "teacher@hope2.demo",    action: "Submitted grades for Grade 9 Math",      at: "2026-05-21 11:48" },
  ];
  d.resources = [
    { id: "r1", title: "Curriculum Framework 2026", type: "PDF", size: "2.4 MB" },
    { id: "r2", title: "Lesson plan template", type: "DOCX", size: "120 KB" },
    { id: "r3", title: "Classroom management guide", type: "PDF", size: "1.1 MB" },
  ];
  d.library = [
    { id: "lb1", title: "Things Fall Apart", author: "Chinua Achebe", available: 4 },
    { id: "lb2", title: "Half of a Yellow Sun", author: "C. N. Adichie", available: 2 },
    { id: "lb3", title: "A Long Way Gone", author: "Ishmael Beah", available: 6 },
  ];
  d.settings = [
    { id: "s1", key: "Site name", value: "HOPE2 ACADEMY" },
    { id: "s2", key: "Contact email", value: "info@hope2academy.org" },
    { id: "s3", key: "Primary color", value: "Crimson 600" },
    { id: "s4", key: "Timezone", value: "Africa/Monrovia" },
  ];
  d.__seeded = [true];
  seedNewModules(d);
  d.__migrated_v4 = [true];
  writeData(d);
}

function seedNewModules(d: DataShape) {
  d.admissions = d.admissions ?? [
    { id: "ad1", applicant: "Hawa Konneh",   grade: "Grade 1",  guardian: "Musa Konneh",  phone: "+231 770 111 222", submitted: "2026-05-12", status: "Interview" },
    { id: "ad2", applicant: "Daniel Tarr",   grade: "KG-2",     guardian: "Elizabeth Tarr",phone: "+231 770 333 444", submitted: "2026-05-15", status: "Pending" },
    { id: "ad3", applicant: "Naomi Flomo",   grade: "Grade 7",  guardian: "Amos Flomo",   phone: "+231 770 555 666", submitted: "2026-05-18", status: "Accepted" },
    { id: "ad4", applicant: "Joseph Karpeh", grade: "Grade 10", guardian: "Prince Karpeh",phone: "+231 770 777 888", submitted: "2026-05-20", status: "Waitlist" },
  ];
  d.exams = d.exams ?? [
    { id: "ex1", subject: "Mathematics", class: "Grade 9",  term: "Term 2", date: "2026-06-04", room: "R-108", status: "Scheduled" },
    { id: "ex2", subject: "Literature",  class: "Grade 11", term: "Term 2", date: "2026-06-05", room: "R-110", status: "Scheduled" },
    { id: "ex3", subject: "Biology",     class: "Grade 10", term: "Mid-Term", date: "2026-05-28", room: "Lab-1", status: "Completed" },
    { id: "ex4", subject: "Civics",      class: "Grade 7",  term: "Term 2", date: "2026-06-02", room: "R-105", status: "Scheduled" },
  ];
  d.behavior = d.behavior ?? [
    { id: "bh1", student: "Mariama Doe",  class: "Grade 9",  type: "Commendation", description: "Top score in Math quiz", date: "2026-05-19", reporter: "Grace Tubman" },
    { id: "bh2", student: "Kollie Boima", class: "Grade 11", type: "Warning",      description: "Late submission of essay", date: "2026-05-18", reporter: "Amos Flomo" },
    { id: "bh3", student: "Fatu Kanneh",  class: "Grade 7",  type: "Commendation", description: "Helped classmate", date: "2026-05-17", reporter: "Ruth Gonpu" },
  ];
  d.lessonplans = d.lessonplans ?? [
    { id: "lp1", title: "Quadratic Equations", subject: "Mathematics", class: "Grade 9",  week: "Week 8", objectives: "Solve quadratics by factoring and the quadratic formula.", status: "Approved" },
    { id: "lp2", title: "Romeo & Juliet Act 2", subject: "Literature",  class: "Grade 11", week: "Week 8", objectives: "Analyse character motivations in Act 2.", status: "Submitted" },
    { id: "lp3", title: "Cell Division",         subject: "Biology",     class: "Grade 10", week: "Week 8", objectives: "Compare mitosis and meiosis.", status: "Draft" },
  ];
  d.transport = d.transport ?? [
    { id: "tr1", route: "Marshall Road Loop",   driver: "James Roberts", vehicle: "LR-2210", departure: "06:30", riders: 32, feeUsd: 20 },
    { id: "tr2", route: "Barber's Joe → Campus",driver: "Peter Cooper",  vehicle: "LR-3318", departure: "06:45", riders: 28, feeUsd: 18 },
    { id: "tr3", route: "Margibi East Line",    driver: "Alfred Saah",   vehicle: "LR-1102", departure: "06:15", riders: 24, feeUsd: 22 },
  ];
  d.clinic = d.clinic ?? [
    { id: "cl1", student: "Mariama Doe", visitDate: "2026-05-19", reason: "Mild headache", action: "Paracetamol, rest 30 min", nurse: "Nurse Helen", status: "Treated" },
    { id: "cl2", student: "Ezekiel Doe", visitDate: "2026-05-17", reason: "Scraped knee",  action: "Cleaned & bandaged", nurse: "Nurse Helen", status: "Treated" },
    { id: "cl3", student: "Fatu Kanneh", visitDate: "2026-05-16", reason: "Fever",          action: "Referred to clinic", nurse: "Nurse Helen", status: "Referred" },
  ];
  d.calendar = d.calendar ?? [
    { id: "ca1", title: "Term 2 Mid-term Exams", type: "Exam",    startDate: "2026-05-28", endDate: "2026-06-05", audience: "Students" },
    { id: "ca2", title: "Independence Day",      type: "Holiday", startDate: "2026-07-26", endDate: "2026-07-26", audience: "All" },
    { id: "ca3", title: "PTA Meeting",           type: "PTA",     startDate: "2026-06-13", endDate: "2026-06-13", audience: "Parents" },
    { id: "ca4", title: "Inter-house Sports Day",type: "Sports",  startDate: "2026-06-20", endDate: "2026-06-20", audience: "All" },
  ];
  d.inventory = d.inventory ?? [
    { id: "in1", item: "Student desks",      category: "Furniture",   quantity: 240, location: "Marshall Campus", condition: "Good" },
    { id: "in2", item: "Laptop (Dell)",      category: "Electronics", quantity: 18,  location: "Computer Lab",    condition: "Good" },
    { id: "in3", item: "Microscope",         category: "Lab",         quantity: 12,  location: "Science Lab",     condition: "Fair" },
    { id: "in4", item: "Football kit",       category: "Sports",      quantity: 4,   location: "Sports Store",    condition: "New" },
    { id: "in5", item: "Curriculum books G9",category: "Books",       quantity: 60,  location: "Library",         condition: "Good" },
  ];
  d.staff = d.staff ?? [
    { id: "st1", name: "Grace Tubman",   role: "Lead Teacher",  department: "HOPE2 ACADEMY", phone: "+231 775 975 544", salaryUsd: 320, status: "Active" },
    { id: "st2", name: "Joseph Wreh",    role: "Pastor",        department: "HOPE2 CHURCH",  phone: "+231 770 222 333", salaryUsd: 280, status: "Active" },
    { id: "st3", name: "Esther Pewee",   role: "Field Director",department: "HOPE2 MISSION", phone: "+231 770 444 555", salaryUsd: 360, status: "Active" },
    { id: "st4", name: "Patience Kollie",role: "Media Lead",    department: "HOPE2 MEDIA",   phone: "+231 770 666 777", salaryUsd: 240, status: "Active" },
    { id: "st5", name: "Amos Flomo",     role: "Teacher",       department: "HOPE2 ACADEMY", phone: "+231 770 888 999", salaryUsd: 250, status: "On Leave" },
  ];
  d.scholarships = d.scholarships ?? [
    { id: "sc1", student: "Mariama Doe",  sponsor: "Patience Kollie", amountUsd: 320, term: "Term 2", status: "Active" },
    { id: "sc2", student: "Kollie Boima", sponsor: "Anonymous",        amountUsd: 480, term: "Annual", status: "Paid" },
    { id: "sc3", student: "Fatu Kanneh",  sponsor: "Moses Weah",       amountUsd: 200, term: "Term 2", status: "Outstanding" },
  ];
}

export const mockDb = {
  list<T = any>(col: string): T[] {
    ensureSeedData();
    return (readData()[col] as T[]) ?? [];
  },
  create<T extends { id?: string } = any>(col: string, item: T): T {
    ensureSeedData();
    const d = readData();
    const withId = { ...item, id: item.id ?? `${col}_${Math.random().toString(36).slice(2, 9)}` } as T;
    d[col] = [withId as any, ...((d[col] as any[]) ?? [])];
    writeData(d);
    return withId;
  },
  update<T extends { id: string } = any>(col: string, id: string, patch: Partial<T>): T | null {
    ensureSeedData();
    const d = readData();
    const rows = (d[col] as any[]) ?? [];
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch };
    d[col] = rows;
    writeData(d);
    return rows[idx];
  },
  remove(col: string, id: string): boolean {
    ensureSeedData();
    const d = readData();
    const before = ((d[col] as any[]) ?? []).length;
    d[col] = ((d[col] as any[]) ?? []).filter((r) => r.id !== id);
    writeData(d);
    return ((d[col] as any[]) ?? []).length < before;
  },
  reset(col?: string) {
    if (!isBrowser()) return;
    if (!col) { localStorage.removeItem(KEY_DATA); ensureSeedData(); return; }
    const d = readData();
    delete d[col];
    delete d.__seeded;
    writeData(d);
    ensureSeedData();
  },
};