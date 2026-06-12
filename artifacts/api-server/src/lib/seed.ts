/**
 * Seeds the database with initial demo data if tables are empty.
 * Called once at server startup. Safe to call multiple times (idempotent).
 *
 * NOTE: With Supabase Auth, users are created in Supabase's auth.users via the
 * Admin API. Our users table stores the profile row with the same UUID as sub.
 * The seed uses bcrypt-hashed passwords stored only in our table (for mock/dev
 * sign-in fallback). Real production users sign in through Supabase Auth.
 */
import { db } from "@workspace/db";
import { usersTable, itemsTable } from "@workspace/db/schema";
import { dbStore } from "./db-store.js";
import { sql } from "drizzle-orm";

const now = new Date().toISOString();

const SEED_USERS = [
  { id: "usr_superadmin", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole",     role: "superadmin" as const, bio: "Director of Programs and Governance.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_admin",      email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah",   role: "admin" as const,      department: "Operations", bio: "Manages campuses and staffing.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_teacher",    email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman",    role: "teacher" as const,    department: "Mathematics", subjects: ["Mathematics","Civics","Literature"], bio: "Lead teacher, Marshall Road Campus.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_student",    email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe",     role: "student" as const,    grade: "9", class_name: "Grade 9 — Blue", bio: "Aspiring engineer.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_parent",     email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe",      role: "parent" as const,     linked_children: ["Mariama Doe","Ezekiel Doe"], bio: "Father of two HOPE2 students.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_alumni",     email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie", role: "alumni" as const,     graduation_year: 2019, bio: "Class of 2019. Software engineer in Monrovia.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_2", email: "ruth.gonpu@hope2.demo",     password: "demo1234", name: "Ruth Gonpu",     role: "teacher" as const, department: "Science",    subjects: ["Biology","Chemistry"],  createdAt: now },
  { id: "usr_3", email: "kollie.boima@hope2.demo",   password: "demo1234", name: "Kollie Boima",   role: "student" as const, grade: "11", class_name: "Grade 11 — Gold",          createdAt: now },
  { id: "usr_4", email: "fatu.kanneh@hope2.demo",    password: "demo1234", name: "Fatu Kanneh",    role: "student" as const, grade: "7",  class_name: "Grade 7 — Red",            createdAt: now },
  { id: "usr_5", email: "moses.weah@hope2.demo",     password: "demo1234", name: "Moses Weah",     role: "alumni" as const,  graduation_year: 2016,                              createdAt: now },
  { id: "usr_6", email: "elizabeth.tarr@hope2.demo", password: "demo1234", name: "Elizabeth Tarr", role: "parent" as const,  linked_children: ["Kollie Boima"],                  createdAt: now },
  { id: "usr_7", email: "amos.flomo@hope2.demo",     password: "demo1234", name: "Amos Flomo",     role: "teacher" as const, department: "Literature", subjects: ["Literature","History"], createdAt: now },
];

const SEED_ITEMS: Array<{ collection: string; id: string; data: Record<string, any> }> = [
  ...["ABC","Nursery","KG-1","KG-2","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"].map((lvl, i) => ({
    collection: "classes", id: `c${i+1}`,
    data: { id: `c${i+1}`, name: lvl, teacher: ["Grace Tubman","Amos Flomo","Ruth Gonpu","Joseph Karpeh","Esther Wonkeh","Patience Kollie"][i % 6], room: `R-${100+i}`, students: 18 + (i * 3 % 18), schedule: i % 2 === 0 ? "Mon/Wed/Fri 08:00" : "Tue/Thu 10:30" },
  })),
  { collection: "assignments", id: "a1", data: { id: "a1", title: "Quadratic Equations — Set 4",    class: "Grade 9 — Mathematics",    due: "2026-05-27", status: "Open",    submissions: 12 } },
  { collection: "assignments", id: "a2", data: { id: "a2", title: "Essay: The Things They Carried", class: "Grade 11 — Literature",    due: "2026-05-29", status: "Open",    submissions: 8  } },
  { collection: "assignments", id: "a3", data: { id: "a3", title: "Photosynthesis Lab Report",      class: "Grade 10 — Biology",       due: "2026-05-24", status: "Grading", submissions: 26 } },
  { collection: "assignments", id: "a4", data: { id: "a4", title: "Civic Duty Reflection",          class: "Grade 7 — Civic Education",due: "2026-06-02", status: "Open",    submissions: 0  } },
  { collection: "grades", id: "g1", data: { id: "g1", student: "Mariama Doe",  subject: "Mathematics", grade: "A-", score: 91, term: "Term 2" } },
  { collection: "grades", id: "g2", data: { id: "g2", student: "Mariama Doe",  subject: "English",     grade: "B+", score: 87, term: "Term 2" } },
  { collection: "grades", id: "g3", data: { id: "g3", student: "Mariama Doe",  subject: "Biology",     grade: "A",  score: 95, term: "Term 2" } },
  { collection: "grades", id: "g4", data: { id: "g4", student: "Kollie Boima", subject: "Literature",  grade: "A",  score: 94, term: "Term 2" } },
  { collection: "grades", id: "g5", data: { id: "g5", student: "Kollie Boima", subject: "Mathematics", grade: "B",  score: 82, term: "Term 2" } },
  { collection: "grades", id: "g6", data: { id: "g6", student: "Fatu Kanneh",  subject: "Civics",      grade: "A+", score: 98, term: "Term 2" } },
  { collection: "attendance", id: "at1", data: { id: "at1", date: "2026-05-21", class: "Grade 9 — Mathematics",    present: 26, absent: 2, late: 0 } },
  { collection: "attendance", id: "at2", data: { id: "at2", date: "2026-05-21", class: "Grade 11 — Literature",    present: 20, absent: 1, late: 1 } },
  { collection: "attendance", id: "at3", data: { id: "at3", date: "2026-05-20", class: "Grade 10 — Biology",       present: 25, absent: 0, late: 1 } },
  { collection: "attendance", id: "at4", data: { id: "at4", date: "2026-05-20", class: "Grade 7 — Civic Education",present: 29, absent: 2, late: 0 } },
  { collection: "timetable", id: "tt1", data: { id: "tt1", day: "Monday",    slots: [{ t:"08:00",s:"Grade 9 — Mathematics" },{ t:"10:30",s:"Grade 11 — Literature" },{ t:"12:30",s:"Grade 7 — Civic Education" }] } },
  { collection: "timetable", id: "tt2", data: { id: "tt2", day: "Tuesday",   slots: [{ t:"09:00",s:"Grade 10 — Biology" },{ t:"11:00",s:"Staff briefing" }] } },
  { collection: "timetable", id: "tt3", data: { id: "tt3", day: "Wednesday", slots: [{ t:"08:00",s:"Grade 9 — Mathematics" },{ t:"12:30",s:"Grade 7 — Civic Education" }] } },
  { collection: "timetable", id: "tt4", data: { id: "tt4", day: "Thursday",  slots: [{ t:"10:30",s:"Grade 11 — Literature" },{ t:"09:00",s:"Grade 10 — Biology" }] } },
  { collection: "timetable", id: "tt5", data: { id: "tt5", day: "Friday",    slots: [{ t:"08:00",s:"Grade 9 — Mathematics" },{ t:"09:00",s:"Grade 10 — Biology" },{ t:"15:00",s:"Assembly" }] } },
  { collection: "announcements", id: "an1", data: { id: "an1", title: "Parent-Teacher meeting Friday 4pm", body: "All parents invited to Marshall Road auditorium.", audience: "All",     date: "2026-05-22" } },
  { collection: "announcements", id: "an2", data: { id: "an2", title: "Library now open until 7pm",        body: "Extended hours for exam season.",               audience: "Students", date: "2026-05-20" } },
  { collection: "announcements", id: "an3", data: { id: "an3", title: "Vaccination drive complete",        body: "All participants reported healthy.",            audience: "Parents",  date: "2026-05-19" } },
  { collection: "announcements", id: "an4", data: { id: "an4", title: "Donor visit on Tuesday",            body: "Staff please prepare classroom showcases.",     audience: "Staff",    date: "2026-05-18" } },
  { collection: "fees", id: "f1", data: { id: "f1", student: "Mariama Doe", item: "Term 2 Tuition", amount: 320, due: "2026-06-01", status: "Outstanding" } },
  { collection: "fees", id: "f2", data: { id: "f2", student: "Ezekiel Doe", item: "Term 2 Tuition", amount: 280, due: "2026-06-01", status: "Outstanding" } },
  { collection: "fees", id: "f3", data: { id: "f3", student: "Mariama Doe", item: "Lab fee",        amount: 45,  due: "2026-05-15", status: "Paid"        } },
  { collection: "children", id: "ch1", data: { id: "ch1", name: "Mariama Doe", grade: "Grade 9 — Blue", attendance: "96%", gpa: 3.7 } },
  { collection: "children", id: "ch2", data: { id: "ch2", name: "Ezekiel Doe", grade: "Grade 6 — Red",  attendance: "92%", gpa: 3.4 } },
  { collection: "events", id: "e1", data: { id: "e1", title: "Monrovia Alumni Mixer", date: "2026-08-12", location: "Royal Hotel"          } },
  { collection: "events", id: "e2", data: { id: "e2", title: "Annual Reunion",        date: "2026-12-21", location: "Marshall Road Campus"  } },
  { collection: "events", id: "e3", data: { id: "e3", title: "Career Fair",           date: "2027-01-14", location: "Marshall Road Campus"  } },
  { collection: "jobs", id: "j1", data: { id: "j1", title: "Junior Software Engineer", company: "Liberia Telecoms",    location: "Monrovia", posted: "2026-05-12" } },
  { collection: "jobs", id: "j2", data: { id: "j2", title: "Project Coordinator",      company: "Liberia Water Trust", location: "Buchanan", posted: "2026-05-10" } },
  { collection: "jobs", id: "j3", data: { id: "j3", title: "Field Nurse",              company: "HOPE2 Health",        location: "Gbarnga",  posted: "2026-05-08" } },
  { collection: "directory", id: "dir1", data: { id: "dir1", name: "Patience Kollie", year: 2019, role: "Software Engineer",     city: "Monrovia" } },
  { collection: "directory", id: "dir2", data: { id: "dir2", name: "Moses Weah",      year: 2016, role: "Civil Engineer",        city: "Buchanan" } },
  { collection: "directory", id: "dir3", data: { id: "dir3", name: "Bendu Sirleaf",   year: 2020, role: "Teacher",               city: "Gbarnga"  } },
  { collection: "directory", id: "dir4", data: { id: "dir4", name: "Prince Karpeh",   year: 2018, role: "Public Health Officer", city: "Monrovia" } },
  { collection: "donations", id: "d1", data: { id: "d1", donor: "Patience Kollie", amount: 250,  fund: "Scholarship", date: "2026-05-12" } },
  { collection: "donations", id: "d2", data: { id: "d2", donor: "Anonymous",       amount: 1000, fund: "Capital",      date: "2026-05-09" } },
  { collection: "donations", id: "d3", data: { id: "d3", donor: "Moses Weah",      amount: 75,   fund: "Library",      date: "2026-05-02" } },
  { collection: "departments", id: "dp1", data: { id: "dp1", name: "HOPE2 MISSION",  lead: "Esther Pewee",    staff: 18 } },
  { collection: "departments", id: "dp2", data: { id: "dp2", name: "HOPE2 ACADEMY",  lead: "Grace Kollie",    staff: 42 } },
  { collection: "departments", id: "dp3", data: { id: "dp3", name: "HOPE2 CHURCH",   lead: "Joseph Wreh",     staff: 12 } },
  { collection: "departments", id: "dp4", data: { id: "dp4", name: "HOPE2 MEDIA",    lead: "Patience Kollie", staff: 7  } },
  { collection: "audit", id: "au1", data: { id: "au1", actor: "superadmin@hope2.demo", action: "Updated role for Kollie Boima → student", at: "2026-05-22 09:14" } },
  { collection: "audit", id: "au2", data: { id: "au2", actor: "admin@hope2.demo",      action: "Published page /departments",             at: "2026-05-21 17:02" } },
  { collection: "audit", id: "au3", data: { id: "au3", actor: "teacher@hope2.demo",    action: "Submitted grades for Grade 9 Math",       at: "2026-05-21 11:48" } },
  { collection: "resources", id: "r1", data: { id: "r1", title: "Curriculum Framework 2026", type: "PDF",  size: "2.4 MB"  } },
  { collection: "resources", id: "r2", data: { id: "r2", title: "Lesson plan template",       type: "DOCX", size: "120 KB"  } },
  { collection: "resources", id: "r3", data: { id: "r3", title: "Classroom management guide", type: "PDF",  size: "1.1 MB"  } },
  { collection: "library", id: "lb1", data: { id: "lb1", title: "Things Fall Apart",    author: "Chinua Achebe", available: 4 } },
  { collection: "library", id: "lb2", data: { id: "lb2", title: "Half of a Yellow Sun", author: "C. N. Adichie", available: 2 } },
  { collection: "library", id: "lb3", data: { id: "lb3", title: "A Long Way Gone",       author: "Ishmael Beah",  available: 6 } },
  { collection: "admissions", id: "ad1", data: { id: "ad1", applicant: "Hawa Konneh",   grade: "Grade 1",  guardian: "Musa Konneh",    phone: "+231 770 111 222", submitted: "2026-05-12", status: "Interview" } },
  { collection: "admissions", id: "ad2", data: { id: "ad2", applicant: "Daniel Tarr",   grade: "KG-2",     guardian: "Elizabeth Tarr", phone: "+231 770 333 444", submitted: "2026-05-15", status: "Pending"   } },
  { collection: "admissions", id: "ad3", data: { id: "ad3", applicant: "Naomi Flomo",   grade: "Grade 7",  guardian: "Amos Flomo",     phone: "+231 770 555 666", submitted: "2026-05-18", status: "Accepted"  } },
  { collection: "admissions", id: "ad4", data: { id: "ad4", applicant: "Joseph Karpeh", grade: "Grade 10", guardian: "Prince Karpeh",  phone: "+231 770 777 888", submitted: "2026-05-20", status: "Waitlist"  } },
  { collection: "exams", id: "ex1", data: { id: "ex1", subject: "Mathematics", class: "Grade 9",  term: "Term 2",   date: "2026-06-04", room: "R-108", status: "Scheduled" } },
  { collection: "exams", id: "ex2", data: { id: "ex2", subject: "Literature",  class: "Grade 11", term: "Term 2",   date: "2026-06-05", room: "R-110", status: "Scheduled" } },
  { collection: "exams", id: "ex3", data: { id: "ex3", subject: "Biology",     class: "Grade 10", term: "Mid-Term", date: "2026-05-28", room: "Lab-1", status: "Completed" } },
  { collection: "exams", id: "ex4", data: { id: "ex4", subject: "Civics",      class: "Grade 7",  term: "Term 2",   date: "2026-06-02", room: "R-105", status: "Scheduled" } },
  { collection: "behavior", id: "bh1", data: { id: "bh1", student: "Mariama Doe",  class: "Grade 9",  type: "Commendation", description: "Top score in Math quiz",   date: "2026-05-19", reporter: "Grace Tubman" } },
  { collection: "behavior", id: "bh2", data: { id: "bh2", student: "Kollie Boima", class: "Grade 11", type: "Warning",      description: "Late submission of essay", date: "2026-05-18", reporter: "Amos Flomo"  } },
  { collection: "behavior", id: "bh3", data: { id: "bh3", student: "Fatu Kanneh",  class: "Grade 7",  type: "Commendation", description: "Helped classmate",         date: "2026-05-17", reporter: "Ruth Gonpu"  } },
  { collection: "lessonplans", id: "lp1", data: { id: "lp1", title: "Quadratic Equations", subject: "Mathematics", class: "Grade 9",  week: "Week 8", objectives: "Solve quadratics by factoring and the quadratic formula.", status: "Approved"  } },
  { collection: "lessonplans", id: "lp2", data: { id: "lp2", title: "Romeo & Juliet Act 2", subject: "Literature", class: "Grade 11", week: "Week 8", objectives: "Analyse character motivations in Act 2.",                  status: "Submitted" } },
  { collection: "lessonplans", id: "lp3", data: { id: "lp3", title: "Cell Division",         subject: "Biology",   class: "Grade 10", week: "Week 8", objectives: "Compare mitosis and meiosis.",                            status: "Draft"     } },
  { collection: "transport", id: "tr1", data: { id: "tr1", route: "Marshall Road Loop",    driver: "James Roberts", vehicle: "LR-2210", departure: "06:30", riders: 32, feeUsd: 20 } },
  { collection: "transport", id: "tr2", data: { id: "tr2", route: "Barber's Joe → Campus", driver: "Peter Cooper",  vehicle: "LR-3318", departure: "06:45", riders: 28, feeUsd: 18 } },
  { collection: "transport", id: "tr3", data: { id: "tr3", route: "Margibi East Line",      driver: "Alfred Saah",   vehicle: "LR-1102", departure: "06:15", riders: 24, feeUsd: 22 } },
  { collection: "clinic", id: "cl1", data: { id: "cl1", student: "Mariama Doe", visitDate: "2026-05-19", reason: "Mild headache", action: "Paracetamol, rest 30 min", nurse: "Nurse Helen", status: "Treated"  } },
  { collection: "clinic", id: "cl2", data: { id: "cl2", student: "Ezekiel Doe", visitDate: "2026-05-17", reason: "Scraped knee",  action: "Cleaned & bandaged",       nurse: "Nurse Helen", status: "Treated"  } },
  { collection: "clinic", id: "cl3", data: { id: "cl3", student: "Fatu Kanneh", visitDate: "2026-05-16", reason: "Fever",         action: "Referred to clinic",       nurse: "Nurse Helen", status: "Referred" } },
  { collection: "calendar", id: "ca1", data: { id: "ca1", title: "Term 2 Mid-term Exams", type: "Exam",    startDate: "2026-05-28", endDate: "2026-06-05", audience: "Students" } },
  { collection: "calendar", id: "ca2", data: { id: "ca2", title: "Independence Day",       type: "Holiday", startDate: "2026-07-26", endDate: "2026-07-26", audience: "All"      } },
  { collection: "calendar", id: "ca3", data: { id: "ca3", title: "PTA Meeting",            type: "PTA",     startDate: "2026-06-13", endDate: "2026-06-13", audience: "Parents"  } },
  { collection: "calendar", id: "ca4", data: { id: "ca4", title: "Inter-house Sports Day", type: "Sports",  startDate: "2026-06-20", endDate: "2026-06-20", audience: "All"      } },
  { collection: "inventory", id: "in1", data: { id: "in1", item: "Student desks",       category: "Furniture",   quantity: 240, location: "Marshall Campus", condition: "Good" } },
  { collection: "inventory", id: "in2", data: { id: "in2", item: "Laptop (Dell)",        category: "Electronics", quantity: 18,  location: "Computer Lab",    condition: "Good" } },
  { collection: "inventory", id: "in3", data: { id: "in3", item: "Microscope",           category: "Lab",         quantity: 12,  location: "Science Lab",     condition: "Fair" } },
  { collection: "inventory", id: "in4", data: { id: "in4", item: "Football kit",         category: "Sports",      quantity: 4,   location: "Sports Store",    condition: "New"  } },
  { collection: "inventory", id: "in5", data: { id: "in5", item: "Curriculum books G9",  category: "Books",       quantity: 60,  location: "Library",         condition: "Good" } },
  { collection: "staff", id: "st1", data: { id: "st1", name: "Grace Tubman",    role: "Lead Teacher",   department: "HOPE2 ACADEMY", phone: "+231 775 975 544", salaryUsd: 320, status: "Active"   } },
  { collection: "staff", id: "st2", data: { id: "st2", name: "Joseph Wreh",     role: "Pastor",         department: "HOPE2 CHURCH",  phone: "+231 770 222 333", salaryUsd: 280, status: "Active"   } },
  { collection: "staff", id: "st3", data: { id: "st3", name: "Esther Pewee",    role: "Field Director", department: "HOPE2 MISSION", phone: "+231 770 444 555", salaryUsd: 360, status: "Active"   } },
  { collection: "staff", id: "st4", data: { id: "st4", name: "Patience Kollie", role: "Media Lead",     department: "HOPE2 MEDIA",   phone: "+231 770 666 777", salaryUsd: 240, status: "Active"   } },
  { collection: "staff", id: "st5", data: { id: "st5", name: "Amos Flomo",      role: "Teacher",        department: "HOPE2 ACADEMY", phone: "+231 770 888 999", salaryUsd: 250, status: "On Leave" } },
  { collection: "scholarships", id: "sc1", data: { id: "sc1", student: "Mariama Doe",  sponsor: "Patience Kollie", amountUsd: 320, term: "Term 2", status: "Active"      } },
  { collection: "scholarships", id: "sc2", data: { id: "sc2", student: "Kollie Boima", sponsor: "Anonymous",       amountUsd: 480, term: "Annual", status: "Paid"        } },
  { collection: "scholarships", id: "sc3", data: { id: "sc3", student: "Fatu Kanneh",  sponsor: "Moses Weah",      amountUsd: 200, term: "Term 2", status: "Outstanding" } },
  { collection: "settings", id: "s1", data: { id: "s1", key: "Site name",     value: "HOPE2 ACADEMY"        } },
  { collection: "settings", id: "s2", data: { id: "s2", key: "Contact email", value: "info@hope2academy.org" } },
  { collection: "settings", id: "s3", data: { id: "s3", key: "Primary color", value: "Crimson 600"           } },
  { collection: "settings", id: "s4", data: { id: "s4", key: "Timezone",      value: "Africa/Monrovia"       } },
  { collection: "posts", id: "po1", data: { id: "po1", title: "How clean water changed Gbarnga", author: "Editorial", status: "Published", date: "2026-05-10" } },
  { collection: "posts", id: "po2", data: { id: "po2", title: "Top of class — meet Mariama",     author: "Editorial", status: "Draft",     date: "2026-05-18" } },
  { collection: "posts", id: "po3", data: { id: "po3", title: "Volunteer week recap",             author: "Editorial", status: "Published", date: "2026-05-04" } },
];

export async function seedIfEmpty() {
  const userCount = await db
    .select({ count: sql<string>`count(*)` })
    .from(usersTable);
  const count = parseInt(userCount[0]?.count ?? "0", 10);
  if (count > 0) {
    console.log(`[seed] Database already has ${count} users — skipping seed.`);
    return;
  }

  console.log("[seed] Seeding database with demo data…");

  for (const u of SEED_USERS) {
    await dbStore.createUser(u as any);
  }

  for (const item of SEED_ITEMS) {
    await db.insert(itemsTable).values({
      collection: item.collection,
      id: item.id,
      data: item.data,
    });
  }

  console.log(`[seed] Done. Inserted ${SEED_USERS.length} users and ${SEED_ITEMS.length} items.`);
}
