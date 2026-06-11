
import { PageHeader } from "@/components/PageHeader";
import schoolA from "@/assets/uploads/IMG-20260521-WA0034.jpg.asset.json";
import villageA from "@/assets/uploads/IMG-20260521-WA0031.jpg.asset.json";
import waterA from "@/assets/uploads/IMG-20260521-WA0018.jpg.asset.json";
import healthA from "@/assets/uploads/IMG-20260521-WA0022.jpg.asset.json";
import eduA from "@/assets/uploads/IMG-20260521-WA0027.jpg.asset.json";
import outreachA from "@/assets/uploads/IMG-20260521-WA0039.jpg.asset.json";
import beforeA from "@/assets/uploads/IMG-20260521-WA0039.jpg.asset.json";
import afterA from "@/assets/uploads/IMG-20260521-WA0034.jpg.asset.json";
const school = schoolA.url;
const village = villageA.url;
const water = waterA.url;
const healthImg = healthA.url;
const eduImg = eduA.url;
const outreachImg = outreachA.url;


const projects = [
  { img: school, loc: "Bomi County", title: "Tubmanburg Primary School Rebuild", stat: "420 children enrolled" },
  { img: water, loc: "Gbarpolu County", title: "Gbarpolu Clean Water Initiative", stat: "12 wells · 8,500 served" },
  { img: healthImg, loc: "Lofa County", title: "Mobile Maternal Health Clinic", stat: "1,200 mothers cared for" },
  { img: village, loc: "Sinoe County", title: "Sinoe Village Restoration", stat: "84 homes restored" },
  { img: eduImg, loc: "Nationwide", title: "Scholarship Fund 2024", stat: "230 scholarships awarded" },
  { img: outreachImg, loc: "Margibi County", title: "Community Tree Planting", stat: "5,000 trees planted" },
];

function Projects() {
  return (
    <div>
      <PageHeader eyebrow="Real Impact" title="Projects you can see, count, and trust" lead="Every photo is a real community. Every number is verified. This is what your support builds." />
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <span className="text-secondary font-semibold uppercase tracking-wider text-sm">Featured Project</span>
          <h2 className="mt-3 text-4xl font-bold">Tubmanburg Primary — before & after</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">A collapsed schoolhouse is now home to 420 children, 14 teachers, and a future no one thought possible.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-soft)]">
            <img src={beforeA.url} alt="Before" className="w-full aspect-[4/3] object-cover" />
            <span className="absolute top-4 left-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase">Before</span>
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-soft)]">
            <img src={afterA.url} alt="After" className="w-full aspect-[4/3] object-cover" />
            <span className="absolute top-4 left-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold uppercase">After</span>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <span className="text-secondary font-semibold uppercase tracking-wider text-sm">Project Gallery</span>
          <h2 className="mt-3 text-4xl font-bold">Where hope is taking root</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <article key={p.title} className="group rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-soft)]">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={p.img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-6">
                <div className="text-xs uppercase tracking-wider text-secondary font-semibold">{p.loc}</div>
                <h3 className="mt-2 text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.stat}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Projects;
