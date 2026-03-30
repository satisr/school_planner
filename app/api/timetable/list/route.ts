import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { TimetableList } from '@wulkanowy/timetable-parser';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlStr = searchParams.get('url');

  if (!urlStr) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    let listUrl = urlStr;
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
       return NextResponse.json({ error: 'lista.html not found or invalid URL' }, { status: 404 });
    }

    const arrayBuffer = await response.arrayBuffer();

    let html = new TextDecoder('utf-8').decode(arrayBuffer);

    if (html.toLowerCase().includes('windows-1250')) {
        html = new TextDecoder('windows-1250').decode(arrayBuffer);
    } else if (html.toLowerCase().includes('iso-8859-2')) {
        html = new TextDecoder('iso-8859-2').decode(arrayBuffer);
    }

    const listParser = new TimetableList(html);
    const parsedList = listParser.getList();

    // The parser might return just IDs (e.g. '1', '2') as 'value' for select lists
    // We should fix them if they are just numbers, to 'plany/o1.html', 'plany/n1.html', 'plany/s1.html'
    // Actually, optivum parser returns raw option values or hrefs.
    // Let's ensure the frontend can build the URL properly.
    // Usually hrefs are like 'plany/o1.html' and select values are just '1'

    const formatValue = (item: any, prefix: string) => {
        if (!item) return [];
        return item.map((i: any) => {
            // If it's just numbers, map to standard optivum paths
            if (/^\d+$/.test(i.value)) {
                return { ...i, value: `plany/${prefix}${i.value}.html` };
            }
            return i;
        });
    };

    const listData = {
        classes: formatValue(parsedList.classes, 'o'),
        teachers: formatValue(parsedList.teachers, 'n'),
        rooms: formatValue(parsedList.rooms, 's'),
        urlBase: listUrl.substring(0, listUrl.lastIndexOf('/') + 1)
    };

    return NextResponse.json(listData);
  } catch (error: any) {
    console.error('Error fetching list:', error);
    return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 });
  }
}
