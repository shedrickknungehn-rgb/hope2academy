
import { useEffect, useState } from "react";
import { Users, GraduationCap, UserPlus, Activity, Loader2, Trash2, Plus } from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { apiClient, isNetworkError, type ApiUser } from "@/lib/api-client";
import { mockAuth } from "@/lib/mock-backend";
import { useAuth, type AppRole, ROLE_LABEL } from "@/hooks/use-auth";
import { Reveal, StaggerGroup, motion } from "@/components/Motion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type UserRow = ApiUser & { id: string };

function AdminPage() {
  const { roles } = useAuth();
  const isSuper = roles.includes("superadmin");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState<{ email: string; name: string; role: AppRole }>({ email: "", name: "", role: "student" });

  const load = async () => {
    setLoading(true);
    try {
      const list = await apiClient.listUsers();
      setRows(list as UserRow[]);
    } catch (e) {
      if (!isNetworkError(e)) {
        toast.error((e as Error)?.message ?? "Could not load users");
      } else {
        try {
          const list = await mockAuth.listUsers();
          setRows(list as unknown as UserRow[]);
        } catch (e2: any) {
          toast.error(e2?.message ?? "Could not load users");
        }
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const changeRole = async (uid: string, role: AppRole) => {
    try {
      await apiClient.changeRole(uid, role);
      toast.success(`Role updated to ${ROLE_LABEL[role]}`);
      load();
    } catch (e) {
      if (!isNetworkError(e)) {
        toast.error((e as Error)?.message ?? "Could not change role");
        return;
      }
      try {
        await mockAuth.changeRole(uid, role);
        toast.success(`Role updated to ${ROLE_LABEL[role]}`);
        load();
      } catch (e2: any) {
        toast.error(e2?.message ?? "Could not change role");
      }
    }
  };

  const removeUser = async (uid: string) => {
    try {
      await apiClient.deleteUser(uid);
    } catch (e) {
      if (!isNetworkError(e)) {
        toast.error((e as Error)?.message ?? "Could not delete user");
        return;
      }
      await mockAuth.deleteUser(uid);
    }
    toast.success("User removed");
    load();
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.name) { toast.error("Name and email required"); return; }
    try {
      await apiClient.createUser(newUser);
      toast.success(`Invited ${newUser.name} as ${ROLE_LABEL[newUser.role]}`);
    } catch (e) {
      if (!isNetworkError(e)) {
        toast.error((e as Error)?.message ?? "Could not create user");
        return;
      }
      try {
        await mockAuth.createUser(newUser);
        toast.success(`Invited ${newUser.name} as ${ROLE_LABEL[newUser.role]}`);
      } catch (e2: any) {
        toast.error(e2?.message ?? "Could not create user");
        return;
      }
    }
    setOpen(false);
    setNewUser({ email: "", name: "", role: "student" });
    load();
  };

  return (
    <PortalShell title="Admin Console" subtitle="Manage users, assign roles, oversee operations">
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={rows.length} />
        <StatCard icon={GraduationCap} label="Students" value={rows.filter(r=>r.role==="student").length} accent="secondary" />
        <StatCard icon={Activity} label="Teachers" value={rows.filter(r=>r.role==="teacher").length} accent="accent" />
        <StatCard icon={UserPlus} label="Alumni" value={rows.filter(r=>r.role==="alumni").length} />
      </StaggerGroup>

      <Reveal className="mt-8 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-semibold">All Users</h2>
            <p className="text-sm text-muted-foreground">Invite, assign roles, and manage your school directory.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4"/> Invite user</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite a new user</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Full name</Label><Input value={newUser.name} onChange={e=>setNewUser({...newUser, name:e.target.value})} placeholder="Jane Doe"/></div>
                <div><Label>Email</Label><Input type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})} placeholder="jane@hope2.demo"/></div>
                <div>
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={(v)=>setNewUser({...newUser, role: v as AppRole})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {(["alumni","student","parent","teacher","admin",...(isSuper?["superadmin" as AppRole]:[])] as AppRole[]).map(rr=> (
                        <SelectItem key={rr} value={rr}>{ROLE_LABEL[rr]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">Default password: <span className="font-mono">demo1234</span></p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={createUser}>Send invite</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {loading ? (
          <div className="p-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground grid place-items-center font-semibold">
                    {(r.name ?? r.email ?? "U").slice(0,1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={r.role ?? undefined} onValueChange={(v)=>changeRole(r.id, v as AppRole)}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="No role"/></SelectTrigger>
                    <SelectContent>
                      {(["alumni","student","parent","teacher","admin",...(isSuper?["superadmin" as AppRole]:[])] as AppRole[]).map(rr=> (
                        <SelectItem key={rr} value={rr}>{ROLE_LABEL[rr]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={()=>removeUser(r.id)} aria-label="Delete user"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </div>
              </motion.div>
            ))}
            {rows.length === 0 && <p className="p-8 text-center text-muted-foreground">No users yet.</p>}
          </div>
        )}
      </Reveal>
    </PortalShell>
  );
}

function RouteComponent() {
  return (
    <RequireAuth allow={["admin","superadmin"]}>
      <AdminPage />
    </RequireAuth>
  );
}

export default RouteComponent;
