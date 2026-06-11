import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LogIn, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, ROLE_LABEL } from "@/hooks/use-auth";
import { cmsStore, useCmsVersion, type NavItem } from "@/lib/cms-store";
import { Logo, BrandWordmark } from "@/components/Logo";
import { useBrand } from "@/lib/brand";
import { LiveChat } from "@/components/LiveChat";

const FOOTER_LINKS = [
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/departments", label: "Departments" },
  { to: "/projects", label: "Projects" },
  { to: "/stories", label: "Stories" },
  { to: "/contact", label: "Contact" },
];

export function SiteLayout() {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const { pathname } = useLocation();
  const { user, primaryRole } = useAuth();
  const brand = useBrand();
  useCmsVersion(); // re-render when CMS nav changes
  const NAV: NavItem[] = cmsStore.listNav();
  // Hide public marketing chrome (nav + footer) once user is in the backend portal.
  const inPortal = pathname.startsWith("/portal");
  const isLoginPage = pathname === "/login";
  const hidePublicChrome = (inPortal && !!user) || isLoginPage;

  // Login page gets full-screen treatment — no header, no footer
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
        <LiveChat />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
        className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-3 font-bold text-lg tracking-tight">
            <motion.span whileHover={{ rotate: 6, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Logo size={44} />
            </motion.span>
            <BrandWordmark />
          </Link>
          {hidePublicChrome ? (
            <div className="hidden lg:flex items-center gap-3">
              <Link
                to="/portal"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)]"
              >
                <User className="h-4 w-4" />
                {primaryRole ? ROLE_LABEL[primaryRole] : "Portal"}
              </Link>
            </div>
          ) : (
          <nav className="hidden lg:flex items-center gap-1" onMouseLeave={() => setHover(null)}>
            {NAV.map((n) => {
              const active = n.to ? pathname === n.to : n.children?.some(c => c.to === pathname);
              if (n.children) {
                const isOpen = hover === n.label;
                return (
                  <div key={n.label} className="relative" onMouseEnter={() => setHover(n.label)}>
                    <button
                      className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-full transition-colors ${active ? "text-primary" : "text-foreground/75 hover:text-foreground"}`}
                    >
                      {n.label}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18 }}
                          className="absolute left-0 top-full pt-2 w-72 z-50"
                        >
                          <div className="rounded-2xl bg-card border border-border shadow-[var(--shadow-warm)] p-2">
                            {n.children.map((c) => (
                              <Link
                                key={c.id}
                                to={c.to}
                                className="block rounded-xl px-3 py-2.5 hover:bg-muted transition"
                              >
                                <p className="text-sm font-semibold text-foreground">{c.label}</p>
                                {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <Link
                  key={n.id}
                  to={n.to!}
                  className={`relative px-3 py-2 text-sm font-medium rounded-full transition-colors ${active ? "text-primary" : "text-foreground/75 hover:text-foreground"}`}
                >
                  {n.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            <div className="mx-2 h-6 w-px bg-border" />

            <Link
              to="/get-involved"
              className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm font-semibold hover:brightness-95 transition shadow-[var(--shadow-soft)]"
            >
              Donate
            </Link>

            {user ? (
              <Link
                to="/portal"
                className="ml-2 group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-warm)] transition-all"
              >
                <User className="h-4 w-4" />
                {primaryRole ? ROLE_LABEL[primaryRole] : "Portal"}
              </Link>
            ) : (
              <Link
                to="/login"
                className="ml-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary transition"
              >
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
            )}
          </nav>
          )}
          <button
            className={`lg:hidden p-2 ${hidePublicChrome ? "hidden" : ""}`}
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {open && !hidePublicChrome && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden overflow-hidden border-t border-border bg-background"
            >
              <div className="container mx-auto px-6 py-4 flex flex-col gap-1">
                {NAV.flatMap((n) =>
                  n.children && n.children.length > 0
                    ? [<p key={n.id} className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{n.label}</p>,
                       ...n.children.map(c => (
                        <Link key={c.id} to={c.to} onClick={() => setOpen(false)} className="px-2 py-2 rounded-lg hover:bg-muted text-foreground/80">{c.label}</Link>
                       ))]
                    : [<Link key={n.id} to={n.to!} onClick={() => setOpen(false)} className="px-2 py-2 rounded-lg hover:bg-muted text-foreground/80">{n.label}</Link>]
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link to="/get-involved" onClick={() => setOpen(false)} className="rounded-full bg-secondary text-secondary-foreground px-4 py-2.5 text-sm font-semibold text-center">Donate</Link>
                  <Link to={user ? "/portal" : "/login"} onClick={() => setOpen(false)} className="rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold text-center">{user ? "My Portal" : "Sign In"}</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      <main className="flex-1">
        <Outlet />
      </main>
      {!hidePublicChrome && (
      <footer className="mt-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 font-bold text-xl">
              <Logo size={52} className="ring-white/30" />
              <BrandWordmark />
            </div>
            <p className="mt-4 text-primary-foreground/80 max-w-md">{brand.footerBlurb}</p>
            <p className="mt-2 text-xs text-primary-foreground/70 italic">"{brand.motto}"</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-accent">Explore</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              {FOOTER_LINKS.map((n) => (
                <li key={n.to}><Link to={n.to}>{n.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-accent">Contact</h4>
            <p className="text-sm text-primary-foreground/80">
              {brand.address}<br />{brand.city}, {brand.country}<br />{brand.email}
            </p>
            <p className="mt-3 text-xs text-primary-foreground/70">
              Office hours<br />{brand.officeHours}
            </p>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 py-6 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} {brand.name}. Built with hope.
        </div>
      </footer>
      )}
      <LiveChat />
    </div>
  );
}