import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { mockAuth, DEMO_CREDENTIALS, ROLE_LABEL } from "@/lib/mock-backend";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo, BrandWordmark } from "@/components/Logo";
import { useBrand } from "@/lib/brand";


function LoginPage() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const brand = useBrand();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/portal");
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await mockAuth.signIn(email, password);
      await refresh();
      toast.success("Welcome back");
      navigate("/portal");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (e: string, p: string) => { setEmail(e); setPassword(p); };
  const quickSignIn = async (e: string, p: string) => {
    setEmail(e); setPassword(p); setSubmitting(true);
    try {
      await mockAuth.signIn(e, p);
      await refresh();
      toast.success("Signed in as demo user");
      navigate("/portal");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-in failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="absolute inset-0 -z-10 bg-background/40 backdrop-blur-[2px]" />
      <div className="container mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-primary-foreground hidden lg:block"
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-semibold tracking-widest uppercase">
            <Logo size={28} />
            <BrandWordmark /> Portal
          </div>
          <h1 className="font-display text-5xl xl:text-6xl font-semibold leading-[1.05] mt-6">
            Welcome back to the<br />movement of compassion.
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/90 max-w-md">
            Sign in to access your dashboard — administrator, teacher, student, parent or alum.
          </p>

          <div className="mt-10 rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-5 max-w-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Demo credentials
            </div>
            <p className="mt-1 text-xs text-primary-foreground/80">Click a role to sign in instantly.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((c) => (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => quickSignIn(c.email, c.password)}
                  className="group rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/10 px-3 py-2.5 text-left"
                >
                  <p className="text-xs font-bold">{ROLE_LABEL[c.role]}</p>
                  <p className="text-[10px] text-primary-foreground/70 truncate">{c.email}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-primary-foreground/70">Password for all: <span className="font-mono font-semibold">demo1234</span></p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="rounded-3xl bg-card shadow-[var(--shadow-warm)] border border-border p-8">
            <div className="flex items-center gap-3">
              <Logo size={52} />
              <div>
                <h2 className="font-display text-2xl font-semibold">Sign in</h2>
                <p className="text-xs text-muted-foreground">Access your {brand.name} portal</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@hope2academy.org" className="pl-9" />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" className="pl-9" />
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-11 text-base font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Admin-invite only.</strong> Accounts are created by Super Admins or Admins. If you don't have credentials yet, <Link to="/contact" className="text-primary font-semibold underline">contact us</Link>.
            </div>

            <div className="mt-4 lg:hidden">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Demo accounts</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_CREDENTIALS.map((c) => (
                  <button
                    key={c.role}
                    type="button"
                    onClick={() => fillDemo(c.email, c.password)}
                    className="rounded-lg border border-border px-2.5 py-2 text-left text-[11px] hover:border-primary hover:text-primary transition"
                  >
                    <span className="font-semibold block">{ROLE_LABEL[c.role]}</span>
                    <span className="text-muted-foreground flex items-center gap-1"><Copy className="h-3 w-3"/>Fill</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Password: <span className="font-mono">demo1234</span></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;
