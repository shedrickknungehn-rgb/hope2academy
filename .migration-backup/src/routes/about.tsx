import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import portrait from "@/assets/hope/about-portrait-eKNmGVTA.jpg";
import { HeartHandshake, ShieldCheck, Sprout, Users } from "lucide-react";


const values = [
  { icon: HeartHandshake, title: "Compassion", desc: "We meet every person with empathy, dignity, and unconditional respect." },
  { icon: ShieldCheck, title: "Integrity", desc: "Full transparency in every dollar, every decision, every project." },
  { icon: Sprout, title: "Sustainability", desc: "We build solutions communities can own, maintain, and grow." },
  { icon: Users, title: "Service", desc: "We serve where the need is greatest, not where it's easiest." },
];

function About() {
  return (
    <div>
      <PageHeader eyebrow="Who We Are" title="A movement born from love for Liberia" lead="Founded by Liberians, for Liberians — HOPE2 ACADEMY exists to walk with communities as they rebuild stronger than before." />
      <section className="container mx-auto px-6 py-20 grid lg:grid-cols-2 gap-14 items-center">
        <div className="relative">
          <img src={portrait} alt="Portrait of a Liberian elder smiling" className="rounded-3xl shadow-[var(--shadow-warm)] aspect-[4/5] object-cover" />
          <div className="absolute -bottom-6 -left-6 bg-secondary text-secondary-foreground rounded-2xl p-6 shadow-[var(--shadow-soft)]">
            <div className="text-4xl font-bold">12+</div>
            <div className="text-sm">Years Serving</div>
          </div>
        </div>
        <div>
          <span className="text-secondary font-semibold uppercase tracking-wider text-sm">Our Story</span>
          <h2 className="mt-3 text-4xl font-bold">Born from a single promise.</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">After years of civil unrest and the Ebola crisis left Liberia's communities fractured, a small group of nurses, teachers, and faith leaders made a quiet promise to one another: <em>we will not leave</em>.</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">That promise became HOPE2 ACADEMY. What started as a single clinic in Monrovia has grown into a national network serving 84+ communities with education, health, water, and dignity.</p>
          <p className="mt-4 font-semibold text-primary">We are still keeping the promise.</p>
        </div>
      </section>
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-10">
          <div>
            <span className="text-accent font-semibold uppercase tracking-wider text-sm">Our Mission</span>
            <h3 className="mt-3 text-3xl font-bold">To restore hope and rebuild lives.</h3>
            <p className="mt-4 opacity-90">We exist to walk alongside Liberian communities, providing essential resources and unwavering partnership so that every person can live with dignity and opportunity.</p>
          </div>
          <div>
            <span className="text-accent font-semibold uppercase tracking-wider text-sm">Our Vision</span>
            <h3 className="mt-3 text-3xl font-bold">A Liberia where every child thrives.</h3>
            <p className="mt-4 opacity-90">We envision communities where clean water flows, schools welcome every child, clinics heal every family, and hope is no longer a luxury — but a daily reality.</p>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-secondary font-semibold uppercase tracking-wider text-sm">Our Core Values</span>
          <h2 className="mt-3 text-4xl font-bold">What we stand on, every day</h2>
          <p className="mt-4 text-muted-foreground">Four values shape every meeting, every dollar, every relationship.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div key={v.title} className="p-8 rounded-3xl bg-card border border-border shadow-[var(--shadow-soft)]">
              <v.icon className="h-8 w-8 text-secondary" />
              <h4 className="mt-4 text-xl font-bold">{v.title}</h4>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link to="/get-involved" className="inline-flex rounded-full bg-secondary text-secondary-foreground px-7 py-4 font-semibold">Walk with us</Link>
        </div>
      </section>
    </div>
  );
}

export default About;
