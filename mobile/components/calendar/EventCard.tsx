import { StyleSheet, Text, View, Pressable } from "react-native";
import { Link } from "expo-router";
import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "@/lib/types";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export function EventCard({ event }: { event: CalendarEvent }) {
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  const start = parseISO(event.start);
  const end = parseISO(event.end);

  return (
    <Link
      href={{
        pathname: "/event/[id]",
        params: { id: event.id, source: event.source },
      }}
      asChild
    >
      <Pressable style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.row}>
          <Text style={[styles.time, { color: colors.muted }]}>
            {format(start, "h:mm a")} – {format(end, "h:mm a")}
          </Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  event.source === "google" ? "#4285F420" : "#34C75920",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: event.source === "google" ? "#4285F4" : "#34C759" },
              ]}
            >
              {event.source === "google" ? "Google" : "Device"}
            </Text>
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
        {event.location ? (
          <Text style={[styles.location, { color: colors.muted }]}>
            {event.location}
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  time: { fontSize: 13, fontWeight: "500" },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "600", marginTop: 6 },
  location: { fontSize: 14, marginTop: 4 },
});
