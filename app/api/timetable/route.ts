import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Table } from '@wulkanowy/timetable-parser';

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
    const timetableData = {
        title: dom.window.document.querySelector('.tytulnapis')?.textContent || 'Timetable',
        days: parser.getDays(),
        hours: parser.getHours(),
    };

    return NextResponse.json(timetableData);
  } catch (error: any) {
    console.error('Error fetching/parsing timetable:', error);
    return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 });
  }
}
