
import { PageHeader } from "@/components/PageHeader";
import { MapPin, Mail, Phone, Clock, Facebook, Instagram, Twitter, Youtube, MessageCircle } from "lucide-react";
import { useBrand } from "@/lib/brand";


function Contact() {
  const brand = useBrand();
  const wa = brand.phone.replace(/[^0-9]/g, "");
  return (
    <div>
      <PageHeader eyebrow="Get in Touch" title="Let's talk about hope" lead="Whether you have a question, a partnership idea, or just want to say hello — we're listening." />
      <section className="container mx-auto px-6 py-20 grid lg:grid-cols-2 gap-14">
        <div className="space-y-8">
          <Info icon={MapPin} title="Visit Us" lines={["HOPE2 ACADEMY HQ", brand.address, `${brand.city}, ${brand.country}`]} />
          <Info icon={Mail} title="Email" lines={[brand.email, "partnerships@hope2academy.org"]} />
          <Info icon={Phone} title="Phone" lines={[brand.phone, brand.officeHours]} />
          <Info icon={MessageCircle} title="WhatsApp" lines={[brand.phone]}>
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">Chat on WhatsApp →</a>
          </Info>
          <Info icon={Clock} title="Office Hours" lines={["Monday – Friday", "7:00 AM – 4:00 PM"]} />
          <div>
            <h3 className="font-bold text-lg">Follow Our Journey</h3>
            <div className="mt-4 flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Ic, i) => (
                <a key={i} href="#" aria-label="social" className="p-3 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition"><Ic className="h-4 w-4" /></a>
              ))}
            </div>
          </div>
        </div>
        <form className="rounded-3xl bg-card border border-border p-8 shadow-[var(--shadow-soft)]">
          <h2 className="text-2xl font-bold">Send us a message</h2>
          <div className="mt-6 space-y-4">
            <Field label="Name" />
            <Field label="Email" type="email" />
            <Field label="Subject" />
            <div>
              <label className="block text-sm font-medium mb-1.5">Message</label>
              <textarea rows={5} className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button type="submit" className="w-full rounded-full bg-secondary text-secondary-foreground py-4 font-semibold hover:brightness-110">Send Message</button>
          </div>
        </form>
      </section>
      <section className="container mx-auto px-6 pb-24">
        <div className="rounded-3xl border border-border bg-primary text-primary-foreground p-10 flex items-center gap-6">
          <MapPin className="h-10 w-10 text-accent" />
          <div>
            <h3 className="text-xl font-bold">Lower Margibi County, Liberia</h3>
            <p className="opacity-80">Barber's Joe Town · Marshall Road</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Info({ icon: Icon, title, lines, children }: { icon: any; title: string; lines: string[]; children?: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></span>
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        {lines.map((l) => <p key={l} className="text-muted-foreground">{l}</p>)}
        {children}
      </div>
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

export default Contact;
