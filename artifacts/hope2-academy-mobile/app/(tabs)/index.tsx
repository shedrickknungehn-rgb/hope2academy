import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, ROLE_LABEL } from "@/context/AuthContext";
import { apiClient } from "@/lib/api-client";
import { useColors } from "@/hooks/useColors";

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: string }) {
  const colors = useColors();
  const s = StyleSheet.create({
    card: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: (accent ?? colors.primary) + "18",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    value: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
      color: accent ?? colors.primary,
    },
    label: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
  });
  return (
    <View style={s.card}>
      <View style={s.iconWrap}>{icon}</View>
      <Text style={s.value}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

function StudentDashboard() {
  const colors = useColors();
  const s = sectionStyles(colors);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
  });

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />;

  const grades: any[] = stats?.grades ?? [];

  return (
    <>
      <View style={s.statsGrid}>
        <StatCard icon={<Feather name="book-open" size={18} color={colors.primary} />} label="Active Courses" value={stats?.activeCourses ?? 6} />
        <StatCard icon={<Feather name="award" size={18} color={colors.accent} />} label="GPA" value={stats?.gpa ?? "—"} accent={colors.accent} />
        <StatCard icon={<Feather name="calendar" size={18} color={colors.secondary} />} label="Upcoming Tests" value={stats?.upcomingTests ?? 0} accent={colors.secondary} />
        <StatCard icon={<Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />} label="Attendance" value={stats?.attendance ?? "—"} accent={colors.success} />
      </View>
      <View style={s.bannerCard}>
        <Text style={s.bannerTitle}>Keep going.</Text>
        <Text style={s.bannerBody}>Your next assignment is due Friday. Tutor session Wednesday at 3pm.</Text>
      </View>
      {grades.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Grades</Text>
          {grades.slice(0, 5).map((g: any) => (
            <View key={g.id ?? g.subject} style={s.listRow}>
              <Text style={s.listMain}>{g.subject}</Text>
              <Text style={[s.listBadge, { color: colors.primary }]}>{g.grade}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function TeacherDashboard() {
  const colors = useColors();
  const { profile } = useAuth();
  const s = sectionStyles(colors);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
  });
  const { data: timetable = [] } = useQuery({
    queryKey: ["timetable"],
    queryFn: () => apiClient.getCollection<any>("timetable"),
  });

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const schedule = timetable.find((d: any) => d.day === today)?.slots
    ?? timetable[0]?.slots
    ?? [];

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />;

  return (
    <>
      <View style={s.statsGrid}>
        <StatCard icon={<Feather name="users" size={18} color={colors.primary} />} label="My Students" value={stats?.myStudents ?? 42} />
        <StatCard icon={<Feather name="book-open" size={18} color={colors.accent} />} label="Classes Today" value={stats?.classesToday ?? 5} accent={colors.accent} />
        <StatCard icon={<Feather name="clipboard" size={18} color={colors.secondary} />} label="Pending Grades" value={stats?.pendingGrades ?? 0} accent={colors.secondary} />
        <StatCard icon={<Feather name="calendar" size={18} color={colors.success} />} label="Lesson Plans" value={stats?.lessonPlans ?? 0} accent={colors.success} />
      </View>
      {schedule.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Today's Schedule</Text>
          {schedule.map((x: any) => (
            <View key={x.t} style={s.scheduleRow}>
              <Text style={s.scheduleTime}>{x.t}</Text>
              <Text style={s.scheduleClass}>{x.s}</Text>
            </View>
          ))}
        </View>
      )}
      {profile?.subjects && profile.subjects.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>My Subjects</Text>
          <View style={s.chipRow}>
            {profile.subjects.map((sub) => (
              <View key={sub} style={[s.chip, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[s.chipText, { color: colors.primary }]}>{sub}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

function ParentDashboard() {
  const colors = useColors();
  const s = sectionStyles(colors);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
  });

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />;

  const children: any[] = stats?.children ?? [];

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>My Children</Text>
      {children.map((child: any) => {
        const childGrades: any[] = child.grades ?? [];
        const avgScore = childGrades.length
          ? Math.round(childGrades.reduce((s: number, g: any) => s + (g.score ?? 0), 0) / childGrades.length)
          : 0;
        const gpaLabel = avgScore >= 90 ? "A" : avgScore >= 80 ? "B+" : avgScore >= 70 ? "B" : childGrades.length ? "C+" : "—";
        const childFees: any[] = child.fees ?? [];
        const outstanding = childFees.filter((f: any) => f.status === "Outstanding");
        return (
          <View key={child.name} style={s.childCard}>
            <View style={s.childAvatar}>
              <Text style={s.childAvatarText}>{child.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.childName}>{child.name}</Text>
              <Text style={s.childGrade}>{outstanding.length > 0 ? `${outstanding.length} fee(s) outstanding` : "Fees up to date"}</Text>
            </View>
            <View style={s.childStats}>
              <Text style={s.childStat}>{gpaLabel}</Text>
              <Text style={s.childStatLabel}>GPA</Text>
            </View>
            <View style={[s.childStats, { marginLeft: 12 }]}>
              <Text style={s.childStat}>{childGrades.length}</Text>
              <Text style={s.childStatLabel}>Grades</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function AlumniDashboard() {
  const colors = useColors();
  const s = sectionStyles(colors);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
  });
  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiClient.getCollection<any>("events"),
  });
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => apiClient.getCollection<any>("jobs"),
  });

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />;

  return (
    <>
      <View style={s.statsGrid}>
        <StatCard icon={<Feather name="briefcase" size={18} color={colors.primary} />} label="Job Listings" value={stats?.jobListings ?? jobs.length} />
        <StatCard icon={<Feather name="calendar" size={18} color={colors.accent} />} label="Events" value={stats?.upcomingEvents ?? events.length} accent={colors.accent} />
        <StatCard icon={<Feather name="award" size={18} color={colors.secondary} />} label="Scholarships" value={stats?.scholarships ?? 0} accent={colors.secondary} />
        <StatCard icon={<Feather name="heart" size={18} color={colors.success} />} label="My Donations" value={stats?.donations ?? 0} accent={colors.success} />
      </View>
      {events.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Upcoming Events</Text>
          {events.slice(0, 4).map((e: any) => (
            <View key={e.id} style={s.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.listMain}>{e.title}</Text>
                <Text style={s.listSub}>{e.location}</Text>
              </View>
              <Text style={[s.listBadge, { color: colors.accent, fontSize: 11 }]}>{e.date}</Text>
            </View>
          ))}
        </View>
      )}
      {jobs.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Job Board</Text>
          {jobs.slice(0, 4).map((j: any) => (
            <View key={j.id} style={s.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.listMain}>{j.title}</Text>
                <Text style={s.listSub}>{j.company} · {j.location}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function AdminDashboard() {
  const colors = useColors();
  const s = sectionStyles(colors);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
  });

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />;

  const outstandingDisplay = stats?.outstandingFeesUsd != null
    ? `$${Math.round(stats.outstandingFeesUsd)}`
    : "—";

  return (
    <>
      <View style={s.statsGrid}>
        <StatCard icon={<Feather name="users" size={18} color={colors.primary} />} label="Total Students" value={stats?.students ?? 0} />
        <StatCard icon={<Feather name="user-check" size={18} color={colors.accent} />} label="Staff" value={stats?.teachers ?? 0} accent={colors.accent} />
        <StatCard icon={<Feather name="user-plus" size={18} color={colors.secondary} />} label="Admissions" value={stats?.pendingAdmissions ?? 0} accent={colors.secondary} />
        <StatCard icon={<Feather name="dollar-sign" size={18} color={colors.success} />} label="Fees Due" value={outstandingDisplay} accent={colors.success} />
      </View>
      <View style={s.bannerCard}>
        <Text style={s.bannerTitle}>All systems operational.</Text>
        <Text style={s.bannerBody}>
          {stats?.pendingAdmissions
            ? `${stats.pendingAdmissions} admission application${stats.pendingAdmissions !== 1 ? "s" : ""} need review.`
            : "No pending admissions."
          }
        </Text>
      </View>
    </>
  );
}

export default function DashboardScreen() {
  const { user, profile, primaryRole, loading } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading]);

  if (!profile) return null;

  const s = sectionStyles(colors);
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

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
      <View style={s.greeting}>
        <View style={s.greetingAvatar}>
          <Text style={s.greetingAvatarText}>{profile.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.greetingName}>Hi, {profile.name.split(" ")[0]}</Text>
          <View style={[s.roleBadge, { backgroundColor: colors.primary + "1A" }]}>
            <Text style={[s.roleText, { color: colors.primary }]}>{ROLE_LABEL[primaryRole!]}</Text>
          </View>
        </View>
        <View style={s.hope2Badge}>
          <Text style={s.hope2Text}>H2</Text>
        </View>
      </View>

      {primaryRole === "student" && <StudentDashboard />}
      {primaryRole === "teacher" && <TeacherDashboard />}
      {(primaryRole === "admin" || primaryRole === "superadmin") && <AdminDashboard />}
      {primaryRole === "parent" && <ParentDashboard />}
      {primaryRole === "alumni" && <AlumniDashboard />}
    </ScrollView>
  );
}

const sectionStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    greeting: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      gap: 12,
    },
    greetingAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    greetingAvatarText: {
      color: "#FFF",
      fontSize: 20,
      fontFamily: "Inter_700Bold",
    },
    greetingName: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    roleBadge: {
      alignSelf: "flex-start",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 4,
    },
    roleText: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
    },
    hope2Badge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    hope2Text: {
      color: "#FFF",
      fontSize: 14,
      fontFamily: "Inter_700Bold",
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 16,
    },
    bannerCard: {
      borderRadius: colors.radius,
      backgroundColor: colors.primary,
      padding: 20,
      marginBottom: 16,
    },
    bannerTitle: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: "#FFF",
    },
    bannerBody: {
      fontSize: 13,
      color: "rgba(255,255,255,0.85)",
      marginTop: 6,
      lineHeight: 20,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 12,
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    listMain: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
      flex: 1,
    },
    listSub: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    listBadge: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
    },
    scheduleRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.muted,
      borderRadius: colors.radius - 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
      gap: 12,
    },
    scheduleTime: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
      width: 50,
    },
    scheduleClass: {
      fontSize: 13,
      color: colors.foreground,
      flex: 1,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
    childCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    childAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    childAvatarText: {
      color: "#FFF",
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
    childName: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    childGrade: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    childStats: {
      alignItems: "center",
    },
    childStat: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
    },
    childStatLabel: {
      fontSize: 10,
      color: colors.mutedForeground,
    },
  });
