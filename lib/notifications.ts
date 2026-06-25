import * as Notifications from 'expo-notifications';
import { TimetableData, Lesson } from './timetable-parser';
import { getAppSettings } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleTimetableNotifications(timetable: TimetableData) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = await getAppSettings();
  if (!settings.notifications_enabled) return;

  // Expo Notifications weekday: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
  // Our dayIdx: 0 = Monday, ..., 4 = Friday, 5 = Saturday, 6 = Sunday
  const dayMap = [2, 3, 4, 5, 6, 7, 1];

  timetable.days.forEach((day, dayIdx) => {
    if (!day) return;

    let firstLessonScheduled = false;

    day.forEach((timeSlot, slotIdx) => {
      if (!timeSlot || timeSlot.length === 0) return;
      if (!settings.notify_all_lessons && firstLessonScheduled) return;

      const timeInfo = timetable.hours[slotIdx + 1];
      if (!timeInfo) return;

      const [startStr] = timeInfo.time.split('-');
      const [startHour, startMin] = startStr.split(':').map(Number);

      // Calculate notification time (10 minutes before)
      let notifyHour = startHour;
      let notifyMin = startMin - 10;
      if (notifyMin < 0) {
        notifyMin += 60;
        notifyHour -= 1;
      }
      if (notifyHour < 0) return; // Should not happen for school lessons

      const weekday = dayMap[dayIdx];

      const lessonNames = timeSlot.map(l => l.subject).join(', ');

      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Nadchodząca lekcja',
          body: `${lessonNames} o ${startStr} w sali ${timeSlot[0].room}`,
          data: { dayIdx, slotIdx },
        },
        trigger: {
          weekday: weekday,
          hour: notifyHour,
          minute: notifyMin,
          repeats: true,
        } as any,
      });

      firstLessonScheduled = true;
    });
  });
}
