export function PageHeader({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <section className="bg-muted">
      <div className="container mx-auto px-6 pt-24 pb-16 text-center max-w-3xl">
        <span className="text-secondary font-semibold uppercase tracking-wider text-sm">{eyebrow}</span>
        <h1 className="mt-3 text-5xl md:text-6xl font-bold leading-tight">{title}</h1>
        {lead && <p className="mt-5 text-lg text-muted-foreground">{lead}</p>}
      </div>
    </section>
  );
}