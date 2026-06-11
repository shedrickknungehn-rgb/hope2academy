import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SEEN_KEY = "h2l.seen_announcements";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleAnnouncementNotification(
  title: string,
  body: string
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📢 ${title}`,
        body,
        sound: true,
        data: { type: "announcement" },
      },
      trigger: null,
    });
  } catch {}
}

export async function getSeenIds(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function markIdsSeen(ids: string[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(SEEN_KEY, JSON.stringify(ids));
  } catch {}
}

export async function notifyNewAnnouncements(
  announcements: Array<{ id: string; title: string; body: string }>
): Promise<void> {
  if (Platform.OS === "web") return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const seen = await getSeenIds();
  const unseen = announcements.filter((a) => !seen.includes(a.id));
  if (unseen.length === 0) return;

  if (unseen.length === 1) {
    await scheduleAnnouncementNotification(unseen[0].title, unseen[0].body);
  } else {
    await scheduleAnnouncementNotification(
      `${unseen.length} new school notices`,
      unseen.map((a) => a.title).join(" · ")
    );
  }

  await markIdsSeen(announcements.map((a) => a.id));
}
