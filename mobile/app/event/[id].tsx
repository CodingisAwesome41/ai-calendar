import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCalendar } from "@/context/CalendarContext";
import { deleteLocalEvent } from "@/lib/calendars";
import { deleteGoogleEvent } from "@/lib/api";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { format, parseISO } from "date-fns";

export default function EventDetailScreen() {
  const { id, source } = useLocalSearchParams<{ id: string; source: string }>();
  const { events, refresh } = useCalendar();
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];

  const event = useMemo(
    () => events.find((e) => e.id === id && e.source === source),
    [events, id, source]
  );

  if (!event) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Event not found</Text>
      </View>
    );
  }

  const current = event;

  async function handleDelete() {
    Alert.alert("Delete event?", current.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (current.source === "google") {
              await deleteGoogleEvent(current.id);
            } else {
              await deleteLocalEvent(current.id);
            }
            await refresh();
            router.back();
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Delete failed");
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>
        {format(parseISO(current.start), "EEE MMM d, yyyy h:mm a")} –{" "}
        {format(parseISO(current.end), "h:mm a")}
      </Text>
      <Text style={[styles.badge, { color: current.source === "google" ? "#4285F4" : "#34C759" }]}>
        {current.source === "google" ? "Google Calendar" : "Device Calendar"}
      </Text>
      {current.location ? (
        <Text style={[styles.section, { color: colors.text }]}>{current.location}</Text>
      ) : null}
      {current.description ? (
        <Text style={[styles.section, { color: colors.muted }]}>{current.description}</Text>
      ) : null}

      <Pressable style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete event</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "800" },
  meta: { fontSize: 15, marginTop: 8 },
  badge: { fontSize: 13, fontWeight: "600", marginTop: 12 },
  section: { fontSize: 16, marginTop: 16, lineHeight: 22 },
  deleteBtn: {
    marginTop: 32,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  deleteText: { color: "#fff", fontWeight: "700" },
});
