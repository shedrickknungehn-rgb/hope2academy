/**
 * Hero slides store — persistent, editable slides for the public homepage carousel.
 * Editable by Superadmin & Admin via the in-portal Hero Slider module.
 * Persists to localStorage and broadcasts a CustomEvent so the public site
 * re-renders the moment slides change.
 */
import { useEffect, useState } from "react";
import s1 from "@/assets/hero/IMG-20260521-WA0022-2.jpg.asset.json";
import s2 from "@/assets/hero/IMG-20260521-WA0000.jpg.asset.json";
import s3 from "@/assets/hero/IMG-20260521-WA0003-2.jpg.asset.json";
import s4 from "@/assets/hero/IMG-20260521-WA0006.jpg.asset.json";
import s5 from "@/assets/hero/IMG-20260521-WA0012-2.jpg.asset.json";
import { apiClient } from "./api-client";
import { pushSingleton } from "./cms-sync";

export interface HeroSlide {
  id: string;
  img: string;
  alt: string;
  kicker: string;
  title: string;          // first part
  titleAccent: string;    // accent-coloured tail
  body: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel: string;
  secondaryTo: string;
  enabled: boolean;
}

const KEY = "h2l.hero.v1";

export const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "h1", img: s1.url,
    alt: "HOPE2 ACADEMY student reading scripture in uniform",
    kicker: "Faith · Character · Scholarship",
    title: "Raising leaders",
    titleAccent: "rooted in purpose",
    body: "At HOPE2 ACADEMY, every learner is formed in faith, discipline, and the joy of discovery — ABC through 12th grade.",
    primaryLabel: "Sponsor a Student", primaryTo: "/get-involved",
    secondaryLabel: "Our Mission", secondaryTo: "/about",
    enabled: true,
  },
  {
    id: "h2", img: s2.url,
    alt: "Student studying the Bible during devotion",
    kicker: "HOPE2 CHURCH · Daily Devotion",
    title: "A foundation of",
    titleAccent: "faith & wisdom",
    body: "Mornings begin with Scripture and reflection — anchoring each child's learning in values that last a lifetime.",
    primaryLabel: "Explore Divisions", primaryTo: "/departments",
    secondaryLabel: "Read Stories", secondaryTo: "/stories",
    enabled: true,
  },
  {
    id: "h3", img: s3.url,
    alt: "HOPE2 graduates of the teacher training program",
    kicker: "HOPE2 MISSION · Capacity Building",
    title: "Training the",
    titleAccent: "teachers of Liberia",
    body: "We equip educators with certified training so classrooms across the country grow stronger — together we rebuild a nation.",
    primaryLabel: "Our Programs", primaryTo: "/projects",
    secondaryLabel: "Meet the Team", secondaryTo: "/team",
    enabled: true,
  },
  {
    id: "h4", img: s4.url,
    alt: "Hundreds of HOPE2 ACADEMY students taking exams",
    kicker: "Academic Excellence",
    title: "Where focus meets",
    titleAccent: "opportunity",
    body: "From kindergarten to twelfth grade, our scholars sit for rigorous assessments — preparing minds for university and beyond.",
    primaryLabel: "Partner With Us", primaryTo: "/get-involved",
    secondaryLabel: "Academics", secondaryTo: "/about",
    enabled: true,
  },
  {
    id: "h5", img: s5.url,
    alt: "HOPE2 ACADEMY graduation ceremony in robes",
    kicker: "Class of Hope · Graduation",
    title: "Celebrating",
    titleAccent: "every milestone",
    body: "Each cap and gown is a promise kept — to families, to communities, and to the next generation of Liberian leaders.",
    primaryLabel: "Give to Scholarships", primaryTo: "/get-involved",
    secondaryLabel: "See Graduates", secondaryTo: "/stories",
    enabled: true,
  },
];

function isBrowser() { return typeof window !== "undefined" && typeof localStorage !== "undefined"; }

function read(): HeroSlide[] {
  if (!isBrowser()) return DEFAULT_SLIDES;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SLIDES;
    const arr = JSON.parse(raw) as HeroSlide[];
    return Array.isArray(arr) && arr.length ? arr : DEFAULT_SLIDES;
  } catch { return DEFAULT_SLIDES; }
}
function write(v: HeroSlide[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent("h2l.hero.change"));
}

/** Persist to the local cache AND mirror the full slide list to the backend. */
function persist(v: HeroSlide[]) {
  write(v);
  pushSingleton("hero", "hero", { items: v }, "hero");
}

export const heroStore = {
  list(): HeroSlide[] { return read(); },
  setAll(v: HeroSlide[]) { persist(v); return v; },
  upsert(slide: HeroSlide) {
    const all = read();
    const i = all.findIndex(s => s.id === slide.id);
    if (i === -1) all.push(slide); else all[i] = slide;
    persist(all); return all;
  },
  remove(id: string) {
    persist(read().filter(s => s.id !== id));
  },
  move(id: string, dir: -1 | 1) {
    const all = read(); const i = all.findIndex(s => s.id === id);
    const j = i + dir; if (i < 0 || j < 0 || j >= all.length) return;
    [all[i], all[j]] = [all[j], all[i]]; persist(all);
  },
  reset() { persist(DEFAULT_SLIDES); return DEFAULT_SLIDES; },
  newId() { return `h_${Math.random().toString(36).slice(2, 9)}`; },
};

// ---------- Backend hydration ----------
let hydrated = false;
/** Pull server-stored hero slides into the local cache (server wins). Runs once. */
export async function hydrateHero(): Promise<void> {
  if (!isBrowser() || hydrated) return;
  hydrated = true;
  try {
    const rows = await apiClient.list<{ id: string; items?: HeroSlide[] }>("hero");
    const remote = rows[0]?.items;
    if (Array.isArray(remote) && remote.length) write(remote);
  } catch {
    /* API offline — keep cache/defaults so the public site still renders */
  }
}
if (isBrowser()) void hydrateHero();

export function useHeroSlides(): HeroSlide[] {
  const [v, setV] = useState<HeroSlide[]>(() => read());
  useEffect(() => {
    const h = () => setV(read());
    window.addEventListener("h2l.hero.change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("h2l.hero.change", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return v;
}