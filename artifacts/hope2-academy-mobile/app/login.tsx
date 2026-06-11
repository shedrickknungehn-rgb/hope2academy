import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { DEMO_CREDENTIALS, ROLE_LABEL } from "@/lib/mock-backend-mobile";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const s = styles(colors, insets);

  const doSignIn = async (e: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.login(e, p);
      await refresh();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err?.message ?? "Sign-in failed");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = () => doSignIn(email, password);
  const quickSignIn = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    doSignIn(e, p);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[colors.heroGradientStart, colors.heroGradientMid, colors.heroGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientBg}
      />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>H2</Text>
          </View>
          <Text style={s.appName}>HOPE2 ACADEMY</Text>
          <Text style={s.tagline}>Faith · Character · Scholarship</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Sign In</Text>
          <Text style={s.cardSub}>Access your HOPE2 ACADEMY portal</Text>

          {error && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.destructive} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <View style={s.inputRow}>
              <MaterialIcons name="email" size={18} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@hope2academy.org"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={[s.field, { marginBottom: 4 }]}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputRow}>
              <MaterialIcons name="lock" size={18} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [s.signInBtn, pressed && { opacity: 0.85 }]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.primaryForeground} />
              : <Text style={s.signInBtnText}>Sign In</Text>
            }
          </Pressable>

          {/* Demo Credentials */}
          <View style={s.demoSection}>
            <Text style={s.demoTitle}>Demo accounts — tap to sign in</Text>
            <View style={s.demoGrid}>
              {DEMO_CREDENTIALS.map((c) => (
                <Pressable
                  key={c.role}
                  style={({ pressed }) => [s.demoChip, pressed && { opacity: 0.7 }]}
                  onPress={() => quickSignIn(c.email, c.password)}
                >
                  <Text style={s.demoRole}>{ROLE_LABEL[c.role]}</Text>
                  <Text style={s.demoEmail} numberOfLines={1}>{c.email}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.demoPass}>Password for all: demo1234</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    gradientBg: {
      ...StyleSheet.absoluteFillObject,
    },
    scroll: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20),
      paddingHorizontal: 20,
      minHeight: "100%",
    },
    header: {
      alignItems: "center",
      paddingTop: 32,
      paddingBottom: 28,
    },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.4)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    logoText: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
    },
    appName: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
      letterSpacing: 2,
    },
    tagline: {
      fontSize: 13,
      color: "rgba(255,255,255,0.75)",
      marginTop: 4,
      letterSpacing: 1,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 4,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
    cardTitle: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    cardSub: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 2,
      marginBottom: 20,
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.destructive + "15",
      borderRadius: colors.radius - 4,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 13,
      color: colors.destructive,
      flex: 1,
    },
    field: {
      marginBottom: 14,
    },
    label: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      marginBottom: 6,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius - 4,
      backgroundColor: colors.background,
      paddingHorizontal: 12,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      paddingVertical: 12,
      fontFamily: "Inter_400Regular",
    },
    eyeBtn: {
      padding: 4,
    },
    signInBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius - 4,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
      marginBottom: 24,
    },
    signInBtnText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.primaryForeground,
    },
    demoSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
    },
    demoTitle: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    demoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    demoChip: {
      width: "47%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius - 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.muted,
    },
    demoRole: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    demoEmail: {
      fontSize: 10,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    demoPass: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 10,
      fontFamily: "Inter_400Regular",
    },
  });
