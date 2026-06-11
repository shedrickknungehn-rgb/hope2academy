import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api-client";
import { mockDb, type AppRole } from "@/lib/mock-backend-mobile";
import { useColors } from "@/hooks/useColors";

type Colors = ReturnType<typeof useColors>;

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: Colors }) {
  return (
    <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[s.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ left, right, sub, colors }: { left: string; right?: string; sub?: string; colors: Colors }) {
  return (
    <View style={[s.row, { borderTopColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowMain, { color: colors.foreground }]}>{left}</Text>
        {sub ? <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{sub}</Text> : null}
      </View>
      {right ? <Text style={[s.rowRight, { color: colors.mutedForeground }]}>{right}</Text> : null}
    </View>
  );
}

function StatusBadge({ status, colors }: { status: string; colors: Colors }) {
  const bg =
    status === "Paid" || status === "Active" || status === "Accepted" || status === "Completed" || status === "Approved" ? "#2B6B3B" :
    status === "Outstanding" || status === "Pending" || status === "Waitlist" ? "#D4A040" :
    status === "Grading" || status === "Submitted" ? "#1A5276" : "#888";
  return (
    <View style={{ backgroundColor: bg + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ color: bg, fontSize: 11, fontFamily: "Inter_600SemiBold" }}>{status}</Text>
    </View>
  );
}

function StudentModules({ colors, profile }: { colors: Colors; profile: any }) {
  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => apiClient.getCollection<any>("grades"),
  });
  const { data: exams = [] } = useQuery({
    queryKey: ["exams"],
    queryFn: () => apiClient.getCollection<any>("exams"),
  });
  const lib = mockDb.list<any>("library");

  const myGrades = grades.filter((g: any) => g.student === profile?.name);

  return (
    <>
      <Section title="My Grades" colors={colors}>
        {myGrades.length === 0
          ? <Text style={[s.rowSub, { color: colors.mutedForeground, paddingTop: 8 }]}>No grades recorded yet.</Text>
          : myGrades.map(g => (
            <View key={g.id} style={[s.row, { borderTopColor: colors.border }]}>
              <Text style={[s.rowMain, { color: colors.foreground, flex: 1 }]}>{g.subject}</Text>
              <Text style={[s.rowMain, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{g.grade}</Text>
              <Text style={[s.rowRight, { color: colors.mutedForeground, marginLeft: 8 }]}>{g.score}%</Text>
            </View>
          ))
        }
      </Section>
      <Section title="Upcoming Exams" colors={colors}>
        {exams.filter((e: any) => e.status === "Scheduled").map(e => (
          <View key={e.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{e.subject} — {e.class}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{e.date} · {e.room}</Text>
            </View>
            <StatusBadge status={e.status} colors={colors} />
          </View>
        ))}
      </Section>
      <Section title="Library" colors={colors}>
        {lib.map((b: any) => (
          <View key={b.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{b.title}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{b.author}</Text>
            </View>
            <Text style={[s.rowRight, { color: colors.primary }]}>{b.available} avail.</Text>
          </View>
        ))}
      </Section>
    </>
  );
}

const todayISO = () => new Date().toISOString().split("T")[0];

function AttendanceModal({ colors, visible, onClose }: { colors: Colors; visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ date: todayISO(), class: "", present: "", absent: "", late: "" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.createItem("attendance", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      setForm({ date: todayISO(), class: "", present: "", absent: "", late: "" });
      setError("");
      onClose();
    },
    onError: (e: any) => setError(e?.message ?? "Could not save"),
  });

  const submit = () => {
    if (!form.class.trim()) { setError("Class name is required"); return; }
    if (form.present === "" || form.absent === "") { setError("Present and absent counts are required"); return; }
    setError("");
    mutation.mutate({
      date: form.date,
      class: form.class.trim(),
      present: Number(form.present),
      absent: Number(form.absent),
      late: form.late ? Number(form.late) : 0,
    });
  };

  const inp = (label: string, key: keyof typeof form, opts?: { numeric?: boolean }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginBottom: 4 }}>
        {label}
      </Text>
      <TextInput
        value={form[key]}
        onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
        keyboardType={opts?.numeric ? "number-pad" : "default"}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: Platform.OS === "ios" ? 12 : 8,
          fontSize: 15,
          color: colors.foreground,
          backgroundColor: colors.card,
          fontFamily: "Inter_400Regular",
        }}
        placeholderTextColor={colors.mutedForeground}
        placeholder={opts?.numeric ? "0" : ""}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={onClose} />
        <View style={{
          backgroundColor: colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          paddingBottom: 36,
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground }}>Log Attendance</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={22} color={colors.mutedForeground} /></Pressable>
          </View>
          {inp("Date", "date")}
          {inp("Class name", "class")}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>{inp("Present", "present", { numeric: true })}</View>
            <View style={{ flex: 1 }}>{inp("Absent", "absent", { numeric: true })}</View>
            <View style={{ flex: 1 }}>{inp("Late", "late", { numeric: true })}</View>
          </View>
          {error ? <Text style={{ color: "#C43427", fontSize: 13, marginBottom: 8 }}>{error}</Text> : null}
          <Pressable
            onPress={submit}
            disabled={mutation.isPending}
            style={({ pressed }) => ({
              backgroundColor: mutation.isPending ? colors.muted : colors.primary,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {mutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" }}>Save Record</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TeacherAttendanceSection({ colors }: { colors: Colors }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: () => apiClient.getCollection<any>("attendance"),
  });

  const today = todayISO();
  const todayRecords = attendance.filter((a: any) => a.date === today);
  const recent = attendance.slice().sort((a: any, b: any) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <>
      <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Attendance</Text>
          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" }}>Log Today</Text>
          </Pressable>
        </View>
        {todayRecords.length > 0 && (
          <View style={{ backgroundColor: colors.primary + "12", borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.primary }}>
              Today — {todayRecords.length} class{todayRecords.length > 1 ? "es" : ""} logged
            </Text>
            {todayRecords.map((r: any) => (
              <Text key={r.id} style={{ fontSize: 12, color: colors.foreground, marginTop: 2 }}>
                {r.class}: {r.present} present · {r.absent} absent{r.late ? ` · ${r.late} late` : ""}
              </Text>
            ))}
          </View>
        )}
        {isLoading
          ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
          : recent.length === 0
            ? <Text style={[s.rowSub, { color: colors.mutedForeground, paddingTop: 8 }]}>No records yet. Log your first class.</Text>
            : recent.map((a: any) => (
                <View key={a.id} style={[s.row, { borderTopColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.rowMain, { color: colors.foreground }]}>{a.class}</Text>
                    <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{a.date}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.primary }}>
                      {a.present} / {Number(a.present) + Number(a.absent || 0) + Number(a.late || 0)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground }}>present</Text>
                  </View>
                </View>
              ))
        }
      </View>
      <AttendanceModal colors={colors} visible={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

function TeacherModules({ colors }: { colors: Colors }) {
  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => apiClient.getCollection<any>("assignments"),
  });
  const { data: lessonPlans = [] } = useQuery({
    queryKey: ["lessonplans"],
    queryFn: () => apiClient.getCollection<any>("lessonplans"),
  });
  const { data: behavior = [] } = useQuery({
    queryKey: ["behavior"],
    queryFn: () => apiClient.getCollection<any>("behavior"),
  });
  return (
    <>
      <TeacherAttendanceSection colors={colors} />
      <Section title="Assignments" colors={colors}>
        {assignments.map((a: any) => (
          <View key={a.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{a.title}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{a.class} · Due {a.due}</Text>
            </View>
            <StatusBadge status={a.status} colors={colors} />
          </View>
        ))}
      </Section>
      <Section title="Lesson Plans" colors={colors}>
        {lessonPlans.map((lp: any) => (
          <View key={lp.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{lp.title}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{lp.week}</Text>
            </View>
            <StatusBadge status={lp.status} colors={colors} />
          </View>
        ))}
      </Section>
      <Section title="Behavior Log" colors={colors}>
        {behavior.map((b: any) => (
          <View key={b.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{b.student}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{b.description}</Text>
            </View>
            <StatusBadge status={b.type} colors={colors} />
          </View>
        ))}
      </Section>
    </>
  );
}

function ParentModules({ colors }: { colors: Colors }) {
  const { data: fees = [] } = useQuery({
    queryKey: ["fees"],
    queryFn: () => apiClient.getCollection<any>("fees"),
  });
  const calendar = mockDb.list<any>("calendar");
  const messages = mockDb.list<any>("messages");
  return (
    <>
      <Section title="Fee Statements" colors={colors}>
        {fees.map((f: any) => (
          <View key={f.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{f.student} — {f.item}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>Due {f.due}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>${f.amount}</Text>
              <StatusBadge status={f.status} colors={colors} />
            </View>
          </View>
        ))}
      </Section>
      <Section title="School Calendar" colors={colors}>
        {calendar.map((c: any) => (
          <View key={c.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{c.title}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{c.startDate} · {c.audience}</Text>
            </View>
            <View style={{ backgroundColor: colors.muted, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{c.type}</Text>
            </View>
          </View>
        ))}
      </Section>
      <Section title="Messages" colors={colors}>
        {messages.map((m: any) => (
          <View key={m.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{m.subject}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>From {m.from} · {m.date}</Text>
            </View>
            {m.unread && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
            )}
          </View>
        ))}
      </Section>
    </>
  );
}

function AlumniModules({ colors }: { colors: Colors }) {
  const { data: donations = [] } = useQuery({
    queryKey: ["donations"],
    queryFn: () => apiClient.getCollection<any>("donations"),
  });
  const { data: scholarships = [] } = useQuery({
    queryKey: ["scholarships"],
    queryFn: () => apiClient.getCollection<any>("scholarships"),
  });
  const directory = mockDb.list<any>("directory");
  return (
    <>
      <Section title="Alumni Directory" colors={colors}>
        {directory.map((d: any) => (
          <Row key={d.id} left={d.name} sub={`Class of ${d.year} · ${d.role}`} right={d.city} colors={colors} />
        ))}
      </Section>
      <Section title="Scholarship Fund" colors={colors}>
        {scholarships.map((sc: any) => (
          <View key={sc.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{sc.student}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>Sponsor: {sc.sponsor} · {sc.term}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>${sc.amountUsd}</Text>
              <StatusBadge status={sc.status} colors={colors} />
            </View>
          </View>
        ))}
      </Section>
      <Section title="Recent Donations" colors={colors}>
        {donations.map((d: any) => (
          <Row key={d.id} left={d.donor} sub={`${d.fund} Fund · ${d.date}`} right={`$${d.amount}`} colors={colors} />
        ))}
      </Section>
    </>
  );
}

function AdminModules({ colors }: { colors: Colors }) {
  const { data: admissions = [] } = useQuery({
    queryKey: ["admissions"],
    queryFn: () => apiClient.getCollection<any>("admissions"),
  });
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => apiClient.getCollection<any>("classes"),
  });
  const staff = mockDb.list<any>("staff");
  return (
    <>
      <Section title="Admissions" colors={colors}>
        {admissions.map((a: any) => (
          <View key={a.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{a.applicant}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{a.grade} · Guardian: {a.guardian}</Text>
            </View>
            <StatusBadge status={a.status} colors={colors} />
          </View>
        ))}
      </Section>
      <Section title="Staff Directory" colors={colors}>
        {staff.map((st: any) => (
          <View key={st.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{st.name}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{st.role} · {st.department}</Text>
            </View>
            <StatusBadge status={st.status} colors={colors} />
          </View>
        ))}
      </Section>
      <Section title="Classes" colors={colors}>
        {classes.slice(0, 8).map((c: any) => (
          <Row key={c.id} left={c.name} sub={`${c.teacher} · ${c.room}`} right={`${c.students} students`} colors={colors} />
        ))}
      </Section>
    </>
  );
}

function SuperadminModules({ colors }: { colors: Colors }) {
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiClient.getCollection<any>("departments"),
  });
  const audit = mockDb.list<any>("audit");
  const transport = mockDb.list<any>("transport");
  return (
    <>
      <Section title="Departments" colors={colors}>
        {departments.map((d: any) => (
          <Row key={d.id} left={d.name} sub={`Lead: ${d.lead}`} right={`${d.staff} staff`} colors={colors} />
        ))}
      </Section>
      <Section title="Transport Routes" colors={colors}>
        {transport.map((t: any) => (
          <View key={t.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{t.route}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{t.driver} · Departs {t.departure}</Text>
            </View>
            <Text style={[s.rowRight, { color: colors.foreground }]}>{t.riders} riders</Text>
          </View>
        ))}
      </Section>
      <Section title="Audit Log" colors={colors}>
        {audit.map((a: any) => (
          <View key={a.id} style={[s.row, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowMain, { color: colors.foreground }]}>{a.action}</Text>
              <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{a.actor} · {a.at}</Text>
            </View>
          </View>
        ))}
      </Section>
    </>
  );
}

export default function ModulesScreen() {
  const { user, profile, primaryRole, loading } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading]);

  if (!profile) return null;

  const role = primaryRole as AppRole;
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  const titleMap: Record<AppRole, string> = {
    student: "My Academics",
    teacher: "Classroom",
    parent: "Family Portal",
    alumni: "Alumni Network",
    admin: "Administration",
    superadmin: "System Overview",
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + webTopPad + 16,
        paddingBottom: insets.bottom + webBotPad + 90,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="grid" size={22} color={colors.primary} />
          <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>
            {titleMap[role] ?? "Modules"}
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>
          {role === "student" && "Your grades, exams, and library"}
          {role === "teacher" && "Assignments, lesson plans, behavior"}
          {role === "parent" && "Fees, calendar, messages"}
          {role === "alumni" && "Directory, scholarships, donations"}
          {(role === "admin" || role === "superadmin") && "School data and management tools"}
        </Text>
      </View>

      {role === "student" && <StudentModules colors={colors} profile={profile} />}
      {role === "teacher" && <TeacherModules colors={colors} />}
      {role === "parent" && <ParentModules colors={colors} />}
      {role === "alumni" && <AlumniModules colors={colors} />}
      {role === "admin" && <AdminModules colors={colors} />}
      {role === "superadmin" && <SuperadminModules colors={colors} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  rowMain: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  rowRight: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
