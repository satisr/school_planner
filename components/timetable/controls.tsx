'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimetableList, TimetableData } from '@/types/timetable';
import { Loader2 } from 'lucide-react';

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
            alert('Failed to load. Please check the URL.');
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
            alert('Failed to load timetable.');
        } finally {
            setLocalLoading(false);
        }
    };

    const isLoading = loading || localLoading;

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Plan lekcji</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        placeholder="Wklej adres (np. https://www.pceikz.pl/pliki/planlekcji/index.html)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button onClick={handleFetchUrl} disabled={!url || isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Pobierz'}
                    </Button>
                </div>

                {listData && (
                    <div className="flex flex-col sm:flex-row gap-4 mt-4 bg-muted/50 p-4 rounded-lg">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-1 block">Wybierz typ:</label>
                            <Select value={selectedType} onValueChange={(val: any) => setSelectedType(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="classes">Klasy</SelectItem>
                                    <SelectItem value="teachers">Nauczyciele</SelectItem>
                                    <SelectItem value="rooms">Sale</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-[2]">
                            <label className="text-sm font-medium mb-1 block">Wybierz plan:</label>
                            <Select onValueChange={handleSelectTimetable}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(listData[selectedType] || []).map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
