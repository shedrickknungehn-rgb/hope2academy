import * as SecureStore from "expo-secure-store";

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

export const ROLE_COLOR: Record<AppRole, string> = {
  superadmin: "#6B2D6B",
  admin: "#C43427",
  teacher: "#2B6B3B",
  student: "#1A5276",
  parent: "#D4A040",
  alumni: "#5B7060",
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

export const DEMO_CREDENTIALS: Array<{ role: AppRole; email: string; password: string; name: string }> = [
  { role: "superadmin", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole" },
  { role: "admin",      email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah" },
  { role: "teacher",    email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman" },
  { role: "student",    email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe" },
  { role: "parent",     email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe" },
  { role: "alumni",     email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie" },
];

const SESSION_KEY = "h2l.session";
const now = new Date().toISOString();

const SEED_USERS: MockUser[] = [
  { id: "usr_superadmin", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole",    role: "superadmin", bio: "Director of Programs and Governance.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_admin",      email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah",   role: "admin",      department: "Operations", bio: "Manages campuses and staffing.", phone: "+231 775 975 544", address: "Barber's Joe Town, Marshall Road, Lower Margibi County, Liberia", createdAt: now },
  { id: "usr_teacher",    email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman",    role: "teacher",    department: "Mathematics", subjects: ["Mathematics","Civics","Literature"], bio: "Lead teacher, Marshall Road Campus.", phone: "+231 775 975 544", address: "Barber's Joe Town, Marshall Road, Lower Margibi County, Liberia", createdAt: now },
  { id: "usr_student",    email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe",     role: "student",    grade: "9", class_name: "Grade 9 — Blue", bio: "Aspiring engineer.", phone: "+231 775 975 544", address: "Barber's Joe Town, Marshall Road, Lower Margibi County, Liberia", createdAt: now },
  { id: "usr_parent",     email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe",      role: "parent",     linked_children: ["Mariama Doe","Ezekiel Doe"], bio: "Father of two HOPE2 students.", phone: "+231 775 975 544", address: "Barber's Joe Town, Marshall Road, Lower Margibi County, Liberia", createdAt: now },
  { id: "usr_alumni",     email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie", role: "alumni",     graduation_year: 2019, bio: "Class of 2019. Software engineer in Monrovia.", phone: "+231 775 975 544", address: "Monrovia, Liberia", createdAt: now },
  { id: "usr_2", email: "ruth.gonpu@hope2.demo",   password: "demo1234", name: "Ruth Gonpu",    role: "teacher", department: "Science",    subjects: ["Biology","Chemistry"], createdAt: now },
  { id: "usr_3", email: "kollie.boima@hope2.demo", password: "demo1234", name: "Kollie Boima",  role: "student", grade: "11", class_name: "Grade 11 — Gold", createdAt: now },
  { id: "usr_4", email: "fatu.kanneh@hope2.demo",  password: "demo1234", name: "Fatu Kanneh",   role: "student", grade: "7",  class_name: "Grade 7 — Red", createdAt: now },
  { id: "usr_5", email: "moses.weah@hope2.demo",   password: "demo1234", name: "Moses Weah",    role: "alumni",  graduation_year: 2016, createdAt: now },
  { id: "usr_6", email: "elizabeth.tarr@hope2.demo",password:"demo1234", name: "Elizabeth Tarr",role: "parent",  linked_children: ["Kollie Boima"], createdAt: now },
  { id: "usr_7", email: "amos.flomo@hope2.demo",   password: "demo1234", name: "Amos Flomo",    role: "teacher", department: "Literature", subjects: ["Literature","History"], createdAt: now },
];

const SEED_DATA: Record<string, any[]> = {
  classes: [
    "ABC","Nursery","KG-1","KG-2",
    "Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6",
    "Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12",
  ].map((lvl, i) => ({
    id: `c${i+1}`, name: lvl,
    teacher: ["Grace Tubman","Amos Flomo","Ruth Gonpu","Joseph Karpeh","Esther Wonkeh","Patience Kollie"][i%6],
    room: `R-${100+i}`, students: 18+((i*3)%18),
    schedule: i%2===0 ? "Mon/Wed/Fri 08:00" : "Tue/Thu 10:30",
  })),
  assignments: [
    { id:"a1", title:"Quadratic Equations — Set 4", class:"Grade 9 — Mathematics", due:"2026-05-27", status:"Open", submissions:12 },
    { id:"a2", title:"Essay: The Things They Carried", class:"Grade 11 — Literature", due:"2026-05-29", status:"Open", submissions:8 },
    { id:"a3", title:"Photosynthesis Lab Report", class:"Grade 10 — Biology", due:"2026-05-24", status:"Grading", submissions:26 },
    { id:"a4", title:"Civic Duty Reflection", class:"Grade 7 — Civic Education", due:"2026-06-02", status:"Open", submissions:0 },
  ],
  grades: [
    { id:"g1", student:"Mariama Doe",  subject:"Mathematics", grade:"A-", score:91, term:"Term 2" },
    { id:"g2", student:"Mariama Doe",  subject:"English",     grade:"B+", score:87, term:"Term 2" },
    { id:"g3", student:"Mariama Doe",  subject:"Biology",     grade:"A",  score:95, term:"Term 2" },
    { id:"g4", student:"Kollie Boima", subject:"Literature",  grade:"A",  score:94, term:"Term 2" },
    { id:"g5", student:"Kollie Boima", subject:"Mathematics", grade:"B",  score:82, term:"Term 2" },
    { id:"g6", student:"Fatu Kanneh",  subject:"Civics",      grade:"A+", score:98, term:"Term 2" },
  ],
  attendance: [
    { id:"at1", date:"2026-05-21", class:"Grade 9 — Mathematics",  present:26, absent:2, late:0 },
    { id:"at2", date:"2026-05-21", class:"Grade 11 — Literature",  present:20, absent:1, late:1 },
    { id:"at3", date:"2026-05-20", class:"Grade 10 — Biology",     present:25, absent:0, late:1 },
    { id:"at4", date:"2026-05-20", class:"Grade 7 — Civic Education", present:29, absent:2, late:0 },
  ],
  timetable: [
    { day:"Monday",    slots:[{t:"08:00",s:"Grade 9 — Mathematics"},{t:"10:30",s:"Grade 11 — Literature"},{t:"12:30",s:"Grade 7 — Civic Education"}] },
    { day:"Tuesday",   slots:[{t:"09:00",s:"Grade 10 — Biology"},{t:"11:00",s:"Staff briefing"}] },
    { day:"Wednesday", slots:[{t:"08:00",s:"Grade 9 — Mathematics"},{t:"12:30",s:"Grade 7 — Civic Education"}] },
    { day:"Thursday",  slots:[{t:"10:30",s:"Grade 11 — Literature"},{t:"09:00",s:"Grade 10 — Biology"}] },
    { day:"Friday",    slots:[{t:"08:00",s:"Grade 9 — Mathematics"},{t:"09:00",s:"Grade 10 — Biology"},{t:"15:00",s:"Assembly"}] },
  ],
  announcements: [
    { id:"an1", title:"Parent-Teacher meeting Friday 4pm", body:"All parents invited to Marshall Road auditorium.", audience:"All", date:"2026-05-22" },
    { id:"an2", title:"Library now open until 7pm", body:"Extended hours for exam season. Students are encouraged to use the space for revision.", audience:"Students", date:"2026-05-20" },
    { id:"an3", title:"Vaccination drive complete", body:"All participants reported healthy. Thank you for your cooperation.", audience:"Parents", date:"2026-05-19" },
    { id:"an4", title:"Donor visit on Tuesday", body:"Staff please prepare classroom showcases. Dress in uniform.", audience:"Staff", date:"2026-05-18" },
  ],
  messages: [
    { id:"m1", from:"Grace Tubman", to:"Samuel Doe",     subject:"Mariama's mid-term progress", preview:"I wanted to share some great news…",       date:"2026-05-21", unread:true  },
    { id:"m2", from:"Admin Office", to:"All Staff",      subject:"Payroll cycle update",          preview:"Please confirm bank details by Friday.", date:"2026-05-20", unread:true  },
    { id:"m3", from:"Patience Kollie", to:"Alumni Network", subject:"Mentor sign-up open",         preview:"We have 12 spots remaining.",            date:"2026-05-18", unread:false },
  ],
  fees: [
    { id:"f1", student:"Mariama Doe", item:"Term 2 Tuition", amount:320, due:"2026-06-01", status:"Outstanding" },
    { id:"f2", student:"Ezekiel Doe", item:"Term 2 Tuition", amount:280, due:"2026-06-01", status:"Outstanding" },
    { id:"f3", student:"Mariama Doe", item:"Lab fee",         amount:45,  due:"2026-05-15", status:"Paid" },
  ],
  children: [
    { id:"ch1", name:"Mariama Doe", grade:"Grade 9 — Blue", attendance:"96%", gpa:3.7 },
    { id:"ch2", name:"Ezekiel Doe", grade:"Grade 6 — Red",  attendance:"92%", gpa:3.4 },
  ],
  events: [
    { id:"e1", title:"Monrovia Alumni Mixer", date:"2026-08-12", location:"Royal Hotel" },
    { id:"e2", title:"Annual Reunion",         date:"2026-12-21", location:"Marshall Road Campus" },
    { id:"e3", title:"Career Fair",            date:"2027-01-14", location:"Marshall Road Campus" },
  ],
  jobs: [
    { id:"j1", title:"Junior Software Engineer", company:"Liberia Telecoms",  location:"Monrovia" },
    { id:"j2", title:"Project Coordinator",       company:"Liberia Water Trust", location:"Buchanan" },
    { id:"j3", title:"Field Nurse",               company:"HOPE2 Health",      location:"Gbarnga" },
  ],
  directory: [
    { id:"dir1", name:"Patience Kollie", year:2019, role:"Software Engineer",    city:"Monrovia" },
    { id:"dir2", name:"Moses Weah",      year:2016, role:"Civil Engineer",        city:"Buchanan" },
    { id:"dir3", name:"Bendu Sirleaf",   year:2020, role:"Teacher",               city:"Gbarnga" },
    { id:"dir4", name:"Prince Karpeh",   year:2018, role:"Public Health Officer", city:"Monrovia" },
  ],
  exams: [
    { id:"ex1", subject:"Mathematics", class:"Grade 9",  term:"Term 2",   date:"2026-06-04", room:"R-108", status:"Scheduled" },
    { id:"ex2", subject:"Literature",  class:"Grade 11", term:"Term 2",   date:"2026-06-05", room:"R-110", status:"Scheduled" },
    { id:"ex3", subject:"Biology",     class:"Grade 10", term:"Mid-Term", date:"2026-05-28", room:"Lab-1", status:"Completed" },
    { id:"ex4", subject:"Civics",      class:"Grade 7",  term:"Term 2",   date:"2026-06-02", room:"R-105", status:"Scheduled" },
  ],
  behavior: [
    { id:"bh1", student:"Mariama Doe",  class:"Grade 9",  type:"Commendation", description:"Top score in Math quiz",     date:"2026-05-19", reporter:"Grace Tubman" },
    { id:"bh2", student:"Kollie Boima", class:"Grade 11", type:"Warning",      description:"Late submission of essay",   date:"2026-05-18", reporter:"Amos Flomo" },
    { id:"bh3", student:"Fatu Kanneh",  class:"Grade 7",  type:"Commendation", description:"Helped classmate",           date:"2026-05-17", reporter:"Ruth Gonpu" },
  ],
  lessonplans: [
    { id:"lp1", title:"Quadratic Equations",  subject:"Mathematics", class:"Grade 9",  week:"Week 8", objectives:"Solve quadratics by factoring and the quadratic formula.", status:"Approved" },
    { id:"lp2", title:"Romeo & Juliet Act 2", subject:"Literature",  class:"Grade 11", week:"Week 8", objectives:"Analyse character motivations in Act 2.", status:"Submitted" },
    { id:"lp3", title:"Cell Division",         subject:"Biology",     class:"Grade 10", week:"Week 8", objectives:"Compare mitosis and meiosis.", status:"Draft" },
  ],
  admissions: [
    { id:"ad1", applicant:"Hawa Konneh",   grade:"Grade 1",  guardian:"Musa Konneh",   phone:"+231 770 111 222", submitted:"2026-05-12", status:"Interview" },
    { id:"ad2", applicant:"Daniel Tarr",   grade:"KG-2",     guardian:"Elizabeth Tarr", phone:"+231 770 333 444", submitted:"2026-05-15", status:"Pending" },
    { id:"ad3", applicant:"Naomi Flomo",   grade:"Grade 7",  guardian:"Amos Flomo",    phone:"+231 770 555 666", submitted:"2026-05-18", status:"Accepted" },
    { id:"ad4", applicant:"Joseph Karpeh", grade:"Grade 10", guardian:"Prince Karpeh", phone:"+231 770 777 888", submitted:"2026-05-20", status:"Waitlist" },
  ],
  staff: [
    { id:"st1", name:"Grace Tubman",    role:"Lead Teacher",   department:"HOPE2 ACADEMY", phone:"+231 775 975 544", salaryUsd:320, status:"Active" },
    { id:"st2", name:"Joseph Wreh",     role:"Pastor",         department:"HOPE2 CHURCH",  phone:"+231 770 222 333", salaryUsd:280, status:"Active" },
    { id:"st3", name:"Esther Pewee",    role:"Field Director", department:"HOPE2 MISSION", phone:"+231 770 444 555", salaryUsd:360, status:"Active" },
    { id:"st4", name:"Patience Kollie", role:"Media Lead",     department:"HOPE2 MEDIA",   phone:"+231 770 666 777", salaryUsd:240, status:"Active" },
    { id:"st5", name:"Amos Flomo",      role:"Teacher",        department:"HOPE2 ACADEMY", phone:"+231 770 888 999", salaryUsd:250, status:"On Leave" },
  ],
  departments: [
    { id:"dp1", name:"HOPE2 MISSION",  lead:"Esther Pewee",    staff:18 },
    { id:"dp2", name:"HOPE2 ACADEMY",  lead:"Grace Kollie",    staff:42 },
    { id:"dp3", name:"HOPE2 CHURCH",   lead:"Joseph Wreh",     staff:12 },
    { id:"dp4", name:"HOPE2 MEDIA",    lead:"Patience Kollie", staff:7  },
  ],
  calendar: [
    { id:"ca1", title:"Term 2 Mid-term Exams", type:"Exam",    startDate:"2026-05-28", endDate:"2026-06-05", audience:"Students" },
    { id:"ca2", title:"Independence Day",      type:"Holiday", startDate:"2026-07-26", endDate:"2026-07-26", audience:"All" },
    { id:"ca3", title:"PTA Meeting",           type:"PTA",     startDate:"2026-06-13", endDate:"2026-06-13", audience:"Parents" },
    { id:"ca4", title:"Inter-house Sports Day",type:"Sports",  startDate:"2026-06-20", endDate:"2026-06-20", audience:"All" },
  ],
  resources: [
    { id:"r1", title:"Curriculum Framework 2026", type:"PDF",  size:"2.4 MB" },
    { id:"r2", title:"Lesson plan template",       type:"DOCX", size:"120 KB" },
    { id:"r3", title:"Classroom management guide", type:"PDF",  size:"1.1 MB" },
  ],
  library: [
    { id:"lb1", title:"Things Fall Apart",     author:"Chinua Achebe",  available:4 },
    { id:"lb2", title:"Half of a Yellow Sun",  author:"C. N. Adichie",  available:2 },
    { id:"lb3", title:"A Long Way Gone",       author:"Ishmael Beah",   available:6 },
  ],
  scholarships: [
    { id:"sc1", student:"Mariama Doe",  sponsor:"Patience Kollie", amountUsd:320, term:"Term 2", status:"Active" },
    { id:"sc2", student:"Kollie Boima", sponsor:"Anonymous",        amountUsd:480, term:"Annual", status:"Paid" },
    { id:"sc3", student:"Fatu Kanneh",  sponsor:"Moses Weah",       amountUsd:200, term:"Term 2", status:"Outstanding" },
  ],
  donations: [
    { id:"d1", donor:"Patience Kollie", amount:250, fund:"Scholarship", date:"2026-05-12" },
    { id:"d2", donor:"Anonymous",        amount:1000, fund:"Capital",    date:"2026-05-09" },
    { id:"d3", donor:"Moses Weah",       amount:75,  fund:"Library",    date:"2026-05-02" },
  ],
  audit: [
    { id:"au1", actor:"superadmin@hope2.demo", action:"Updated role for Kollie Boima → student", at:"2026-05-22 09:14" },
    { id:"au2", actor:"admin@hope2.demo",      action:"Published page /departments",             at:"2026-05-21 17:02" },
    { id:"au3", actor:"teacher@hope2.demo",    action:"Submitted grades for Grade 9 Math",       at:"2026-05-21 11:48" },
  ],
  transport: [
    { id:"tr1", route:"Marshall Road Loop",    driver:"James Roberts", vehicle:"LR-2210", departure:"06:30", riders:32, feeUsd:20 },
    { id:"tr2", route:"Barber's Joe → Campus", driver:"Peter Cooper",  vehicle:"LR-3318", departure:"06:45", riders:28, feeUsd:18 },
    { id:"tr3", route:"Margibi East Line",     driver:"Alfred Saah",   vehicle:"LR-1102", departure:"06:15", riders:24, feeUsd:22 },
  ],
};

export const mockDb = {
  list<T = any>(col: string): T[] {
    return (SEED_DATA[col] as T[]) ?? [];
  },
};

async function getSessionUserId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    return null;
  }
}

async function setSessionUserId(id: string | null) {
  try {
    if (id) {
      await SecureStore.setItemAsync(SESSION_KEY, id);
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch {}
}

export const mockAuth = {
  async signIn(email: string, password: string): Promise<MockUser> {
    const u = SEED_USERS.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.password !== password) throw new Error("Invalid email or password");
    await setSessionUserId(u.id);
    return u;
  },

  async getCurrent(): Promise<MockUser | null> {
    const id = await getSessionUserId();
    if (!id) return null;
    return SEED_USERS.find(x => x.id === id) ?? null;
  },

  async signOut(): Promise<void> {
    await setSessionUserId(null);
  },
};
