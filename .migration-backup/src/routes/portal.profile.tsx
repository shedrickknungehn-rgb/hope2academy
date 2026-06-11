
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { PortalShell } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal } from "@/components/Motion";
import { useAuth } from "@/hooks/use-auth";
import { mockAuth } from "@/lib/mock-backend";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function ProfilePage() {
  const { profile, user, refresh } = useAuth();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await mockAuth.updateProfile(user.$id, {
        name: form.full_name,
        phone: form.phone,
        address: form.address,
        bio: form.bio,
        date_of_birth: form.date_of_birth || null,
        emergency_contact: form.emergency_contact,
      });
      toast.success("Profile saved");
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalShell title="My Profile" subtitle="Keep your school information up to date">
      <Reveal className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)] max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name"><Input value={form.full_name ?? ""} onChange={(e)=>setForm({...form, full_name:e.target.value})}/></Field>
          <Field label="Email"><Input value={profile?.email ?? ""} disabled/></Field>
          <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e)=>setForm({...form, phone:e.target.value})}/></Field>
          <Field label="Date of birth"><Input type="date" value={form.date_of_birth ?? ""} onChange={(e)=>setForm({...form, date_of_birth:e.target.value})}/></Field>
          <Field label="Address" full><Input value={form.address ?? ""} onChange={(e)=>setForm({...form, address:e.target.value})}/></Field>
          <Field label="Emergency contact" full><Input value={form.emergency_contact ?? ""} onChange={(e)=>setForm({...form, emergency_contact:e.target.value})}/></Field>
          <Field label="Bio" full><Textarea rows={4} value={form.bio ?? ""} onChange={(e)=>setForm({...form, bio:e.target.value})}/></Field>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
            Save changes
          </Button>
        </div>
      </Reveal>
    </PortalShell>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function RouteComponent() {
  return (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  );
}

export default RouteComponent;
