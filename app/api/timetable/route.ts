import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Table } from '@wulkanowy/timetable-parser';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch timetable: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // Optivum is usually windows-1250 or iso-8859-2, let's use utf-8 to check
    let decoder = new TextDecoder('utf-8');
    let html = decoder.decode(arrayBuffer);

    if (html.toLowerCase().includes('windows-1250')) {
      decoder = new TextDecoder('windows-1250');
      html = decoder.decode(arrayBuffer);
    } else if (html.toLowerCase().includes('iso-8859-2')) {
      decoder = new TextDecoder('iso-8859-2');
      html = decoder.decode(arrayBuffer);
    }

    const dom = new JSDOM(html);
    const tableElement = dom.window.document.querySelector('.tabela');

    if (!tableElement) {
       return NextResponse.json({ error: 'Could not find a timetable table (.tabela) in the provided HTML.' }, { status: 400 });
    }

    // Pass the outerHTML as Table constructor might expect a string or specific element
    const parser = new Table(html);
    const parsedDays = parser.getDays();

    // Post-process the parsed days to fix missing group names
    // Example: "4TT-2/2" in className should be "4TT" with groupName "2/2"
    // Sometimes subject has it, sometimes className.
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

                // Dodatkowa heurystyka: jeśli klasa nadal nie istnieje, a w subject znajduje się coś wyglądającego na klasę (np. "4TT")
                // lub subject i grupa połączona (np. "r_informat. 4TT w3" albo "4TT r_informat. w3" - zostało nam to po odcięciu grupy "2/2")
                // wyodrębniamy to do zmiennej className
                if (!className && subject) {
                    // Rozbijamy subject na części oddzielone spacjami
                    const parts = subject.split(/\s+/);
                    if (parts.length > 1) {
                        // Jeśli jedna z części wygląda na klasę (np. "4TT", "1A", "3T_p"), oddzielamy to
                        // Zazwyczaj to pierwsza lub druga część jeśli subject zaczął się od nazwy przedmiotu
                        const classRegex = /^[1-5][A-Z]+/;

                        const classIndex = parts.findIndex(p => classRegex.test(p));
                        if (classIndex !== -1) {
                            className = parts[classIndex];
                            parts.splice(classIndex, 1);
                            subject = parts.join(' ').trim();
                        }

                        // Podobne rozwiązanie na wypadek uwięzionej sali "w3", "s24" etc.
                        if (!lesson.room) {
                            const roomRegex = /^[ws][0-9]+$|^[0-9]+$/i;
                            const roomIndex = parts.findIndex(p => roomRegex.test(p));
                            if (roomIndex !== -1) {
                                lesson.room = parts[roomIndex];
                                parts.splice(roomIndex, 1);
                                subject = parts.join(' ').trim();
                            }
                        }
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

    const timetableData = {
        title: dom.window.document.querySelector('.tytulnapis')?.textContent || 'Timetable',
        days,
        hours: parser.getHours(),
    };

    return NextResponse.json(timetableData);
  } catch (error: any) {
    console.error('Error fetching/parsing timetable:', error);
    return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 });
  }
}
