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
import { parseEvent } from "@/lib/api";
import { createLocalEvent } from "@/lib/calendars";
import { createGoogleEvent } from "@/lib/api";
import { useCalendar } from "@/context/CalendarContext";
import type { ParsedEvent } from "@/lib/types";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { format, parseISO } from "date-fns";
import { scheduleEventReminder } from "@/lib/notifications";

export default function AIScreen() {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { refresh, googleConnected, selectedDate } = useCalendar();
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setPreview(null);
    try {
      const event = await parseEvent(text.trim(), timezone, selectedDate);
      setPreview(event);
    } catch (e) {
      Alert.alert("AI Error", e instanceof Error ? e.message : "Failed to parse");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(target: "local" | "google") {
    if (!preview) return;
    setSaving(true);
    try {
      const payload = {
        title: preview.title,
        start: preview.start,
        end: preview.end,
        location: preview.location,
        description: preview.notes,
      };

      if (target === "google" && googleConnected) {
        await createGoogleEvent(payload);
      } else {
        await createLocalEvent(payload);
      }

      await scheduleEventReminder(preview.title, preview.start);
      setText("");
      setPreview(null);
      await refresh();
      Alert.alert("Saved", "Event added to your calendar.");
    } catch (e) {
      Alert.alert("Save Error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>AI Composer</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Describe an event in plain English
      </Text>

      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
        ]}
        placeholder='e.g. "Coffee with Sam Friday 3pm for 30 min"'
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
        multiline
      />

      <Pressable
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={handleParse}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Parse with AI</Text>
        )}
      </Pressable>

      {preview ? (
        <View style={[styles.preview, { backgroundColor: colors.card }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>{preview.title}</Text>
          <Text style={{ color: colors.muted }}>
            {format(parseISO(preview.start), "EEE MMM d, h:mm a")} –{" "}
            {format(parseISO(preview.end), "h:mm a")}
          </Text>
          {preview.location ? (
            <Text style={{ color: colors.muted, marginTop: 4 }}>{preview.location}</Text>
          ) : null}
          {preview.notes ? (
            <Text style={{ color: colors.muted, marginTop: 4 }}>{preview.notes}</Text>
          ) : null}

          <Pressable
            style={[styles.button, { backgroundColor: "#34C759", marginTop: 16 }]}
            onPress={() => handleSave("local")}
            disabled={saving}
          >
            <Text style={styles.buttonText}>Save to Device Calendar</Text>
          </Pressable>

          {googleConnected ? (
            <Pressable
              style={[styles.button, { backgroundColor: "#4285F4", marginTop: 8 }]}
              onPress={() => handleSave("google")}
              disabled={saving}
            >
              <Text style={styles.buttonText}>Save to Google Calendar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  preview: { borderRadius: 12, padding: 16, marginTop: 20 },
  previewTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
});
