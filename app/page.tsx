'use client';

import { useState } from 'react';
import { TimetableControls } from '@/components/timetable/controls';
import { TimetableView } from '@/components/timetable/view';
import { ExportMenu } from '@/components/timetable/export-menu';
import { TimetableData, TimetableList } from '@/types/timetable';
import { Container, Typography, Box, Stack } from '@mui/material';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';

export default function Home() {
  const [data, setData] = useState<TimetableData | null>(null);
  const [listData, setListData] = useState<TimetableList | null>(null);

  // Zostanie nadpisane przez komponent TimetableView
  const handleExportPdf = () => {
    window.print();
  };

  const handleExportIcal = () => {
    // Tymczasowo, zostanie obsłużone w TimetableView w celu pobrania mergedData
    const event = new CustomEvent('export-ical');
    window.dispatchEvent(event);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Image src="/logo.svg" alt="PlanItNow Logo" width={240} height={60} priority />
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                PlanItNow – Twój plan zajęć, zawsze pod ręką.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              {data && <ExportMenu onExportPdf={handleExportPdf} onExportIcal={handleExportIcal} />}
              <ThemeToggle />
            </Stack>
          </Box>

          <Box className="no-print">
            <TimetableControls
              onDataFetched={setData}
              onListFetched={setListData}
              listData={listData}
              loading={false}
            />
          </Box>

          {data && (
            <Box sx={{ mt: 2 }}>
              <TimetableView data={data} />
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
