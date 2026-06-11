/**
 * Brand store — central, persistent source of truth for site/system branding.
 * Editable by Superadmin & Admin via the in-portal Site Settings module.
 * All values are persisted to localStorage and broadcast via a CustomEvent
 * so React components re-render the moment they change.
 */
import logoAsset from "@/assets/hope2-logo.png.asset.json";
import { useEffect, useState } from "react";

export interface BrandSettings {
  name: string;          // HOPE2 ACADEMY
  shortName: string;     // HOPE2
  tagline: string;
  motto: string;
  established: string;
  logoUrl: string;       // CDN url OR data URL (uploaded)
  faviconUrl: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  officeHours: string;
  primaryHex: string;
  accentHex: string;
  footerBlurb: string;
  chatGreeting: string;
}

const KEY = "h2l.brand.v2";

export const DEFAULT_BRAND: BrandSettings = {
  name: "HOPE2 ACADEMY",
  shortName: "HOPE2",
  tagline: "Learning To Serve For God's Purpose",
  motto: "Learning To Serve For God's Purpose",
  established: "2013",
  logoUrl: logoAsset.url,
  faviconUrl: logoAsset.url,
  address: "Barber's Joe Town, Marshall Road",
  city: "Lower Margibi County",
  country: "Liberia",
  email: "info@hope2academy.org",
  phone: "+231 775 975 544",
  officeHours: "Mon–Fri · 7:00 AM – 4:00 PM",
  primaryHex: "#7a1d1d",
  accentHex: "#f4c542",
  footerBlurb:
    "A movement of compassion across Liberia — walking with communities as they rebuild stronger than before.",
  chatGreeting:
    "Hi! I'm the HOPE2 ACADEMY assistant. Ask me about admissions, our four divisions, programs, contact info or anything about the system.",
};

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function read(): BrandSettings {
  if (!isBrowser()) return DEFAULT_BRAND;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BRAND;
    return { ...DEFAULT_BRAND, ...(JSON.parse(raw) as Partial<BrandSettings>) };
  } catch {
    return DEFAULT_BRAND;
  }
}

function write(v: BrandSettings) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent("h2l.brand.change"));
}

export const brandStore = {
  get(): BrandSettings { return read(); },
  set(patch: Partial<BrandSettings>) {
    const next = { ...read(), ...patch };
    write(next);
    return next;
  },
  reset() { write(DEFAULT_BRAND); return DEFAULT_BRAND; },
};

/** Subscribe to brand changes. Returns the current brand settings. */
export function useBrand(): BrandSettings {
  const [b, setB] = useState<BrandSettings>(() => read());
  useEffect(() => {
    const h = () => setB(read());
    window.addEventListener("h2l.brand.change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("h2l.brand.change", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return b;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}