import { createEvents, EventAttributes, DateArray } from 'ics';
import { TimetableData } from '@/types/timetable';
import { UserTimetableEdits } from '@/lib/store';
import { IcalExportOptions } from '@/components/timetable/export-ical-dialog';


function parseTime(timeStr: string): { hour: number; minute: number } {
    const [h, m] = timeStr.split(':').map(Number);
    return { hour: h, minute: m };
}

function getNextDateForDayIndex(dayIndex: number): Date {
    const today = new Date();
    const currentDayOfWeek = today.getDay() || 7; // 1-7 (Mon-Sun)
    const targetDayOfWeek = dayIndex + 1; // 1-5 (Mon-Fri)

    const date = new Date(today);
    // If we are past this day in the current week, get it for the next week
    // Actually, for a timetable it's often better to just start from the current week's Monday
    // So if today is Thursday (4), and we want Tuesday (2), it should be a date in the past
    // Let's just calculate the offset from today to the target day in the current week.
    const offset = targetDayOfWeek - currentDayOfWeek;
    date.setDate(today.getDate() + offset);

    // Reset time to 00:00:00
    date.setHours(0, 0, 0, 0);
    return date;
}

export function generateIcalContent(
    data: TimetableData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergedDataDays: any[],
    userEdits: UserTimetableEdits,
    options: IcalExportOptions
): string | null {
    const events: EventAttributes[] = [];
    const hours = Object.values(data.hours);

    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
        const baseDate = getNextDateForDayIndex(dayIndex);
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth() + 1; // 1-12
        const date = baseDate.getDate();

        for (let timeIndex = 0; timeIndex < hours.length; timeIndex++) {
            const hour = hours[timeIndex];
            const lessons = mergedDataDays[dayIndex]?.[timeIndex];
            const breakInfo = userEdits.breaks[dayIndex]?.[timeIndex];

            // Setup Recurrence Rule
            let recurrenceRule: string | undefined = undefined;
            if (options.recurrenceType !== 'none') {
                const parts = ['FREQ=WEEKLY'];
                if (options.interval > 1) {
                    parts.push(`INTERVAL=${options.interval}`);
                }
                if (options.recurrenceType === 'count' && options.count) {
                    parts.push(`COUNT=${options.count}`);
                } else if (options.recurrenceType === 'until' && options.untilDate) {
                    // YYYYMMDDTHHMMSSZ
                    const uDate = new Date(options.untilDate);
                    uDate.setHours(23, 59, 59);
                    const yyyy = uDate.getUTCFullYear();
                    const mm = String(uDate.getUTCMonth() + 1).padStart(2, '0');
                    const dd = String(uDate.getUTCDate()).padStart(2, '0');
                    const hh = String(uDate.getUTCHours()).padStart(2, '0');
                    const min = String(uDate.getUTCMinutes()).padStart(2, '0');
                    const ss = String(uDate.getUTCSeconds()).padStart(2, '0');
                    parts.push(`UNTIL=${yyyy}${mm}${dd}T${hh}${min}${ss}Z`);
                }
                recurrenceRule = parts.join(';');
            }

            // Lessons
            if (lessons && lessons.length > 0) {
                const { hour: startH, minute: startM } = parseTime(hour.timeFrom);
                const { hour: endH, minute: endM } = parseTime(hour.timeTo);

                const start: DateArray = [year, month, date, startH, startM];
                const end: DateArray = [year, month, date, endH, endM];

                // Usually we just combine titles if there are multiple groups
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const titles = lessons.map((l: any) => {
                    let t = l.subject;
                    if (l.groupName) t += ` (${l.groupName})`;
                    return t;
                }).join(' / ');

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const description = lessons.map((l: any) => {
                    const desc = [];
                    if (l.teacher) desc.push(`Nauczyciel: ${l.teacher}`);
                    if (l.className) desc.push(`Klasa: ${l.className}`);
                    return desc.join('\n');
                }).join('\n\n');

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const location = lessons.map((l: any) => l.room).filter(Boolean).join(' / ');

                events.push({
                    start,
                    end,
                    title: titles,
                    description: description,
                    location: location,
                    recurrenceRule
                });
            }

            // Breaks / Duties
            if (breakInfo?.note && timeIndex < hours.length - 1) {
                const nextHour = hours[timeIndex + 1];

                const { hour: breakStartH, minute: breakStartM } = parseTime(hour.timeTo);
                const { hour: breakEndH, minute: breakEndM } = parseTime(nextHour.timeFrom);

                const start: DateArray = [year, month, date, breakStartH, breakStartM];
                const end: DateArray = [year, month, date, breakEndH, breakEndM];

                events.push({
                    start,
                    end,
                    title: `Przerwa/Dyżur: ${breakInfo.note}`,
                    recurrenceRule
                });
            }
        }
    }

    if (events.length === 0) return null;

    const { error, value } = createEvents(events);

    if (error) {
        console.error('Failed to create ical events', error);
        return null;
    }

    return value || null;
}

export function downloadIcalFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
