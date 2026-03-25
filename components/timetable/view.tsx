'use client';

import { TimetableData } from '@/types/timetable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

const DAYS_OF_WEEK = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];

export function TimetableView({ data }: { data: TimetableData | null }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!data) return null;

    const renderLesson = (lessons: any[] | null) => {
        if (!lessons || lessons.length === 0) return <div className="text-muted-foreground text-xs italic">Brak</div>;

        return (
            <div className="flex flex-col gap-2">
                {lessons.map((lesson, idx) => (
                    <div key={idx} className="bg-secondary/20 p-2 rounded-md border border-border/50 shadow-sm flex flex-col gap-1 text-sm">
                        <span className="font-semibold text-primary">{lesson.subject}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {lesson.teacher && <Badge variant="outline" className="text-xs">{lesson.teacher}</Badge>}
                            {lesson.room && <Badge variant="secondary" className="text-xs">{lesson.room}</Badge>}
                            {lesson.className && <Badge variant="default" className="text-xs">{lesson.className}</Badge>}
                            {lesson.groupName && <Badge variant="destructive" className="text-xs">{lesson.groupName}</Badge>}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (isMobile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">{data.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="0" className="w-full">
                        <ScrollArea className="w-full whitespace-nowrap pb-2">
                            <TabsList className="w-full justify-start h-12">
                                {DAYS_OF_WEEK.map((day, idx) => (
                                    <TabsTrigger key={idx} value={idx.toString()} className="min-w-[100px]">
                                        {day}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </ScrollArea>

                        {DAYS_OF_WEEK.map((_, dayIndex) => (
                            <TabsContent key={dayIndex} value={dayIndex.toString()} className="mt-4 space-y-4">
                                {Object.values(data.hours).map((hour, timeIndex) => {
                                    // Make sure we have enough days data
                                    if (!data.days[dayIndex]) return null;

                                    const lessons = data.days[dayIndex][timeIndex];
                                    if (!lessons || lessons.length === 0) return null; // hide empty slots on mobile

                                    return (
                                        <div key={timeIndex} className="flex gap-4 p-4 border rounded-xl shadow-sm bg-card">
                                            <div className="flex flex-col items-center justify-center min-w-[60px] border-r pr-4">
                                                <span className="text-lg font-bold text-muted-foreground">{hour.number}</span>
                                                <span className="text-xs whitespace-nowrap">{hour.timeFrom} - {hour.timeTo}</span>
                                            </div>
                                            <div className="flex-1">
                                                {renderLesson(lessons)}
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Show message if day is completely empty */}
                                {(!data.days[dayIndex] || data.days[dayIndex].every(l => !l || l.length === 0)) && (
                                    <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-xl">
                                        Brak zajęć w tym dniu
                                    </div>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full overflow-hidden shadow-lg border-t-4 border-t-primary">
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-2xl font-bold tracking-tight">{data.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="w-full max-h-[70vh] rounded-md">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[60px] text-center font-bold">Nr</TableHead>
                                <TableHead className="w-[120px] text-center font-bold">Godziny</TableHead>
                                {DAYS_OF_WEEK.map(day => (
                                    <TableHead key={day} className="min-w-[200px] text-center font-bold border-l">{day}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.values(data.hours).map((hour, timeIndex) => (
                                <TableRow key={timeIndex} className="hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-bold text-center text-muted-foreground bg-muted/10">{hour.number}</TableCell>
                                    <TableCell className="text-center text-xs whitespace-nowrap bg-muted/10">
                                        <div className="font-medium">{hour.timeFrom}</div>
                                        <div className="text-muted-foreground">{hour.timeTo}</div>
                                    </TableCell>

                                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                                        const lessons = data.days[dayIndex]?.[timeIndex] || null;
                                        return (
                                            <TableCell key={dayIndex} className="align-top border-l p-3">
                                                {renderLesson(lessons)}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
