import { Table, TimetableList } from '@wulkanowy/timetable-parser';
import { TextDecoder } from 'text-encoding';
import { Buffer } from 'buffer';

export interface Lesson {
  subject: string;
  className: string;
  groupName: string;
  room: string;
  teacher: string;
  altLessons?: Lesson[];
}

export interface TimetableData {
  title: string;
  days: (Lesson[][] | null)[];
  hours: { [key: string]: { number: string; time: string } };
}

export interface TimetableListItem {
  name: string;
  value: string;
}

export interface TimetableListResponse {
  classes: TimetableListItem[];
  teachers: TimetableListItem[];
  rooms: TimetableListItem[];
  urlBase: string;
}

export async function fetchTimetableList(url: string): Promise<TimetableListResponse> {
  let listUrl = url;
  if (listUrl.endsWith('index.html')) {
    listUrl = listUrl.replace('index.html', 'lista.html');
  } else if (!listUrl.endsWith('lista.html')) {
    if (!listUrl.endsWith('/')) {
      listUrl += '/';
    }
    listUrl += 'lista.html';
  }

  const response = await fetch(listUrl);
  if (!response.ok) {
    throw new Error('Nie znaleziono pliku lista.html lub nieprawidłowy URL');
  }

  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  let decoder = new TextDecoder('utf-8');
  let html = decoder.decode(uint8Array);

  if (html.toLowerCase().includes('windows-1250')) {
    decoder = new TextDecoder('windows-1250');
    html = decoder.decode(uint8Array);
  } else if (html.toLowerCase().includes('iso-8859-2')) {
    decoder = new TextDecoder('iso-8859-2');
    html = decoder.decode(uint8Array);
  }

  const listParser = new TimetableList(html);
  const parsedList = listParser.getList();

  const formatValue = (item: any, prefix: string) => {
    if (!item) return [];
    return item.map((i: any) => {
      if (/^\d+$/.test(i.value)) {
        return { ...i, value: `plany/${prefix}${i.value}.html` };
      }
      return i;
    });
  };

  return {
    classes: formatValue(parsedList.classes, 'o'),
    teachers: formatValue(parsedList.teachers, 'n'),
    rooms: formatValue(parsedList.rooms, 's'),
    urlBase: listUrl.substring(0, listUrl.lastIndexOf('/') + 1)
  };
}

export async function fetchTimetable(url: string): Promise<TimetableData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch timetable: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Optivum is usually windows-1250 or iso-8859-2
  let decoder = new TextDecoder('utf-8');
  let html = decoder.decode(uint8Array);

  if (html.toLowerCase().includes('windows-1250')) {
    decoder = new TextDecoder('windows-1250');
    html = decoder.decode(uint8Array);
  } else if (html.toLowerCase().includes('iso-8859-2')) {
    decoder = new TextDecoder('iso-8859-2');
    html = decoder.decode(uint8Array);
  }

  // Check if a timetable table (.tabela) exists in the provided HTML
  const tableRegex = /<table[^>]*class="[^"]*\btabela\b[^"]*"[^>]*>/i;
  if (!tableRegex.test(html)) {
    throw new Error('Could not find a timetable table (.tabela) in the provided HTML.');
  }

  const parser = new Table(html);
  const parsedDays = parser.getDays();

  const days = parsedDays.map(day => {
    if (!day) return day;
    return day.map(timeSlot => {
      if (!timeSlot) return timeSlot;
      return timeSlot.map(lesson => {
        let { className, groupName, subject } = lesson;

        // Regex to find patterns like "-1/2", " 2/2", "2/2", etc.
        const groupRegex = /(?:[\s-])?([1-9]\/[1-9])/;

        if (!groupName) {
          // Check className
          if (className) {
            const match = className.match(groupRegex);
            if (match) {
              groupName = match[1];
              className = className.replace(match[0], '').trim().replace(/\s{2,}/g, ' ');
            }
          }

          // Check subject
          if (!groupName && subject) {
            const match = subject.match(groupRegex);
            if (match) {
              groupName = match[1];
              subject = subject.replace(match[0], '').trim().replace(/\s{2,}/g, ' ');
            }
          }
        }

        // Heuristic to split concatenated class name and subject
        if (!className && subject) {
          const splitMatch = subject.match(/^([1-9][A-Za-z]+)\s+(.+)$/);
          if (splitMatch) {
            className = splitMatch[1];
            subject = splitMatch[2];
          }
        }

        return {
          ...lesson,
          className,
          groupName,
          subject
        };
      });
    });
  });

  let extractedTitle = 'Timetable';
  const titleRegex = /<span[^>]*class="[^"]*\btytulnapis\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i;
  const titleMatch = html.match(titleRegex);
  if (titleMatch && titleMatch[1]) {
    extractedTitle = titleMatch[1].trim().replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '');
  }

  return {
    title: extractedTitle,
    days: days as (Lesson[][] | null)[],
    hours: parser.getHours() as any,
  };
}
