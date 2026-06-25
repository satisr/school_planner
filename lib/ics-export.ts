import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { TimetableData, Lesson } from './timetable-parser';

const DAY_MAP = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function getNextDayOfWeek(dayIndex: number) {
  const resultDate = new Date();
  resultDate.setSeconds(0);
  resultDate.setMilliseconds(0);
  const currentDay = (resultDate.getDay() + 6) % 7; // Monday = 0, ..., Sunday = 6
  let distance = dayIndex - currentDay;
  if (distance < 0) distance += 7;
  resultDate.setDate(resultDate.getDate() + distance);
  return resultDate;
}

export async function exportToICS(timetable: TimetableData) {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SchoolPlanner//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  timetable.days.forEach((day, dayIdx) => {
    if (!day) return;

    day.forEach((timeSlot, slotIdx) => {
      if (!timeSlot) return;

      const timeInfo = timetable.hours[slotIdx + 1];
      if (!timeInfo) return;

      // timeInfo.time is usually "08:00-08:45"
      const [startStr, endStr] = timeInfo.time.split('-');
      const [startHour, startMin] = startStr.split(':').map(Number);
      const [endHour, endMin] = endStr.split(':').map(Number);

      timeSlot.forEach((lesson) => {
        const startDate = getNextDayOfWeek(dayIdx);
        startDate.setHours(startHour, startMin, 0);

        const endDate = new Date(startDate);
        endDate.setHours(endHour, endMin, 0);

        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`SUMMARY:${lesson.subject}${lesson.groupName ? ' (' + lesson.groupName + ')' : ''}`);
        icsContent.push(`DESCRIPTION:Nauczyciel: ${lesson.teacher}\\nKlasa: ${lesson.className}`);
        icsContent.push(`LOCATION:${lesson.room}`);
        icsContent.push(`DTSTART:${formatICSDate(startDate)}`);
        icsContent.push(`DTEND:${formatICSDate(endDate)}`);
        icsContent.push(`RRULE:FREQ=WEEKLY;BYDAY=${DAY_MAP[dayIdx]}`);
        icsContent.push(`DTSTAMP:${formatICSDate(new Date())}`);
        icsContent.push(`UID:${Date.now()}-${dayIdx}-${slotIdx}-${lesson.subject.replace(/\s/g, '')}@schoolplanner`);
        icsContent.push('END:VEVENT');
      });
    });
  });

  icsContent.push('END:VCALENDAR');

  const fileUri = FileSystem.cacheDirectory + 'plan_lekcji.ics';
  await FileSystem.writeAsStringAsync(fileUri, icsContent.join('\r\n'), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/calendar',
      dialogTitle: 'Eksportuj plan lekcji',
      UTI: 'public.calendar-event',
    });
  } else {
    throw new Error('Udostępnianie nie jest dostępne na tym urządzeniu');
  }
}
