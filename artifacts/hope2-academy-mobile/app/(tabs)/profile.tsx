import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, ROLE_LABEL } from "@/context/AuthContext";
import { ROLE_COLOR } from "@/lib/mock-backend-mobile";
import { useColors } from "@/hooks/useColors";

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[infoStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[infoStyles.iconWrap, { backgroundColor: colors.muted }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[infoStyles.value, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
});

export default function ProfileScreen() {
  const { user, profile, primaryRole, loading, signOut } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading]);

  if (!profile) return null;

  const roleColor = primaryRole ? ROLE_COLOR[primaryRole] : colors.primary;
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      doSignOut();
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: doSignOut },
    ]);
  };

  const doSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace("/login");
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
      {/* Avatar header */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: roleColor }]}>
          <Text style={styles.avatarText}>{profile.name[0]}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{profile.name}</Text>
        <View style={[styles.rolePill, { backgroundColor: roleColor + "20" }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABEL[primaryRole!]}</Text>
        </View>
        {profile.bio && (
          <Text style={[styles.bio, { color: colors.mutedForeground }]}>{profile.bio}</Text>
        )}
      </View>

      {/* Info card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Personal Info</Text>
        {profile.email && (
          <InfoRow
            icon={<MaterialIcons name="email" size={18} color={colors.mutedForeground} />}
            label="Email"
            value={profile.email}
          />
        )}
        {profile.phone && (
          <InfoRow
            icon={<Feather name="phone" size={16} color={colors.mutedForeground} />}
            label="Phone"
            value={profile.phone}
          />
        )}
        {profile.address && (
          <InfoRow
            icon={<Feather name="map-pin" size={16} color={colors.mutedForeground} />}
            label="Address"
            value={profile.address}
          />
        )}
      </View>

      {/* Role-specific info */}
      {(primaryRole === "student") && profile.grade && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Academic Info</Text>
          <InfoRow
            icon={<Feather name="book" size={16} color={colors.mutedForeground} />}
            label="Grade"
            value={`Grade ${profile.grade}`}
          />
          {profile.class_name && (
            <InfoRow
              icon={<Feather name="users" size={16} color={colors.mutedForeground} />}
              label="Class"
              value={profile.class_name}
            />
          )}
        </View>
      )}

      {(primaryRole === "teacher") && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Teaching Info</Text>
          {profile.department && (
            <InfoRow
              icon={<Feather name="layers" size={16} color={colors.mutedForeground} />}
              label="Department"
              value={profile.department}
            />
          )}
          {profile.subjects && profile.subjects.length > 0 && (
            <InfoRow
              icon={<Feather name="book-open" size={16} color={colors.mutedForeground} />}
              label="Subjects"
              value={profile.subjects.join(", ")}
            />
          )}
        </View>
      )}

      {(primaryRole === "alumni") && profile.graduation_year && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Alumni Info</Text>
          <InfoRow
            icon={<Ionicons name="school-outline" size={18} color={colors.mutedForeground} />}
            label="Graduation Year"
            value={String(profile.graduation_year)}
          />
        </View>
      )}

      {/* HOPE2 branding */}
      <View style={[styles.brandCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.brandTitle}>HOPE2 ACADEMY</Text>
        <Text style={styles.brandSub}>Faith · Character · Scholarship</Text>
        <Text style={styles.brandLoc}>Marshall Road, Liberia</Text>
      </View>

      {/* Sign out */}
      <Pressable
        style={({ pressed }) => [
          styles.signOutBtn,
          { borderColor: colors.destructive, backgroundColor: pressed ? colors.destructive + "10" : "transparent" },
        ]}
        onPress={handleSignOut}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  rolePill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 6,
  },
  roleText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  bio: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  brandCard: {
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  brandTitle: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  brandSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 4,
  },
  brandLoc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 8,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
