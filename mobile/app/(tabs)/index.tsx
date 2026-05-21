import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, RefreshControl } from "react-native";
import { Calendar } from "react-native-calendars";
import { useCalendar } from "@/context/CalendarContext";
import { DayAgenda } from "@/components/calendar/DayAgenda";
import { toMarkedDates } from "@/lib/events";
import { summarizeCalendar } from "@/lib/api";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useCallback, useEffect, useState } from "react";
import Markdown from "@/components/MarkdownText";

export default function CalendarScreen() {
  const { selectedDate, setSelectedDate, events, refresh, loading } = useCalendar();
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  const marked = useMemo(() => toMarkedDates(events), [events]);
  const [summary, setSummary] = useState<string | null>(null);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const loadSummary = useCallback(async () => {
    try {
      const dayEvents = events.filter((e) => e.start.startsWith(selectedDate));
      if (dayEvents.length === 0) {
        setSummary(null);
        return;
      }
      const res = await summarizeCalendar({
        scope: "day",
        anchorDate: selectedDate,
        timezone,
        events: dayEvents,
      });
      setSummary(res.summary);
    } catch {
      setSummary(null);
    }
  }, [events, selectedDate, timezone]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.tint} />
      }
    >
      <Text style={[styles.title, { color: colors.text }]}>AI Calendar</Text>
      {summary ? (
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Today&apos;s AI summary</Text>
          <Markdown text={summary} color={colors.text} />
        </View>
      ) : null}
      <Calendar
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          ...marked,
          [selectedDate]: {
            ...marked[selectedDate],
            selected: true,
            selectedColor: colors.tint,
          },
        }}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.muted,
          selectedDayBackgroundColor: colors.tint,
          todayTextColor: colors.tint,
          dayTextColor: colors.text,
          monthTextColor: colors.text,
          arrowColor: colors.tint,
        }}
      />
      <DayAgenda />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { fontSize: 28, fontWeight: "800", paddingHorizontal: 16, paddingTop: 12 },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    padding: 14,
  },
  summaryLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase" },
});
