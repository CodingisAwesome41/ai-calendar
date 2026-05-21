import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { eventsForDay } from "@/lib/events";
import { useCalendar } from "@/context/CalendarContext";
import { EventCard } from "./EventCard";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { format, parseISO } from "date-fns";

export function DayAgenda() {
  const { selectedDate, events, loading } = useCalendar();
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  const dayEvents = eventsForDay(events, selectedDate);

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.text }]}>
        {format(parseISO(selectedDate), "EEEE, MMM d")}
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} />
      ) : dayEvents.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>
          No events — tap AI to schedule something.
        </Text>
      ) : (
        dayEvents.map((e) => <EventCard key={`${e.source}-${e.id}`} event={e} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  heading: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  empty: { fontSize: 15, marginTop: 8 },
});
