/**
 * Team members store — persistent, editable team roster for the public Team page.
 * Editable by Superadmin & Admin via the in-portal Team Editor module.
 */
import { useEffect, useState } from "react";
import t1 from "@/assets/hope/team-1-Bn-q5HvV.jpg";
import t2 from "@/assets/hope/team-2-D4VCNnPr.jpg";
import t3 from "@/assets/hope/team-3-tdy6Cq2g.jpg";
import t4 from "@/assets/hope/team-4-2AMdCmzy.jpg";
import t5 from "@/assets/hope/team-5-TEI3yivU.jpg";
import t6 from "@/assets/hope/team-6-C_ZECXo7.jpg";
import { apiClient } from "./api-client";
import { pushSingleton } from "./cms-sync";

export interface TeamMember {
  id: string;
  img: string;
  name: string;
  role: string;
  bio?: string;
  email?: string;
  linkedin?: string;
  enabled: boolean;
}

export interface TeamPageContent {
  eyebrow: string;
  title: string;
  lead: string;
  sectionHeading: string;
  sectionLead: string;
  quote: string;
  quoteAuthor: string;
  members: TeamMember[];
}

const KEY = "h2l.team.v1";

export const DEFAULT_TEAM: TeamPageContent = {
  eyebrow: "Our People",
  title: "The hands, hearts, and minds behind the mission.",
  lead: "A Liberian-led team of directors, doctors, educators, and community builders — united by one promise.",
  sectionHeading: "Meet the leadership",
  sectionLead: "Six leaders. One mission. Every member of our team lives and works alongside the communities we serve in Margibi County and across Liberia.",
  quote: "We are not visitors to Liberia. We are her sons and daughters, building the country we love.",
  quoteAuthor: "— The HOPE2 ACADEMY Team",
  members: [
    { id: "tm1", img: t1, name: "Rev. Samuel K. Doe", role: "Founder & Executive Director", bio: "Founder of HOPE2 ACADEMY (2013) and lead visionary for the four divisions.", email: "samuel@hope2academy.org", linkedin: "#", enabled: true },
    { id: "tm2", img: t2, name: "Mariama Johnson", role: "Director of Operations", bio: "Oversees daily operations across the Marshall Road campus.", email: "ops@hope2academy.org", linkedin: "#", enabled: true },
    { id: "tm3", img: t3, name: "Dr. Emmanuel Tarpeh", role: "Head of Health & Wellness", bio: "Leads mobile clinics and HOPE2 MISSION health outreach.", email: "health@hope2academy.org", linkedin: "#", enabled: true },
    { id: "tm4", img: t4, name: "Grace Kollie", role: "Director of HOPE2 ACADEMY", bio: "Director of the K-12 academy. Champions early literacy & STEM.", email: "grace@hope2academy.org", linkedin: "#", enabled: true },
    { id: "tm5", img: t5, name: "Pastor Joseph Wreh", role: "Lead Pastor, HOPE2 CHURCH", bio: "Pastors the Marshall Road sanctuary and partner congregations.", email: "pastor@hope2academy.org", linkedin: "#", enabled: true },
    { id: "tm6", img: t6, name: "Esther Pewee", role: "HOPE2 MISSION Coordinator", bio: "Coordinates field missions across Margibi and beyond.", email: "mission@hope2academy.org", linkedin: "#", enabled: true },
  ],
};

function isBrowser() { return typeof window !== "undefined" && typeof localStorage !== "undefined"; }

function read(): TeamPageContent {
  if (!isBrowser()) return DEFAULT_TEAM;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_TEAM;
    const parsed = JSON.parse(raw) as Partial<TeamPageContent>;
    return { ...DEFAULT_TEAM, ...parsed, members: parsed.members?.length ? parsed.members : DEFAULT_TEAM.members };
  } catch { return DEFAULT_TEAM; }
}
function write(v: TeamPageContent) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent("h2l.team.change"));
}

/** Persist to the local cache AND mirror the full team content to the backend. */
function persist(v: TeamPageContent) {
  write(v);
  pushSingleton("team", "team", v, "team");
}

export const teamStore = {
  get(): TeamPageContent { return read(); },
  setContent(patch: Partial<Omit<TeamPageContent, "members">>) {
    const next = { ...read(), ...patch }; persist(next); return next;
  },
  upsertMember(m: TeamMember) {
    const cur = read();
    const i = cur.members.findIndex(x => x.id === m.id);
    const members = [...cur.members];
    if (i === -1) members.push(m); else members[i] = m;
    persist({ ...cur, members }); return members;
  },
  removeMember(id: string) {
    const cur = read(); persist({ ...cur, members: cur.members.filter(x => x.id !== id) });
  },
  moveMember(id: string, dir: -1 | 1) {
    const cur = read(); const members = [...cur.members];
    const i = members.findIndex(x => x.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= members.length) return;
    [members[i], members[j]] = [members[j], members[i]]; persist({ ...cur, members });
  },
  reset() { persist(DEFAULT_TEAM); return DEFAULT_TEAM; },
  newId() { return `tm_${Math.random().toString(36).slice(2, 9)}`; },
};

// ---------- Backend hydration ----------
let hydrated = false;
/** Pull server-stored team content into the local cache (server wins). Runs once. */
export async function hydrateTeam(): Promise<void> {
  if (!isBrowser() || hydrated) return;
  hydrated = true;
  try {
    const rows = await apiClient.list<TeamPageContent & { id?: string }>("team");
    const remote = rows[0];
    if (remote) {
      const { id: _id, ...rest } = remote as TeamPageContent & { id?: string };
      write({
        ...DEFAULT_TEAM,
        ...rest,
        members: rest.members?.length ? rest.members : DEFAULT_TEAM.members,
      });
    }
  } catch {
    /* API offline — keep cache/defaults so the public site still renders */
  }
}
if (isBrowser()) void hydrateTeam();

export function useTeamContent(): TeamPageContent {
  const [v, setV] = useState<TeamPageContent>(() => read());
  useEffect(() => {
    const h = () => setV(read());
    window.addEventListener("h2l.team.change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("h2l.team.change", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return v;
}