import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { suggestSlots } from "@/lib/api";
import { createLocalEvent } from "@/lib/calendars";
import { busyBlocks } from "@/lib/events";
import { useCalendar } from "@/context/CalendarContext";
import type { SlotSuggestion } from "@/lib/types";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { addDays, format, parseISO } from "date-fns";

export default function ScheduleScreen() {
  const { events, selectedDate, refresh } = useCalendar();
  const [duration, setDuration] = useState("30");
  const [attendees, setAttendees] = useState("");
  const [suggestions, setSuggestions] = useState<SlotSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  async function handleSuggest() {
    setLoading(true);
    try {
      const dateFrom = selectedDate;
      const dateTo = format(addDays(parseISO(selectedDate), 7), "yyyy-MM-dd");
      const slots = await suggestSlots({
        durationMinutes: Number(duration) || 30,
        dateFrom,
        dateTo,
        timezone,
        attendees: attendees || undefined,
        busyBlocks: busyBlocks(events),
      });
      setSuggestions(slots);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to suggest slots");
    } finally {
      setLoading(false);
    }
  }

  async function bookSlot(slot: SlotSuggestion) {
    try {
      await createLocalEvent({
        title: attendees ? `Meeting: ${attendees}` : "Scheduled meeting",
        start: slot.start,
        end: slot.end,
      });
      await refresh();
      Alert.alert("Booked", "Event saved to device calendar.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to book");
    }
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Smart Schedule</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        AI finds open slots around your existing events
      </Text>

      <Text style={[styles.label, { color: colors.muted }]}>Duration (minutes)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
      />

      <Text style={[styles.label, { color: colors.muted }]}>Attendees (optional)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        value={attendees}
        onChangeText={setAttendees}
        placeholder="e.g. design team"
        placeholderTextColor={colors.muted}
      />

      <Pressable
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={handleSuggest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Find best times</Text>
        )}
      </Pressable>

      {suggestions.map((slot, i) => (
        <View key={i} style={[styles.slot, { backgroundColor: colors.card }]}>
          <Text style={[styles.slotTime, { color: colors.text }]}>
            {format(parseISO(slot.start), "EEE MMM d, h:mm a")}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{slot.reasoning}</Text>
          <Text style={{ color: colors.tint, marginTop: 4, fontWeight: "600" }}>
            Score: {slot.score}
          </Text>
          <Pressable
            style={[styles.bookBtn, { borderColor: colors.tint }]}
            onPress={() => bookSlot(slot)}
          >
            <Text style={{ color: colors.tint, fontWeight: "600" }}>Book this slot</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  button: { borderRadius: 12, padding: 14, alignItems: "center", marginTop: 16 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  slot: { borderRadius: 12, padding: 14, marginTop: 12 },
  slotTime: { fontSize: 17, fontWeight: "700" },
  bookBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
});
