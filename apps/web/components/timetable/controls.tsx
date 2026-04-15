'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    CircularProgress,
    Stack
} from '@mui/material';
import { TimetableList, TimetableData } from '@/types/timetable';

export function TimetableControls({
    onDataFetched,
    onListFetched,
    listData,
    loading
}: {
    onDataFetched: (data: TimetableData | null) => void;
    onListFetched: (data: TimetableList | null) => void;
    listData: TimetableList | null;
    loading: boolean;
}) {
    const [url, setUrl] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<'classes' | 'teachers' | 'rooms'>('classes');

    const handleFetchUrl = async () => {
        if (!url) return;
        setLocalLoading(true);
        onListFetched(null);
        onDataFetched(null);

        try {
            // First check if it's a direct plan URL (e.g., ends with .html but not index/lista)
            if (url.match(/plany\/[a-z0-9]+\.html$/)) {
                const res = await fetch(`/api/timetable?url=${encodeURIComponent(url)}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                onDataFetched(data);
            } else {
                // Otherwise try fetching list
                const res = await fetch(`/api/timetable/list?url=${encodeURIComponent(url)}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                onListFetched(data);
            }
        } catch (error) {
            console.error(error);
            alert('Nie udało się załadować. Sprawdź adres URL.');
        } finally {
            setLocalLoading(false);
        }
    };

    const handleSelectTimetable = async (value: string | null) => {
        if (!value || !listData?.urlBase) return;
        setLocalLoading(true);
        onDataFetched(null);
        try {
            const targetUrl = listData.urlBase + value;
            const res = await fetch(`/api/timetable?url=${encodeURIComponent(targetUrl)}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            onDataFetched(data);
        } catch (error) {
            console.error(error);
            alert('Nie udało się załadować planu lekcji.');
        } finally {
            setLocalLoading(false);
        }
    };

    const isLoading = loading || localLoading;

    return (
        <Card elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
            <CardHeader
                title={<Typography variant="h5" fontWeight="bold">Wybierz plan</Typography>}
                sx={{ pb: 0 }}
            />
            <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                    <TextField
                        fullWidth
                        label="Wklej adres (np. https://www.pceikz.pl/pliki/planlekcji/index.html)"
                        variant="outlined"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isLoading}
                        size="medium"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleFetchUrl}
                        disabled={!url || isLoading}
                        sx={{ minWidth: { sm: '120px' }, height: { xs: '48px', sm: 'auto' } }}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isLoading ? 'Ładowanie' : 'Pobierz'}
                    </Button>
                </Stack>

                {listData && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                            <FormControl fullWidth sx={{ flex: 1 }}>
                                <InputLabel id="type-select-label">Wybierz typ</InputLabel>
                                <Select
                                    labelId="type-select-label"
                                    value={selectedType}
                                    label="Wybierz typ"
                                    onChange={(e) => setSelectedType(e.target.value as any)}
                                >
                                    <MenuItem value="classes">Klasy</MenuItem>
                                    <MenuItem value="teachers">Nauczyciele</MenuItem>
                                    <MenuItem value="rooms">Sale</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ flex: 2 }}>
                                <InputLabel id="plan-select-label">Wybierz plan</InputLabel>
                                <Select
                                    labelId="plan-select-label"
                                    label="Wybierz plan"
                                    defaultValue=""
                                    onChange={(e) => handleSelectTimetable(e.target.value as string)}
                                >
                                    {(listData[selectedType] || []).map((item) => (
                                        <MenuItem key={item.value} value={item.value}>
                                            {item.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
