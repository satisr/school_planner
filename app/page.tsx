'use client';

import { useState } from 'react';
import { TimetableControls } from '@/components/timetable/controls';
import { TimetableView } from '@/components/timetable/view';
import { TimetableData, TimetableList } from '@/types/timetable';

export default function Home() {
  const [data, setData] = useState<TimetableData | null>(null);
  const [listData, setListData] = useState<TimetableList | null>(null);

  return (
    <main className="container mx-auto p-4 md:p-8 min-h-screen">
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2 text-primary">
            Plan Lekcji
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Szybki i wygodny dostęp do Twojego planu zajęć.
          </p>
        </div>

        <TimetableControls
          onDataFetched={setData}
          onListFetched={setListData}
          listData={listData}
          loading={false}
        />

        {data && (
          <div className="mt-8">
            <TimetableView data={data} />
          </div>
        )}
      </div>
    </main>
  );
}
