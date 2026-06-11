import { PageHeader } from "@/components/PageHeader";
import { Linkedin, Mail } from "lucide-react";
import { useTeamContent } from "@/lib/team-store";

function Team() {
  const content = useTeamContent();
  const members = content.members.filter(m => m.enabled);
  return (
    <div>
      <PageHeader eyebrow={content.eyebrow} title={content.title} lead={content.lead} />
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center">{content.sectionHeading}</h2>
        <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">{content.sectionLead}</p>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((m) => (
            <div key={m.name} className="group rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-soft)]">
              <div className="aspect-[4/5] overflow-hidden">
                <img src={m.img} alt={`Portrait of ${m.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold">{m.name}</h3>
                <p className="text-sm text-secondary font-medium">{m.role}</p>
                {m.bio && <p className="mt-3 text-sm text-muted-foreground">{m.bio}</p>}
                <div className="mt-4 flex gap-3">
                  <a href={m.linkedin || "#"} aria-label={`${m.name} LinkedIn`} className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition"><Linkedin className="h-4 w-4" /></a>
                  <a href={m.email ? `mailto:${m.email}` : "#"} aria-label={`Email ${m.name}`} className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition"><Mail className="h-4 w-4" /></a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <blockquote className="mt-20 max-w-3xl mx-auto text-center text-2xl md:text-3xl italic text-foreground/80" style={{ fontFamily: "var(--font-display)" }}>
          "{content.quote}"
          <footer className="mt-4 text-sm not-italic text-muted-foreground">{content.quoteAuthor}</footer>
        </blockquote>
      </section>
    </div>
  );
}

export default Team;
