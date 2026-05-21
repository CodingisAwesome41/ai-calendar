import * as Notifications from "expo-notifications";
import { parseISO, subMinutes } from "date-fns";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleEventReminder(
  title: string,
  startIso: string
): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const start = parseISO(startIso);
  const trigger = subMinutes(start, 15);
  if (trigger.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Upcoming event",
      body: `${title} starts in 15 minutes`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
}
