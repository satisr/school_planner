import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
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

    // Check if a timetable table (.tabela) exists in the provided HTML
    const tableRegex = /<table[^>]*class="[^"]*\btabela\b[^"]*"[^>]*>/i;
    if (!tableRegex.test(html)) {
       return NextResponse.json({ error: 'Could not find a timetable table (.tabela) in the provided HTML.' }, { status: 400 });
    }

    // Pass the HTML as Table constructor expects a string
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

                return {
                    ...lesson,
                    className,
                    groupName,
                    subject
                };
            });
        });
    });

    // Extract title using regex instead of JSDOM
    let extractedTitle = 'Timetable';
    const titleRegex = /<span[^>]*class="[^"]*\btytulnapis\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i;
    const titleMatch = html.match(titleRegex);
    if (titleMatch && titleMatch[1]) {
        // Simple HTML decoding/cleaning for common entities if needed, though raw content should be ok for simple text
        extractedTitle = titleMatch[1].trim().replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '');
    }

    const timetableData = {
        title: extractedTitle,
        days,
        hours: parser.getHours(),
    };

    return NextResponse.json(timetableData);
  } catch (error: any) {
    console.error('Error fetching/parsing timetable:', error);
    return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 });
  }
}
