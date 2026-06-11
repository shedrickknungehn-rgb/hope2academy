/**
 * CMS store — localStorage-backed CRUD for public-website content:
 *   - Pages (title, slug, body, SEO, status)
 *   - Media (uploads as data URLs, folders, metadata)
 *   - Navigation (top-nav structure consumed by SiteLayout)
 * Pub/sub so React components re-render on writes.
 */

export type PageStatus = "Draft" | "Published";
export interface CmsPage {
  id: string;
  title: string;
  slug: string;          // e.g. "/about"
  body: string;          // markdown / rich-text
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: PageStatus;
  updated: string;       // ISO date
}

export interface CmsMedia {
  id: string;
  name: string;
  type: string;          // mime type
  size: number;          // bytes
  folder: string;
  url: string;           // data URL or remote URL
  alt?: string;
  uploaded: string;
}

export interface NavChild { id: string; label: string; to: string; description?: string }
export interface NavItem {
  id: string;
  label: string;
  to?: string;
  children?: NavChild[];
}

const K_PAGES = "h2l.cms.pages";
const K_MEDIA = "h2l.cms.media";
const K_NAV   = "h2l.cms.nav";

function isBrowser() { return typeof window !== "undefined" && typeof localStorage !== "undefined"; }

function read<T>(k: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) as T : fallback; }
  catch { return fallback; }
}
function write(k: string, v: unknown) {
  if (!isBrowser()) return;
  localStorage.setItem(k, JSON.stringify(v));
  // notify listeners
  window.dispatchEvent(new CustomEvent("h2l.cms.change", { detail: { key: k } }));
}

const id = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString().slice(0, 10);

// ---------- Seed defaults ----------
const DEFAULT_PAGES: CmsPage[] = [
  { id: "p_home",    title: "Home",       slug: "/",            status: "Published", updated: now(),
    body: "Welcome to HOPE2 ACADEMY — a movement of compassion across Liberia.",
    seoTitle: "HOPE2 ACADEMY — Compassion in Action",
    seoDescription: "Education, Health, Water and Community programs across Liberia." },
  { id: "p_about",   title: "About",      slug: "/about",       status: "Published", updated: now(),
    body: "Our mission is to walk with Liberian communities as they rebuild stronger than before.",
    seoTitle: "About HOPE2 ACADEMY", seoDescription: "Mission, vision and history." },
  { id: "p_progs",   title: "Programs",   slug: "/departments", status: "Published", updated: now(),
    body: "Education, Health, Water & Sanitation, and Community Development.",
    seoTitle: "Our Programs", seoDescription: "Departments and initiatives." },
  { id: "p_contact", title: "Contact",    slug: "/contact",     status: "Published", updated: now(),
    body: "Barber's Joe Town, Marshall Road, Lower Margibi County, Liberia. info@hope2academy.org. Office hours: Mon–Fri 7:00 AM – 4:00 PM.",
    seoTitle: "Contact HOPE2 ACADEMY", seoDescription: "Get in touch with our team." },
];

const DEFAULT_NAV: NavItem[] = [
  { id: id(), label: "Home", to: "/" },
  { id: id(), label: "About", children: [
    { id: id(), label: "Our Story", to: "/about", description: "Mission, vision, history" },
    { id: id(), label: "Leadership & Team", to: "/team", description: "The people behind HOPE2" },
  ]},
  { id: id(), label: "Programs", children: [
    { id: id(), label: "Departments", to: "/departments", description: "Education, Health, Water, Community" },
    { id: id(), label: "Projects", to: "/projects", description: "Active initiatives across Liberia" },
  ]},
  { id: id(), label: "Stories", to: "/stories" },
  { id: id(), label: "Contact", to: "/contact" },
];

function seed() {
  if (!isBrowser()) return;
  if (!localStorage.getItem(K_PAGES)) write(K_PAGES, DEFAULT_PAGES);
  if (!localStorage.getItem(K_NAV))   write(K_NAV,   DEFAULT_NAV);
  if (!localStorage.getItem(K_MEDIA)) write(K_MEDIA, []);
}

export const cmsStore = {
  init() { seed(); },

  // ----- Pages -----
  listPages(): CmsPage[] { seed(); return read<CmsPage[]>(K_PAGES, []); },
  getPage(id: string) { return this.listPages().find(p => p.id === id) ?? null; },
  upsertPage(p: Partial<CmsPage> & { id?: string }): CmsPage {
    const all = this.listPages();
    if (p.id) {
      const idx = all.findIndex(x => x.id === p.id);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...p, updated: now() } as CmsPage;
        write(K_PAGES, all); return all[idx];
      }
    }
    const created: CmsPage = {
      id: id(),
      title: p.title ?? "Untitled",
      slug: p.slug ?? `/page-${Math.random().toString(36).slice(2,6)}`,
      body: p.body ?? "",
      excerpt: p.excerpt,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      status: p.status ?? "Draft",
      updated: now(),
    };
    write(K_PAGES, [created, ...all]);
    return created;
  },
  deletePage(id: string) { write(K_PAGES, this.listPages().filter(p => p.id !== id)); },

  // ----- Media -----
  listMedia(): CmsMedia[] { seed(); return read<CmsMedia[]>(K_MEDIA, []); },
  addMedia(m: Omit<CmsMedia, "id" | "uploaded">): CmsMedia {
    const created: CmsMedia = { ...m, id: id(), uploaded: now() };
    write(K_MEDIA, [created, ...this.listMedia()]);
    return created;
  },
  updateMedia(id: string, patch: Partial<CmsMedia>) {
    const all = this.listMedia();
    const idx = all.findIndex(x => x.id === id);
    if (idx < 0) return;
    all[idx] = { ...all[idx], ...patch };
    write(K_MEDIA, all);
  },
  deleteMedia(id: string) { write(K_MEDIA, this.listMedia().filter(m => m.id !== id)); },

  // ----- Navigation -----
  listNav(): NavItem[] { seed(); return read<NavItem[]>(K_NAV, DEFAULT_NAV); },
  saveNav(items: NavItem[]) { write(K_NAV, items); },
  resetNav() { write(K_NAV, DEFAULT_NAV); },
  newId: id,
};

// ---------- React hook ----------
import { useEffect, useState } from "react";
export function useCmsVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const h = () => setV(x => x + 1);
    window.addEventListener("h2l.cms.change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("h2l.cms.change", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return v;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}