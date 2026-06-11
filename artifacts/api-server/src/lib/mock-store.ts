/**
 * Server-side in-memory mock data store.
 * Mirrors the shape of the client-side mock-backend.ts so the API server
 * can serve realistic data without a real database.
 */

export const APP_ROLES = ["superadmin", "admin", "teacher", "student", "parent", "alumni"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export interface User {
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

const now = new Date().toISOString();

const USERS: User[] = [
  { id: "usr_superadmin", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole",     role: "superadmin", bio: "Director of Programs and Governance.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_admin",      email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah",   role: "admin",      department: "Operations", bio: "Manages campuses and staffing.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_teacher",    email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman",    role: "teacher",    department: "Mathematics", subjects: ["Mathematics","Civics","Literature"], bio: "Lead teacher, Marshall Road Campus.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_student",    email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe",     role: "student",    grade: "9", class_name: "Grade 9 — Blue", bio: "Aspiring engineer.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_parent",     email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe",      role: "parent",     linked_children: ["Mariama Doe","Ezekiel Doe"], bio: "Father of two HOPE2 students.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_alumni",     email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie", role: "alumni",     graduation_year: 2019, bio: "Class of 2019. Software engineer in Monrovia.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_2", email: "ruth.gonpu@hope2.demo",     password: "demo1234", name: "Ruth Gonpu",     role: "teacher", department: "Science",    subjects: ["Biology","Chemistry"],  createdAt: now },
  { id: "usr_3", email: "kollie.boima@hope2.demo",   password: "demo1234", name: "Kollie Boima",   role: "student", grade: "11", class_name: "Grade 11 — Gold",          createdAt: now },
  { id: "usr_4", email: "fatu.kanneh@hope2.demo",    password: "demo1234", name: "Fatu Kanneh",    role: "student", grade: "7",  class_name: "Grade 7 — Red",            createdAt: now },
  { id: "usr_5", email: "moses.weah@hope2.demo",     password: "demo1234", name: "Moses Weah",     role: "alumni",  graduation_year: 2016,                              createdAt: now },
  { id: "usr_6", email: "elizabeth.tarr@hope2.demo", password: "demo1234", name: "Elizabeth Tarr", role: "parent",  linked_children: ["Kollie Boima"],                  createdAt: now },
  { id: "usr_7", email: "amos.flomo@hope2.demo",     password: "demo1234", name: "Amos Flomo",     role: "teacher", department: "Literature", subjects: ["Literature","History"], createdAt: now },
];

type DataShape = Record<string, any[]>;

export const DB: DataShape = {
  users: USERS,

  classes: [
    "ABC","Nursery","KG-1","KG-2",
    "Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6",
    "Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12",
  ].map((lvl, i) => ({
    id: `c${i+1}`, name: lvl,
    teacher: ["Grace Tubman","Amos Flomo","Ruth Gonpu","Joseph Karpeh","Esther Wonkeh","Patience Kollie"][i % 6],
    room: `R-${100+i}`, students: 18 + (i * 3 % 18),
    schedule: i % 2 === 0 ? "Mon/Wed/Fri 08:00" : "Tue/Thu 10:30",
  })),

  assignments: [
    { id: "a1", title: "Quadratic Equations — Set 4",     class: "Grade 9 — Mathematics",    due: "2026-05-27", status: "Open",    submissions: 12 },
    { id: "a2", title: "Essay: The Things They Carried",  class: "Grade 11 — Literature",    due: "2026-05-29", status: "Open",    submissions: 8  },
    { id: "a3", title: "Photosynthesis Lab Report",       class: "Grade 10 — Biology",       due: "2026-05-24", status: "Grading", submissions: 26 },
    { id: "a4", title: "Civic Duty Reflection",           class: "Grade 7 — Civic Education",due: "2026-06-02", status: "Open",    submissions: 0  },
  ],

  grades: [
    { id: "g1", student: "Mariama Doe",  subject: "Mathematics", grade: "A-", score: 91, term: "Term 2" },
    { id: "g2", student: "Mariama Doe",  subject: "English",     grade: "B+", score: 87, term: "Term 2" },
    { id: "g3", student: "Mariama Doe",  subject: "Biology",     grade: "A",  score: 95, term: "Term 2" },
    { id: "g4", student: "Kollie Boima", subject: "Literature",  grade: "A",  score: 94, term: "Term 2" },
    { id: "g5", student: "Kollie Boima", subject: "Mathematics", grade: "B",  score: 82, term: "Term 2" },
    { id: "g6", student: "Fatu Kanneh",  subject: "Civics",      grade: "A+", score: 98, term: "Term 2" },
  ],

  attendance: [
    { id: "at1", date: "2026-05-21", class: "Grade 9 — Mathematics",    present: 26, absent: 2, late: 0 },
    { id: "at2", date: "2026-05-21", class: "Grade 11 — Literature",    present: 20, absent: 1, late: 1 },
    { id: "at3", date: "2026-05-20", class: "Grade 10 — Biology",       present: 25, absent: 0, late: 1 },
    { id: "at4", date: "2026-05-20", class: "Grade 7 — Civic Education",present: 29, absent: 2, late: 0 },
  ],

  timetable: [
    { day: "Monday",    slots: [{ t:"08:00",s:"Grade 9 — Mathematics" },{ t:"10:30",s:"Grade 11 — Literature" },{ t:"12:30",s:"Grade 7 — Civic Education" }] },
    { day: "Tuesday",   slots: [{ t:"09:00",s:"Grade 10 — Biology" },{ t:"11:00",s:"Staff briefing" }] },
    { day: "Wednesday", slots: [{ t:"08:00",s:"Grade 9 — Mathematics" },{ t:"12:30",s:"Grade 7 — Civic Education" }] },
    { day: "Thursday",  slots: [{ t:"10:30",s:"Grade 11 — Literature" },{ t:"09:00",s:"Grade 10 — Biology" }] },
    { day: "Friday",    slots: [{ t:"08:00",s:"Grade 9 — Mathematics" },{ t:"09:00",s:"Grade 10 — Biology" },{ t:"15:00",s:"Assembly" }] },
  ],

  announcements: [
    { id: "an1", title: "Parent-Teacher meeting Friday 4pm", body: "All parents invited to Marshall Road auditorium.", audience: "All",     date: "2026-05-22" },
    { id: "an2", title: "Library now open until 7pm",        body: "Extended hours for exam season.",               audience: "Students", date: "2026-05-20" },
    { id: "an3", title: "Vaccination drive complete",        body: "All participants reported healthy.",            audience: "Parents",  date: "2026-05-19" },
    { id: "an4", title: "Donor visit on Tuesday",            body: "Staff please prepare classroom showcases.",     audience: "Staff",    date: "2026-05-18" },
  ],

  fees: [
    { id: "f1", student: "Mariama Doe", item: "Term 2 Tuition", amount: 320, due: "2026-06-01", status: "Outstanding" },
    { id: "f2", student: "Ezekiel Doe", item: "Term 2 Tuition", amount: 280, due: "2026-06-01", status: "Outstanding" },
    { id: "f3", student: "Mariama Doe", item: "Lab fee",         amount: 45,  due: "2026-05-15", status: "Paid"        },
  ],

  children: [
    { id: "ch1", name: "Mariama Doe", grade: "Grade 9 — Blue", attendance: "96%", gpa: 3.7 },
    { id: "ch2", name: "Ezekiel Doe", grade: "Grade 6 — Red",  attendance: "92%", gpa: 3.4 },
  ],

  events: [
    { id: "e1", title: "Monrovia Alumni Mixer", date: "2026-08-12", location: "Royal Hotel"           },
    { id: "e2", title: "Annual Reunion",        date: "2026-12-21", location: "Marshall Road Campus"  },
    { id: "e3", title: "Career Fair",           date: "2027-01-14", location: "Marshall Road Campus"  },
  ],

  jobs: [
    { id: "j1", title: "Junior Software Engineer", company: "Liberia Telecoms",    location: "Monrovia", posted: "2026-05-12" },
    { id: "j2", title: "Project Coordinator",      company: "Liberia Water Trust", location: "Buchanan", posted: "2026-05-10" },
    { id: "j3", title: "Field Nurse",              company: "HOPE2 Health",        location: "Gbarnga",  posted: "2026-05-08" },
  ],

  directory: [
    { id: "dir1", name: "Patience Kollie", year: 2019, role: "Software Engineer",     city: "Monrovia" },
    { id: "dir2", name: "Moses Weah",      year: 2016, role: "Civil Engineer",        city: "Buchanan" },
    { id: "dir3", name: "Bendu Sirleaf",   year: 2020, role: "Teacher",               city: "Gbarnga"  },
    { id: "dir4", name: "Prince Karpeh",   year: 2018, role: "Public Health Officer", city: "Monrovia" },
  ],

  donations: [
    { id: "d1", donor: "Patience Kollie", amount: 250,  fund: "Scholarship", date: "2026-05-12" },
    { id: "d2", donor: "Anonymous",       amount: 1000, fund: "Capital",      date: "2026-05-09" },
    { id: "d3", donor: "Moses Weah",      amount: 75,   fund: "Library",      date: "2026-05-02" },
  ],

  departments: [
    { id: "dp1", name: "HOPE2 MISSION",  lead: "Esther Pewee",    staff: 18 },
    { id: "dp2", name: "HOPE2 ACADEMY",  lead: "Grace Kollie",    staff: 42 },
    { id: "dp3", name: "HOPE2 CHURCH",   lead: "Joseph Wreh",     staff: 12 },
    { id: "dp4", name: "HOPE2 MEDIA",    lead: "Patience Kollie", staff: 7  },
  ],

  audit: [
    { id: "au1", actor: "superadmin@hope2.demo", action: "Updated role for Kollie Boima → student", at: "2026-05-22 09:14" },
    { id: "au2", actor: "admin@hope2.demo",      action: "Published page /departments",             at: "2026-05-21 17:02" },
    { id: "au3", actor: "teacher@hope2.demo",    action: "Submitted grades for Grade 9 Math",       at: "2026-05-21 11:48" },
  ],

  resources: [
    { id: "r1", title: "Curriculum Framework 2026", type: "PDF",  size: "2.4 MB"  },
    { id: "r2", title: "Lesson plan template",       type: "DOCX", size: "120 KB"  },
    { id: "r3", title: "Classroom management guide", type: "PDF",  size: "1.1 MB"  },
  ],

  library: [
    { id: "lb1", title: "Things Fall Apart",    author: "Chinua Achebe", available: 4 },
    { id: "lb2", title: "Half of a Yellow Sun", author: "C. N. Adichie", available: 2 },
    { id: "lb3", title: "A Long Way Gone",       author: "Ishmael Beah",  available: 6 },
  ],

  admissions: [
    { id: "ad1", applicant: "Hawa Konneh",   grade: "Grade 1",  guardian: "Musa Konneh",   phone: "+231 770 111 222", submitted: "2026-05-12", status: "Interview" },
    { id: "ad2", applicant: "Daniel Tarr",   grade: "KG-2",     guardian: "Elizabeth Tarr",phone: "+231 770 333 444", submitted: "2026-05-15", status: "Pending"   },
    { id: "ad3", applicant: "Naomi Flomo",   grade: "Grade 7",  guardian: "Amos Flomo",    phone: "+231 770 555 666", submitted: "2026-05-18", status: "Accepted"  },
    { id: "ad4", applicant: "Joseph Karpeh", grade: "Grade 10", guardian: "Prince Karpeh", phone: "+231 770 777 888", submitted: "2026-05-20", status: "Waitlist"  },
  ],

  exams: [
    { id: "ex1", subject: "Mathematics", class: "Grade 9",  term: "Term 2",   date: "2026-06-04", room: "R-108", status: "Scheduled" },
    { id: "ex2", subject: "Literature",  class: "Grade 11", term: "Term 2",   date: "2026-06-05", room: "R-110", status: "Scheduled" },
    { id: "ex3", subject: "Biology",     class: "Grade 10", term: "Mid-Term", date: "2026-05-28", room: "Lab-1", status: "Completed" },
    { id: "ex4", subject: "Civics",      class: "Grade 7",  term: "Term 2",   date: "2026-06-02", room: "R-105", status: "Scheduled" },
  ],

  behavior: [
    { id: "bh1", student: "Mariama Doe",  class: "Grade 9",  type: "Commendation", description: "Top score in Math quiz",   date: "2026-05-19", reporter: "Grace Tubman" },
    { id: "bh2", student: "Kollie Boima", class: "Grade 11", type: "Warning",      description: "Late submission of essay", date: "2026-05-18", reporter: "Amos Flomo"  },
    { id: "bh3", student: "Fatu Kanneh",  class: "Grade 7",  type: "Commendation", description: "Helped classmate",         date: "2026-05-17", reporter: "Ruth Gonpu"  },
  ],

  lessonplans: [
    { id: "lp1", title: "Quadratic Equations", subject: "Mathematics", class: "Grade 9",  week: "Week 8", objectives: "Solve quadratics by factoring and the quadratic formula.", status: "Approved"  },
    { id: "lp2", title: "Romeo & Juliet Act 2", subject: "Literature", class: "Grade 11", week: "Week 8", objectives: "Analyse character motivations in Act 2.",                  status: "Submitted" },
    { id: "lp3", title: "Cell Division",         subject: "Biology",   class: "Grade 10", week: "Week 8", objectives: "Compare mitosis and meiosis.",                            status: "Draft"     },
  ],

  transport: [
    { id: "tr1", route: "Marshall Road Loop",    driver: "James Roberts", vehicle: "LR-2210", departure: "06:30", riders: 32, feeUsd: 20 },
    { id: "tr2", route: "Barber's Joe → Campus", driver: "Peter Cooper",  vehicle: "LR-3318", departure: "06:45", riders: 28, feeUsd: 18 },
    { id: "tr3", route: "Margibi East Line",      driver: "Alfred Saah",   vehicle: "LR-1102", departure: "06:15", riders: 24, feeUsd: 22 },
  ],

  clinic: [
    { id: "cl1", student: "Mariama Doe", visitDate: "2026-05-19", reason: "Mild headache", action: "Paracetamol, rest 30 min", nurse: "Nurse Helen", status: "Treated"  },
    { id: "cl2", student: "Ezekiel Doe", visitDate: "2026-05-17", reason: "Scraped knee",  action: "Cleaned & bandaged",       nurse: "Nurse Helen", status: "Treated"  },
    { id: "cl3", student: "Fatu Kanneh", visitDate: "2026-05-16", reason: "Fever",         action: "Referred to clinic",       nurse: "Nurse Helen", status: "Referred" },
  ],

  calendar: [
    { id: "ca1", title: "Term 2 Mid-term Exams", type: "Exam",    startDate: "2026-05-28", endDate: "2026-06-05", audience: "Students" },
    { id: "ca2", title: "Independence Day",       type: "Holiday", startDate: "2026-07-26", endDate: "2026-07-26", audience: "All"      },
    { id: "ca3", title: "PTA Meeting",            type: "PTA",     startDate: "2026-06-13", endDate: "2026-06-13", audience: "Parents"  },
    { id: "ca4", title: "Inter-house Sports Day", type: "Sports",  startDate: "2026-06-20", endDate: "2026-06-20", audience: "All"      },
  ],

  inventory: [
    { id: "in1", item: "Student desks",       category: "Furniture",   quantity: 240, location: "Marshall Campus", condition: "Good" },
    { id: "in2", item: "Laptop (Dell)",        category: "Electronics", quantity: 18,  location: "Computer Lab",    condition: "Good" },
    { id: "in3", item: "Microscope",           category: "Lab",         quantity: 12,  location: "Science Lab",     condition: "Fair" },
    { id: "in4", item: "Football kit",         category: "Sports",      quantity: 4,   location: "Sports Store",    condition: "New"  },
    { id: "in5", item: "Curriculum books G9",  category: "Books",       quantity: 60,  location: "Library",         condition: "Good" },
  ],

  staff: [
    { id: "st1", name: "Grace Tubman",    role: "Lead Teacher",   department: "HOPE2 ACADEMY", phone: "+231 775 975 544", salaryUsd: 320, status: "Active"   },
    { id: "st2", name: "Joseph Wreh",     role: "Pastor",         department: "HOPE2 CHURCH",  phone: "+231 770 222 333", salaryUsd: 280, status: "Active"   },
    { id: "st3", name: "Esther Pewee",    role: "Field Director", department: "HOPE2 MISSION", phone: "+231 770 444 555", salaryUsd: 360, status: "Active"   },
    { id: "st4", name: "Patience Kollie", role: "Media Lead",     department: "HOPE2 MEDIA",   phone: "+231 770 666 777", salaryUsd: 240, status: "Active"   },
    { id: "st5", name: "Amos Flomo",      role: "Teacher",        department: "HOPE2 ACADEMY", phone: "+231 770 888 999", salaryUsd: 250, status: "On Leave" },
  ],

  scholarships: [
    { id: "sc1", student: "Mariama Doe",  sponsor: "Patience Kollie", amountUsd: 320, term: "Term 2", status: "Active"      },
    { id: "sc2", student: "Kollie Boima", sponsor: "Anonymous",       amountUsd: 480, term: "Annual", status: "Paid"        },
    { id: "sc3", student: "Fatu Kanneh",  sponsor: "Moses Weah",      amountUsd: 200, term: "Term 2", status: "Outstanding" },
  ],

  settings: [
    { id: "s1", key: "Site name",     value: "HOPE2 ACADEMY"        },
    { id: "s2", key: "Contact email", value: "info@hope2academy.org" },
    { id: "s3", key: "Primary color", value: "Crimson 600"           },
    { id: "s4", key: "Timezone",      value: "Africa/Monrovia"       },
  ],

  pages: [
    { id: "p1", title: "Home",     slug: "/",            status: "Published", updated: "2026-05-15" },
    { id: "p2", title: "About",    slug: "/about",       status: "Published", updated: "2026-05-15" },
    { id: "p3", title: "Programs", slug: "/departments", status: "Published", updated: "2026-05-14" },
    { id: "p4", title: "Contact",  slug: "/contact",     status: "Published", updated: "2026-05-10" },
  ],

  posts: [
    { id: "po1", title: "How clean water changed Gbarnga", author: "Editorial", status: "Published", date: "2026-05-10" },
    { id: "po2", title: "Top of class — meet Mariama",     author: "Editorial", status: "Draft",     date: "2026-05-18" },
    { id: "po3", title: "Volunteer week recap",             author: "Editorial", status: "Published", date: "2026-05-04" },
  ],

  media: [
    { id: "md1", name: "campus-hero.jpg",    type: "image/jpeg",      size: "1.2 MB",  folder: "Hero"       },
    { id: "md2", name: "classroom-7.jpg",    type: "image/jpeg",      size: "880 KB",  folder: "Classrooms" },
    { id: "md3", name: "graduation-2024.mp4",type: "video/mp4",       size: "12.4 MB", folder: "Events"     },
    { id: "md4", name: "annual-report.pdf",  type: "application/pdf", size: "3.1 MB",  folder: "Reports"    },
    { id: "md5", name: "logo.svg",           type: "image/svg+xml",   size: "8 KB",    folder: "Brand"      },
    { id: "md6", name: "water-project.jpg",  type: "image/jpeg",      size: "1.0 MB",  folder: "Projects"   },
  ],
};

/** Generic CRUD helpers operating on in-memory DB */
export const mockStore = {
  list<T = any>(col: string): T[] {
    return (DB[col] as T[]) ?? [];
  },

  get<T = any>(col: string, id: string): T | null {
    const rows = (DB[col] as any[]) ?? [];
    return (rows.find((r: any) => r.id === id) as T) ?? null;
  },

  create<T extends { id?: string }>(col: string, item: T): T {
    const withId = { ...item, id: item.id ?? `${col}_${Math.random().toString(36).slice(2, 9)}` } as T;
    DB[col] = [withId as any, ...(DB[col] ?? [])];
    return withId;
  },

  update<T extends { id: string }>(col: string, id: string, patch: Partial<T>): T | null {
    const rows = (DB[col] as any[]) ?? [];
    const idx = rows.findIndex((r: any) => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch };
    return rows[idx] as T;
  },

  remove(col: string, id: string): boolean {
    const before = (DB[col] ?? []).length;
    DB[col] = ((DB[col] as any[]) ?? []).filter((r: any) => r.id !== id);
    return DB[col].length < before;
  },

  findUserByEmail(email: string): User | null {
    return (DB.users as User[]).find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    ) ?? null;
  },

  findUserById(id: string): User | null {
    return (DB.users as User[]).find((u) => u.id === id) ?? null;
  },

  updateUser(id: string, patch: Partial<User>): User | null {
    return this.update<User & { id: string }>("users", id, patch);
  },
};
