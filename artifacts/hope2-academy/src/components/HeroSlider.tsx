import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useHeroSlides } from "@/lib/hero-store";
import { mediaUrl } from "@/lib/api-client";

const INTERVAL = 6000;

export default function HeroSlider() {
  const all = useHeroSlides();
  const SLIDES = all.filter((s) => s.enabled);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || SLIDES.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused, SLIDES.length]);

  useEffect(() => { if (i >= SLIDES.length) setI(0); }, [SLIDES.length, i]);

  if (SLIDES.length === 0) return null;

  const go = (n: number) => setI((n + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[i];

  return (
    <section
      className="relative min-h-[88vh] flex items-center overflow-hidden bg-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="HOPE2 ACADEMY hero stories"
    >
      {/* Image layer (crossfade + Ken Burns) */}
      <AnimatePresence mode="sync">
        <motion.img
          key={i}
          src={mediaUrl(slide.img)}
          alt={slide.alt}
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1.0 }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ opacity: { duration: 1.1 }, scale: { duration: 7, ease: "linear" } }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-0 bg-foreground/40" />

      {/* Content */}
      <div className="relative container mx-auto px-6 py-24 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 backdrop-blur border border-accent/40 text-accent px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
              <Heart className="h-3 w-3 fill-accent" /> {slide.kicker}
            </span>
            <h1 className="mt-6 text-5xl md:text-7xl font-bold text-background leading-[1.0]">
              {slide.title} {slide.titleAccent && <><br className="hidden sm:block"/><span className="text-accent">{slide.titleAccent}</span></>}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-background/90 max-w-xl">{slide.body}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to={slide.primaryTo}
                className="group inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-7 py-4 font-semibold transition shadow-[var(--shadow-warm)] hover:scale-[1.03] hover:shadow-2xl active:scale-95"
              >
                <Heart className="h-4 w-4 fill-current transition-transform group-hover:scale-125" />
                {slide.primaryLabel}
              </Link>
              <Link
                to={slide.secondaryTo}
                className="group inline-flex items-center gap-2 rounded-full border-2 border-accent text-accent px-7 py-4 font-semibold hover:bg-accent hover:text-accent-foreground transition"
              >
                {slide.secondaryLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <button
        onClick={() => go(i - 1)}
        aria-label="Previous slide"
        className="hidden md:inline-flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-background/15 backdrop-blur border border-background/30 text-background hover:bg-background/30 transition"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={() => go(i + 1)}
        aria-label="Next slide"
        className="hidden md:inline-flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-background/15 backdrop-blur border border-background/30 text-background hover:bg-background/30 transition"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, n) => (
          <button
            key={n}
            onClick={() => go(n)}
            aria-label={`Go to slide ${n + 1}`}
            className={`h-2 rounded-full transition-all ${n === i ? "w-10 bg-accent" : "w-2 bg-background/50 hover:bg-background/80"}`}
          />
        ))}
      </div>
    </section>
  );
}