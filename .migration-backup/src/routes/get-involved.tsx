
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Heart, HandHelping, Building2 } from "lucide-react";


function GetInvolved() {
  const [amount, setAmount] = useState(50);
  const [freq, setFreq] = useState<"once" | "monthly">("once");
  return (
    <div>
      <PageHeader eyebrow="Join the Mission" title="Be the hope someone is praying for" lead="There are three ways to walk with us. Choose yours." />
      <section className="container mx-auto px-6 py-20 grid lg:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-card border border-border p-8 shadow-[var(--shadow-soft)]">
          <span className="inline-flex h-14 w-14 rounded-2xl bg-secondary text-secondary-foreground items-center justify-center"><Heart className="h-6 w-6 fill-current" /></span>
          <h3 className="mt-4 text-2xl font-bold">Donate</h3>
          <p className="mt-2 text-sm text-muted-foreground">100% of your gift funds Liberian community projects.</p>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {[25, 50, 100, 250].map((a) => (
              <button key={a} onClick={() => setAmount(a)} className={`py-2 rounded-full text-sm font-semibold border ${amount === a ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>${a}</button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["once", "monthly"] as const).map((f) => (
              <button key={f} onClick={() => setFreq(f)} className={`py-2 rounded-full text-sm font-semibold border ${freq === f ? "bg-accent text-accent-foreground border-accent" : "border-border"}`}>
                {f === "once" ? "One-time" : "Monthly"}
              </button>
            ))}
          </div>
          <button className="mt-5 w-full rounded-full bg-secondary text-secondary-foreground py-3.5 font-semibold">Give ${amount}{freq === "monthly" ? "/mo" : ""}</button>
        </div>
        <div className="rounded-3xl bg-card border border-border p-8 shadow-[var(--shadow-soft)]">
          <span className="inline-flex h-14 w-14 rounded-2xl bg-primary text-primary-foreground items-center justify-center"><HandHelping className="h-6 w-6" /></span>
          <h3 className="mt-4 text-2xl font-bold">Volunteer</h3>
          <p className="mt-2 text-sm text-muted-foreground">Join a mission trip or help remotely.</p>
          <a href="#apply" className="mt-6 block w-full text-center rounded-full bg-primary text-primary-foreground py-3.5 font-semibold">Apply to Volunteer</a>
        </div>
        <div className="rounded-3xl bg-card border border-border p-8 shadow-[var(--shadow-soft)]">
          <span className="inline-flex h-14 w-14 rounded-2xl bg-accent text-accent-foreground items-center justify-center"><Building2 className="h-6 w-6" /></span>
          <h3 className="mt-4 text-2xl font-bold">Partner</h3>
          <p className="mt-2 text-sm text-muted-foreground">Corporate, faith & NGO partnerships welcome.</p>
          <a href="/contact" className="mt-6 block w-full text-center rounded-full bg-accent text-accent-foreground py-3.5 font-semibold">Become a Partner</a>
        </div>
      </section>
      <section id="apply" className="bg-muted py-20">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="text-center">
            <span className="text-secondary font-semibold uppercase tracking-wider text-sm">Volunteer Application</span>
            <h2 className="mt-3 text-4xl font-bold">Tell us about you</h2>
          </div>
          <form className="mt-10 rounded-3xl bg-card border border-border p-8 shadow-[var(--shadow-soft)] space-y-4">
            <Field label="Full Name" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email" type="email" />
              <Field label="Country" />
            </div>
            <Field label="Phone" />
            <div>
              <label className="block text-sm font-medium mb-1.5">Area of Interest</label>
              <select className="w-full rounded-full border border-border bg-background px-5 py-3">
                <option>Education</option>
                <option>Health & Wellness</option>
                <option>Community Development</option>
                <option>Outreach & Missions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Why do you want to serve?</label>
              <textarea rows={4} className="w-full rounded-2xl border border-border bg-background px-4 py-3" />
            </div>
            <button className="w-full rounded-full bg-secondary text-secondary-foreground py-4 font-semibold">Submit Application</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} className="w-full rounded-full border border-border bg-background px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
    </div>
  );
}

export default GetInvolved;
