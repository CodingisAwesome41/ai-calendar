import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { getGoogleAuthUrl, getGoogleStatus } from "@/lib/api";
import { exchangeAuthCode, useGoogleAuthRequest } from "@/lib/google-auth";
import { useCalendar } from "@/context/CalendarContext";
import { clearSession } from "@/lib/session";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function SettingsScreen() {
  const { googleConnected, setGoogleConnected, refresh } = useCalendar();
  const [request, response, promptAsync] = useGoogleAuthRequest();
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];

  useEffect(() => {
    (async () => {
      if (response?.type === "success" && response.params.code) {
        try {
          await exchangeAuthCode(response.params.code);
          setGoogleConnected(true);
          await refresh();
          Alert.alert("Connected", "Google Calendar is linked.");
        } catch (e) {
          Alert.alert("Error", e instanceof Error ? e.message : "Link failed");
        }
      }
    })();
  }, [response, refresh, setGoogleConnected]);

  async function connectGoogleNative() {
    if (!request) {
      Alert.alert("Setup required", "Add Google OAuth client IDs to mobile/.env");
      return;
    }
    await promptAsync();
  }

  async function connectGoogleBrowser() {
    try {
      const url = await getGoogleAuthUrl();
      await WebBrowser.openBrowserAsync(url);
      const connected = await getGoogleStatus();
      setGoogleConnected(connected);
      await refresh();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to open auth");
    }
  }

  async function disconnect() {
    await clearSession();
    setGoogleConnected(false);
    await refresh();
    Alert.alert("Disconnected", "Session cleared. Reconnect to sync Google again.");
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Google Calendar</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Status: {googleConnected ? "Connected" : "Not connected"}
        </Text>

        {!googleConnected ? (
          <>
            <Pressable
              style={[styles.btn, { backgroundColor: "#4285F4" }]}
              onPress={connectGoogleNative}
            >
              <Text style={styles.btnText}>Connect (in-app OAuth)</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: colors.tint, marginTop: 8 }]}
              onPress={connectGoogleBrowser}
            >
              <Text style={styles.btnText}>Connect (browser)</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.btn, { backgroundColor: "#EF4444", marginTop: 12 }]}
            onPress={disconnect}
          >
            <Text style={styles.btnText}>Disconnect Google</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Privacy</Text>
        <Text style={[styles.privacy, { color: colors.muted }]}>
          Event titles, times, and locations are sent to Anthropic for AI parsing,
          scheduling suggestions, and summaries. Google tokens are stored encrypted
          on the API server. Apple/iCloud calendars are accessed on-device only via
          system permissions.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>API</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          {process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  btn: { borderRadius: 10, padding: 12, alignItems: "center", marginTop: 12 },
  btnText: { color: "#fff", fontWeight: "600" },
  privacy: { fontSize: 14, lineHeight: 20, marginTop: 8 },
});
