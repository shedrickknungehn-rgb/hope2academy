import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { DEMO_CREDENTIALS, ROLE_LABEL } from "@/lib/mock-backend";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo, BrandWordmark } from "@/components/Logo";
import { useBrand } from "@/lib/brand";

function LoginPage() {
  const { user, loading, signIn } = useAuth();
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
      await signIn(email, password);
      toast.success("Welcome back");
      navigate("/portal");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const quickSignIn = async (e: string, p: string) => {
    setSubmitting(true);
    try {
      await signIn(e, p);
      toast.success("Signed in as demo user");
      navigate("/portal");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ══ Left panel — dark green, desktop only ══ */}
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-[48%] xl:w-[45%] flex-col justify-center px-12 xl:px-16 py-16
                   bg-[oklch(0.30_0.13_150)] text-white"
        style={{ background: "linear-gradient(155deg, oklch(0.28 0.13 150) 0%, oklch(0.35 0.14 140) 60%, oklch(0.30 0.10 120) 100%)" }}
      >
        <div className="inline-flex items-center gap-2.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest w-fit">
          <Logo size={22} />
          <BrandWordmark /> Portal
        </div>

        <h1 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.08] mt-8 text-white">
          Welcome back to<br />the movement of<br />compassion.
        </h1>
        <p className="mt-5 text-base text-white/80 max-w-xs">
          Sign in to access your dashboard — administrator, teacher, student, parent or alum.
        </p>

        {/* Demo credentials panel */}
        <div className="mt-10 rounded-2xl bg-white/10 border border-white/15 p-5 max-w-sm">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Demo — click to sign in</span>
          </div>
          <p className="text-[11px] text-white/65 mb-3">
            All passwords: <span className="font-mono font-semibold text-white/90">demo1234</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_CREDENTIALS.map((c) => (
              <button
                key={c.role}
                type="button"
                disabled={submitting}
                onClick={() => quickSignIn(c.email, c.password)}
                className="group rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.97]
                           border border-white/10 px-3 py-2.5 text-left transition
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-xs font-bold text-white leading-tight">{ROLE_LABEL[c.role]}</p>
                <p className="text-[10px] text-white/60 truncate mt-0.5">{c.email}</p>
                <p className="text-[10px] text-yellow-300 font-semibold mt-1.5 flex items-center gap-0.5">
                  Sign in <ChevronRight className="h-3 w-3"/>
                </p>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══ Right panel — light, full width on mobile ══ */}
      <div className="flex-1 flex flex-col justify-center bg-background px-4 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="w-full max-w-md mx-auto"
        >

          {/* Mobile demo panel — hidden on lg+ (covered by left col) */}
          <div className="lg:hidden mb-5 rounded-2xl p-4 text-white"
               style={{ background: "linear-gradient(135deg, oklch(0.28 0.13 150) 0%, oklch(0.32 0.12 140) 100%)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Logo size={26} />
              <span className="font-display font-bold text-sm"><BrandWordmark /></span>
            </div>
            <div className="flex items-center gap-1.5 mt-3 mb-1">
              <Sparkles className="h-3 w-3 text-yellow-300 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">Demo — tap any role to sign in instantly</span>
            </div>
            <p className="text-[10px] text-white/65 mb-3">
              All passwords: <span className="font-mono font-semibold text-white/90">demo1234</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_CREDENTIALS.map((c) => (
                <button
                  key={c.role}
                  type="button"
                  disabled={submitting}
                  onClick={() => quickSignIn(c.email, c.password)}
                  className="rounded-xl bg-white/12 hover:bg-white/22 active:scale-[0.97]
                             border border-white/15 px-3 py-2.5 text-left transition
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="text-xs font-bold text-white leading-tight">{ROLE_LABEL[c.role]}</p>
                  <p className="text-[10px] text-white/60 truncate mt-0.5">{c.email}</p>
                  <p className="text-[10px] text-yellow-300 font-semibold mt-1.5 flex items-center gap-0.5">
                    Sign in <ChevronRight className="h-3 w-3"/>
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Sign-in card */}
          <div className="rounded-3xl bg-card shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] border border-border p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Logo size={48} />
              <div>
                <h2 className="font-display text-2xl font-semibold leading-tight">Sign in</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Access your {brand.name} portal</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@hope2academy.org"
                    className="pl-9 h-11"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 h-11"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-11 text-base font-semibold gap-2">
                {submitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><LogIn className="h-4 w-4" /> Sign In</>
                }
              </Button>
            </form>

            <p className="mt-5 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Admin-invite only.</strong> Accounts are created by Super Admins or Admins.{" "}
              If you don't have credentials yet,{" "}
              <Link to="/contact" className="text-primary font-semibold underline underline-offset-2">contact us</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;
