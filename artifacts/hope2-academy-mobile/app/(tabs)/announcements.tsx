import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api-client";
import { notifyNewAnnouncements } from "@/lib/notifications";
import { useColors } from "@/hooks/useColors";

type Announcement = { id: string; title: string; body: string; audience: string; date: string };

const AUDIENCE_COLORS: Record<string, string> = {
  All: "#2B6B3B",
  Students: "#1A5276",
  Parents: "#D4A040",
  Staff: "#C43427",
  Alumni: "#5B7060",
};

function AnnouncementCard({ item }: { item: Announcement }) {
  const colors = useColors();
  const audienceColor = AUDIENCE_COLORS[item.audience] ?? colors.primary;
  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: audienceColor + "18" }]}>
          <Text style={[styles.badgeText, { color: audienceColor }]}>{item.audience}</Text>
        </View>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{item.date}</Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{item.body}</Text>
    </View>
  );
}

function NotifyButton({ onPress, colors }: { onPress: () => void; colors: ReturnType<typeof useColors> }) {
  if (Platform.OS === "web") return null;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.notifyBtn,
        { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons name="notifications-outline" size={14} color="#fff" />
      <Text style={styles.notifyBtnText}>Test notification</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  date: { fontSize: 11, fontFamily: "Inter_400Regular" },
  title: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 6, lineHeight: 22 },
  body: { fontSize: 13, lineHeight: 20, fontFamily: "Inter_400Regular" },
  notifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 8,
  },
  notifyBtnText: { fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" },
});

export default function AnnouncementsScreen() {
  const { user, loading } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => apiClient.getCollection<Announcement>("announcements"),
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!loading && user && announcements.length > 0) {
      notifyNewAnnouncements(announcements);
    }
  }, [loading, user, announcements]);

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  const triggerTestNotification = () => {
    const latest = announcements[0];
    if (latest) notifyNewAnnouncements([{ ...latest, id: `test_${Date.now()}` }]);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + webTopPad + 16,
        paddingBottom: insets.bottom + webBotPad + 90,
        paddingHorizontal: 16,
      }}
      data={announcements}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <AnnouncementCard item={item} />}
      ListHeaderComponent={() => (
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="notifications" size={22} color={colors.primary} />
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Notices</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>
            School-wide announcements
          </Text>
          <NotifyButton onPress={triggerTestNotification} colors={colors} />
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={{ alignItems: "center", paddingTop: 48 }}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 14 }}>No announcements yet</Text>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
