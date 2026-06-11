import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import logoAsset from "@/assets/hope2-logo.png.asset.json";
import classroomA from "@/assets/uploads/IMG-20260521-WA0012.jpg.asset.json";
import wellA from "@/assets/uploads/IMG-20260521-WA0031.jpg.asset.json";
import clinicA from "@/assets/uploads/IMG-20260521-WA0022.jpg.asset.json";
import outreachA from "@/assets/uploads/IMG-20260521-WA0003.jpg.asset.json";
import villageA from "@/assets/uploads/IMG-20260521-WA0018.jpg.asset.json";
import schoolA from "@/assets/uploads/IMG-20260521-WA0017.jpg.asset.json";
import gradA from "@/assets/uploads/IMG-20260521-WA0027.jpg.asset.json";
import medalA from "@/assets/uploads/IMG-20260521-WA0040.jpg.asset.json";
import kidsA from "@/assets/uploads/IMG-20260521-WA0039.jpg.asset.json";
import primaryA from "@/assets/uploads/IMG-20260521-WA0034.jpg.asset.json";
const featuredLogo = logoAsset.url;
void primaryA;
const well = wellA.url;
const clinic = clinicA.url;
const outreachImg = outreachA.url;
const village = villageA.url;
const school = schoolA.url;
// extra featured imagery
void [classroomA, gradA, medalA, kidsA];


const stories = [
  { img: well, tag: "Community", date: "March 28, 2026", read: "3 min", title: "Clean water flows again in Gbarnga: Well #142 is live", excerpt: "After six weeks of community-led drilling, the village of Gbarnga gathered to draw the first bucket from a borehole that will serve over 1,200 people.", author: "Samuel Toe", role: "Field Coordinator", initials: "ST" },
  { img: clinic, tag: "Health", date: "March 15, 2026", read: "5 min", title: "Mobile clinic reaches 3 remote villages in Lofa County", excerpt: "Our medical team treated 412 patients in just five days — many of whom had not seen a healthcare worker in over a year.", author: "Dr. Mariama Bah", role: "Health & Wellness Lead", initials: "DMB" },
  { img: outreachImg, tag: "Outreach", date: "February 22, 2026", read: "6 min", title: "Volunteers from 6 countries joined our spring mission week", excerpt: "From teachers in Toronto to nurses in Nairobi, this year's mission cohort brought hands, hearts, and skill to seven communities across Montserrado.", author: "Joseph Karpeh", role: "Outreach Manager", initials: "JK" },
  { img: village, tag: "Community", date: "February 03, 2026", read: "4 min", title: "Rebuild update: 12 homes completed in River Cess", excerpt: "Families displaced by last year's floods are moving back into solid, locally-built homes — designed and constructed alongside the community.", author: "Esther Wonkeh", role: "Community Dev. Director", initials: "EW" },
  { img: school, tag: "Education", date: "January 18, 2026", read: "5 min", title: "Teacher training: 38 educators graduate from our literacy track", excerpt: "HOPE2 ACADEMY partnered with the Ministry of Education to deliver a six-week intensive on early literacy methods. Every graduate returns to their classroom this term.", author: "Grace Kollie", role: "Education Director", initials: "GK" },
];

function Stories() {
  return (
    <div>
      <PageHeader eyebrow="Field Updates & Stories" title="Voices from the ground" lead="Authentic reports from the communities, classrooms, and clinics where we serve." />
      <section className="container mx-auto px-6 py-20">
        <article className="grid lg:grid-cols-2 gap-0 items-center rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-warm)]">
          <div className="w-full h-full aspect-[4/3] lg:aspect-auto bg-primary/5 flex items-center justify-center p-12">
            <img src={featuredLogo} alt="HOPE2 ACADEMY institutional logo" className="max-h-72 w-auto object-contain drop-shadow-md" />
          </div>
          <div className="p-8 lg:p-12">
            <div className="flex flex-wrap gap-2 items-center text-xs uppercase tracking-wider">
              <span className="bg-accent text-accent-foreground px-2 py-1 rounded font-bold">Featured</span>
              <span className="text-secondary font-semibold">Education</span>
              <span className="text-muted-foreground">· April 12, 2026 · 4 min read</span>
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold">84 new students enrolled in our Bong County scholarship program</h2>
            <p className="mt-4 text-muted-foreground">This semester, we welcomed 84 new scholarship recipients across three rural schools in Bong County — the largest single intake since our program began.</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">GK</span>
              <div>
                <div className="font-semibold text-sm">Grace Kollie</div>
                <div className="text-xs text-muted-foreground">Education Director</div>
              </div>
            </div>
          </div>
        </article>
        <div className="mt-20">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-bold">Latest field updates</h2>
            <span className="text-sm text-muted-foreground">{stories.length} stories</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((s) => (
              <article key={s.title} className="rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-soft)]">
                <img src={s.img} alt={s.title} className="w-full aspect-[4/3] object-cover" />
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wider">
                    <span className="text-secondary font-bold">{s.tag}</span>
                    <span className="text-muted-foreground">· {s.date} · {s.read}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-snug">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.excerpt}</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{s.initials}</span>
                    <div>
                      <div className="font-semibold text-sm">{s.author}</div>
                      <div className="text-xs text-muted-foreground">{s.role}</div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-muted py-20">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <h2 className="text-4xl font-bold">Want stories in your inbox?</h2>
          <p className="mt-3 text-muted-foreground">We send one field update each month — no spam, just real news from Liberia.</p>
          <form className="mt-8 flex flex-col sm:flex-row gap-3">
            <input type="email" placeholder="you@email.com" className="flex-1 rounded-full px-6 py-4 bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
            <button type="submit" className="rounded-full bg-primary text-primary-foreground px-7 py-4 font-semibold">Subscribe</button>
          </form>
          <Link to="/get-involved" className="mt-6 inline-block text-primary font-semibold">Or get involved directly →</Link>
        </div>
      </section>
    </div>
  );
}

export default Stories;
