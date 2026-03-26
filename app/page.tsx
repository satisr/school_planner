'use client';

import { useState } from 'react';
import { TimetableControls } from '@/components/timetable/controls';
import { TimetableView } from '@/components/timetable/view';
import { TimetableData, TimetableList } from '@/types/timetable';
import { Container, Typography, Box } from '@mui/material';

export default function Home() {
  const [data, setData] = useState<TimetableData | null>(null);
  const [listData, setListData] = useState<TimetableList | null>(null);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="h3" component="h1" fontWeight="800" color="primary" gutterBottom>
              Plan Lekcji
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Szybki i wygodny dostęp do Twojego planu zajęć.
            </Typography>
          </Box>

          <TimetableControls
            onDataFetched={setData}
            onListFetched={setListData}
            listData={listData}
            loading={false}
          />

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
