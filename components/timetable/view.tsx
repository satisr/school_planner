'use client';

import React, { useEffect, useState, useMemo, Fragment } from 'react';
import { TimetableData } from '@/types/timetable';
import { loadUserEdits, saveUserEdits, UserTimetableEdits, UserLessonEdit } from '@/lib/store';
import { LessonEditDialog } from './lesson-edit-dialog';
import { BreakEditDialog } from './break-edit-dialog';
import { ExportIcalDialog, IcalExportOptions } from './export-ical-dialog';
import { generateIcalContent, downloadIcalFile } from '@/lib/ical-export';
import {
    Card,
    CardHeader,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Box,
    Tabs,
    Tab,
    Stack
} from '@mui/material';

const DAYS_OF_WEEK = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export function TimetableView({ data }: { data: TimetableData | null }) {
    const [isMobile, setIsMobile] = useState(false);
    const [userEdits, setUserEdits] = useState<UserTimetableEdits>({ lessons: {}, breaks: {} });

    // Dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingLessonInfo, setEditingLessonInfo] = useState<{ dayIndex: number, timeIndex: number } | null>(null);

    const [breakDialogOpen, setBreakDialogOpen] = useState(false);
    const [editingBreakInfo, setEditingBreakInfo] = useState<{ dayIndex: number, timeIndex: number } | null>(null);

    const [exportIcalDialogOpen, setExportIcalDialogOpen] = useState(false);

    // We initialize it to null so we know when it hasn't been set yet (SSR or initial render)
    // Then we handle default tab logic. Alternatively, use a generic effect without the lint warning by moving it.
    // However, since it's only once on mount, we can use `setTimeout` or just keep it and disable the lint rule locally.
    const [tabValue, setTabValue] = useState(0); // default to Monday for SSR

    const [currentTimeInfo, setCurrentTimeInfo] = useState<{
        dayIndex: number;
        currentHourIndex: number | null;
        nextHourIndex: number | null;
    }>({ dayIndex: -1, currentHourIndex: null, nextHourIndex: null });

    useEffect(() => {
        if (data?.title) {
            setUserEdits(loadUserEdits(data.title));
        }
    }, [data?.title]);

    useEffect(() => {
        // Set initial tab to current day on client side to avoid hydration mismatch
        const currentDayIndex = new Date().getDay() - 1;
        if (currentDayIndex > 0 && currentDayIndex <= 4) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTabValue(currentDayIndex);
        }

        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!data) return;

        const updateTimeInfo = () => {
            const now = new Date();
            const currentDayIndex = now.getDay() - 1; // 0 for Monday, 6 for Sunday

            if (currentDayIndex < 0 || currentDayIndex > 4) {
                // Weekend
                setCurrentTimeInfo({ dayIndex: -1, currentHourIndex: null, nextHourIndex: null });
                return;
            }

            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            let currentHourIndex: number | null = null;
            let nextHourIndex: number | null = null;

            const hourEntries = Object.entries(data.hours);

            for (let i = 0; i < hourEntries.length; i++) {
                const [indexStr, hour] = hourEntries[i];
                const index = parseInt(indexStr);

                const [startH, startM] = hour.timeFrom.split(':').map(Number);
                const [endH, endM] = hour.timeTo.split(':').map(Number);
                const startTotal = startH * 60 + startM;
                const endTotal = endH * 60 + endM;

                if (currentMinutes >= startTotal && currentMinutes <= endTotal) {
                    currentHourIndex = index;
                    break;
                } else if (currentMinutes < startTotal && nextHourIndex === null) {
                    // This is the first lesson that starts after current time
                    nextHourIndex = index;
                }
            }

            setCurrentTimeInfo({
                dayIndex: currentDayIndex,
                currentHourIndex,
                nextHourIndex
            });
        };

        updateTimeInfo();
        const interval = setInterval(updateTimeInfo, 60000); // update every minute

        const handleExportIcalEvent = () => setExportIcalDialogOpen(true);
        window.addEventListener('export-ical', handleExportIcalEvent);

        return () => {
            clearInterval(interval);
            window.removeEventListener('export-ical', handleExportIcalEvent);
        };
    }, [data]);

    const handleGenerateIcal = (options: IcalExportOptions) => {
        if (!data) return;
        const icsContent = generateIcalContent(data, mergedDataDays, userEdits, options);
        if (icsContent) {
            downloadIcalFile(icsContent, `plan-lekcji-${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSaveLessonEdits = (edits: UserLessonEdit[]) => {
        if (!data || !editingLessonInfo) return;
        const { dayIndex, timeIndex } = editingLessonInfo;

        const newEdits = {
            ...userEdits,
            lessons: { ...userEdits.lessons }
        };

        if (!newEdits.lessons[dayIndex]) {
            newEdits.lessons[dayIndex] = {};
        } else {
             newEdits.lessons[dayIndex] = { ...newEdits.lessons[dayIndex] };
        }

        // Save the edits
        newEdits.lessons[dayIndex][timeIndex] = edits;

        setUserEdits(newEdits);
        saveUserEdits(data.title, newEdits);
    };

    const handleOpenEditDialog = (dayIndex: number, timeIndex: number) => {
        setEditingLessonInfo({ dayIndex, timeIndex });
        setEditDialogOpen(true);
    };

    const handleSaveBreakEdits = (edit: { note: string }) => {
        if (!data || !editingBreakInfo) return;
        const { dayIndex, timeIndex } = editingBreakInfo;

        const newEdits = {
            ...userEdits,
            breaks: { ...userEdits.breaks }
        };

        if (!newEdits.breaks[dayIndex]) {
            newEdits.breaks[dayIndex] = {};
        } else {
             newEdits.breaks[dayIndex] = { ...newEdits.breaks[dayIndex] };
        }

        if (!edit.note) {
            delete newEdits.breaks[dayIndex][timeIndex]; // remove if empty
        } else {
            newEdits.breaks[dayIndex][timeIndex] = edit;
        }

        setUserEdits(newEdits);
        saveUserEdits(data.title, newEdits);
    };

    const handleOpenBreakDialog = (dayIndex: number, timeIndex: number) => {
        setEditingBreakInfo({ dayIndex, timeIndex });
        setBreakDialogOpen(true);
    };

    const mergedDataDays = useMemo(() => {
        if (!data) return [];
        const newDays = [...data.days];

        // Deep copy to allow modifications
        const deepCopiedDays = newDays.map(day =>
            day ? day.map(timeSlot => timeSlot ? [...timeSlot] : null) : null
        );

        for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
            if (userEdits.lessons[dayIndex]) {
                const dayEdits = userEdits.lessons[dayIndex];
                Object.keys(dayEdits).forEach(timeIndexStr => {
                    const timeIndex = parseInt(timeIndexStr, 10);
                    const editedLessons = dayEdits[timeIndex];

                    if (!deepCopiedDays[dayIndex]) {
                        deepCopiedDays[dayIndex] = Array(Object.keys(data.hours).length).fill(null);
                    }

                    // deepCopiedDays[dayIndex] is definitely created above if it didn't exist
                    const dayTarget = deepCopiedDays[dayIndex]!;

                    if (!dayTarget[timeIndex] && editedLessons.length > 0) {
                         dayTarget[timeIndex] = [];
                    }

                    // For simplicity right now, if user edits exist for this slot, we completely replace the Wulkanowy lessons
                    // A better approach would be to match by some ID, but Wulkanowy doesn't always provide one.
                    const finalLessons = editedLessons.filter(l => !l.deleted).map(l => ({
                        subject: l.subject || '',
                        teacher: l.teacher || '',
                        room: l.room || '',
                        groupName: l.groupName || '',
                        className: l.className || '',
                        info: '',
                        infoCodes: []
                    }));

                    if (finalLessons.length === 0 && editedLessons.some(l => l.deleted)) {
                        dayTarget[timeIndex] = null;
                    } else if (finalLessons.length > 0) {
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         dayTarget[timeIndex] = finalLessons as any;
                    }
                });
            }
        }
        return deepCopiedDays;
    }, [data, userEdits]);

    if (!data) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderLesson = (lessons: any[] | null, dayIndex: number, timeIndex: number) => {
        if (!lessons || lessons.length === 0) {
            return (
                <Box
                    sx={{ height: '100%', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => handleOpenEditDialog(dayIndex, timeIndex)}
                >
                    <Typography variant="caption" color="text.secondary" fontStyle="italic">Brak</Typography>
                </Box>
            );
        }

        return (
            <Stack spacing={1} sx={{ height: '100%', cursor: 'pointer' }} onClick={() => handleOpenEditDialog(dayIndex, timeIndex)}>
                {lessons.map((lesson, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 1, bgcolor: 'action.hover', borderColor: 'divider', '&:hover': { bgcolor: 'action.selected' } }}>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                            {lesson.subject}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {lesson.teacher && <Chip size="small" variant="outlined" label={lesson.teacher} />}
                            {lesson.room && <Chip size="small" color="secondary" label={lesson.room} />}
                            {lesson.className && <Chip size="small" color="primary" label={lesson.className} />}
                            {lesson.groupName && <Chip size="small" color="error" label={lesson.groupName} />}
                        </Box>
                    </Paper>
                ))}
            </Stack>
        );
    };

    const renderDialogs = () => (
        <Box className="no-print">
            <LessonEditDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                onSave={handleSaveLessonEdits}
                initialLessons={editingLessonInfo ? (mergedDataDays[editingLessonInfo.dayIndex]?.[editingLessonInfo.timeIndex] || null) : null}
                dayName={editingLessonInfo ? DAYS_OF_WEEK[editingLessonInfo.dayIndex] : ''}
                hourName={editingLessonInfo && data ? Object.values(data.hours)[editingLessonInfo.timeIndex]?.number.toString() : ''}
            />

            <BreakEditDialog
                open={breakDialogOpen}
                onClose={() => setBreakDialogOpen(false)}
                onSave={handleSaveBreakEdits}
                initialBreak={editingBreakInfo ? (userEdits.breaks[editingBreakInfo.dayIndex]?.[editingBreakInfo.timeIndex] || null) : null}
            />

            <ExportIcalDialog
                open={exportIcalDialogOpen}
                onClose={() => setExportIcalDialogOpen(false)}
                onExport={handleGenerateIcal}
            />
        </Box>
    );

    if (isMobile) {
        return (
            <Card elevation={4} sx={{ borderRadius: 3 }}>
                <CardHeader
                    title={<Typography variant="h5" fontWeight="bold">{data.title}</Typography>}
                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: 2 }}
                />
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                                allowScrollButtonsMobile
                                aria-label="dni tygodnia"
                            >
                                {DAYS_OF_WEEK.map((day, idx) => (
                                    <Tab key={idx} label={day} sx={{ minWidth: 100 }} />
                                ))}
                            </Tabs>
                        </Box>

                        <Box sx={{ p: 2 }}>
                            {DAYS_OF_WEEK.map((_, dayIndex) => (
                                <CustomTabPanel key={dayIndex} value={tabValue} index={dayIndex}>
                                    <Stack spacing={2}>
                                        {Object.values(data.hours).map((hour, timeIndex) => {
                                            if (!mergedDataDays[dayIndex]) return null;

                                            const lessons = mergedDataDays[dayIndex][timeIndex];

                                            const actualHourKey = parseInt(Object.keys(data.hours)[timeIndex]);

                                            const isCurrentDay = currentTimeInfo.dayIndex === dayIndex;
                                            const isCurrentHour = isCurrentDay && currentTimeInfo.currentHourIndex === actualHourKey;
                                            const isNextHour = isCurrentDay && currentTimeInfo.currentHourIndex === null && currentTimeInfo.nextHourIndex === actualHourKey;

                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            let bgcolor: string | ((theme: any) => string) = 'background.paper';
                                            if (isCurrentHour) bgcolor = (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.16)' : 'primary.50';
                                            else if (isNextHour) bgcolor = (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 167, 38, 0.16)' : 'warning.50';

                                            const breakInfo = userEdits.breaks[dayIndex]?.[timeIndex];

                                            return (
                                                <Fragment key={timeIndex}>
                                                <Paper elevation={1} sx={{ display: 'flex', gap: 2, p: 2, borderRadius: 2, bgcolor }}>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: '60px',
                                                        borderRight: 1,
                                                        borderColor: 'divider',
                                                        pr: 2
                                                    }}>
                                                        <Typography variant="h6" fontWeight="bold" color="text.secondary">
                                                            {hour.number}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
                                                            {hour.timeFrom} - {hour.timeTo}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        {renderLesson(lessons, dayIndex, timeIndex)}
                                                    </Box>
                                                </Paper>

                                                {/* Break Row Mobile */}
                                                {timeIndex < Object.values(data.hours).length - 1 && (() => {
                                                    const nextHourObj = Object.values(data.hours)[timeIndex + 1];
                                                    const breakStartTime = hour.timeTo;
                                                    const breakEndTime = nextHourObj.timeFrom;

                                                    const [endH, endM] = breakStartTime.split(':').map(Number);
                                                    const [nextStartH, nextStartM] = breakEndTime.split(':').map(Number);

                                                    const duration = (nextStartH * 60 + nextStartM) - (endH * 60 + endM);
                                                    const breakTimeText = duration > 0 ? `${breakStartTime} - ${breakEndTime} (${duration} min)` : '';

                                                    return (
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                py: 0.5,
                                                                px: 2,
                                                                bgcolor: 'background.default',
                                                                borderRadius: 1,
                                                                my: 0.5,
                                                            }}
                                                        >
                                                            {breakTimeText && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {breakTimeText}
                                                                </Typography>
                                                            )}
                                                            <Box
                                                                className={breakInfo?.note ? '' : 'no-print'}
                                                                sx={{
                                                                    display: 'flex',
                                                                    justifyContent: 'flex-end',
                                                                    cursor: 'pointer',
                                                                    opacity: breakInfo?.note ? 1 : 0.5,
                                                                    '&:hover': { opacity: 1 }
                                                                }}
                                                                onClick={() => handleOpenBreakDialog(dayIndex, timeIndex)}
                                                            >
                                                                {breakInfo?.note ? (
                                                                    <Chip label={breakInfo.note} color="info" size="small" variant="outlined" />
                                                                ) : (
                                                                    <Typography variant="caption" color="text.disabled" sx={{ borderBottom: '1px dashed', borderColor: 'text.disabled' }}>
                                                                        + dodaj przerwę
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    );
                                                })()}
                                                </Fragment>
                                            );
                                        })}
                                    </Stack>
                                </CustomTabPanel>
                            ))}
                        </Box>
                    </Box>
                </CardContent>
                {renderDialogs()}
            </Card>
        );
    }

    return (
        <Card elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardHeader
                title={<Typography variant="h4" fontWeight="bold">{data.title}</Typography>}
                sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: 3 }}
            />
            <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
                <Table stickyHeader aria-label="plan lekcji tabela">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '60px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100' }}>Nr</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '120px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100' }}>Godziny</TableCell>
                            {DAYS_OF_WEEK.map(day => (
                                <TableCell key={day} align="center" sx={{ fontWeight: 'bold', minWidth: '200px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100', borderLeft: '1px solid', borderColor: 'divider' }}>
                                    {day}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.values(data.hours).map((hour, timeIndex) => (
                            <Fragment key={timeIndex}>
                            <TableRow hover>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.secondary', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
                                    {hour.number}
                                </TableCell>
                                <TableCell align="center" sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
                                    <Typography variant="body2" fontWeight="medium">{hour.timeFrom}</Typography>
                                    <Typography variant="caption" color="text.secondary">{hour.timeTo}</Typography>
                                </TableCell>

                                {DAYS_OF_WEEK.map((_, dayIndex) => {
                                    const lessons = mergedDataDays[dayIndex]?.[timeIndex] || null;
                                    // timeIndex is string since it's an object key from Object.values(data.hours).map, wait, map index is number!
                                    // Object.values(data.hours).map((hour, timeIndex) => (...)) -> timeIndex is a number.
                                    // But earlier we used string logic. Let's trace it.

                                    // timeIndex parameter from map is actually a number, representing the index in the Object.values array.
                                    // However, currentTimeInfo.currentHourIndex stores the *key* from data.hours parsed as int.
                                    // Let's get the actual hour index correctly.
                                    // Object.keys(data.hours)[timeIndex] gives us the key.
                                    const actualHourKey = parseInt(Object.keys(data.hours)[timeIndex]);

                                    const isCurrentDay = currentTimeInfo.dayIndex === dayIndex;
                                    const isCurrentHour = isCurrentDay && currentTimeInfo.currentHourIndex === actualHourKey;
                                    const isNextHour = isCurrentDay && currentTimeInfo.currentHourIndex === null && currentTimeInfo.nextHourIndex === actualHourKey;

                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    let bgcolor: string | ((theme: any) => string) = 'inherit';
                                    if (isCurrentHour) bgcolor = (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.16)' : 'primary.50';
                                    else if (isNextHour) bgcolor = (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 167, 38, 0.16)' : 'warning.50';

                                    return (
                                        <TableCell key={dayIndex} sx={{ verticalAlign: 'top', borderLeft: '1px solid', borderColor: 'divider', p: 1.5, bgcolor, padding: 0 }}>
                                            <Box sx={{ p: 1.5, height: '100%', boxSizing: 'border-box' }}>
                                                {renderLesson(lessons, dayIndex, timeIndex)}
                                            </Box>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>

                            {/* Break Row Desktop */}
                            {timeIndex < Object.values(data.hours).length - 1 && (() => {
                                const nextHourObj = Object.values(data.hours)[timeIndex + 1];
                                const breakStartTime = hour.timeTo;
                                const breakEndTime = nextHourObj.timeFrom;

                                const [endH, endM] = breakStartTime.split(':').map(Number);
                                const [nextStartH, nextStartM] = breakEndTime.split(':').map(Number);

                                const duration = (nextStartH * 60 + nextStartM) - (endH * 60 + endM);
                                const breakTimeText = duration > 0 ? `${breakStartTime} - ${breakEndTime} (${duration} min)` : '';

                                return (
                                <TableRow>
                                    <TableCell colSpan={2} align="center" sx={{ p: 0.5, borderBottom: 'none', color: 'text.secondary' }}>
                                        {breakTimeText && (
                                            <Typography variant="caption" sx={{ display: 'block' }}>
                                                {breakTimeText}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                                        const breakInfo = userEdits.breaks[dayIndex]?.[timeIndex];
                                        return (
                                            <TableCell
                                                key={`break-${dayIndex}-${timeIndex}`}
                                                align="center"
                                                className={breakInfo?.note ? '' : 'no-print'}
                                                sx={{
                                                    p: 0.5,
                                                    borderLeft: '1px solid',
                                                    borderColor: 'divider',
                                                    cursor: 'pointer',
                                                    opacity: breakInfo?.note ? 1 : 0,
                                                    '&:hover': { opacity: 1 },
                                                    bgcolor: breakInfo?.note ? 'info.50' : 'transparent',
                                                    ...(breakInfo?.note && { borderTop: '1px solid', borderTopColor: 'info.200', borderBottom: '1px solid', borderBottomColor: 'info.200' })
                                                }}
                                                onClick={() => handleOpenBreakDialog(dayIndex, timeIndex)}
                                            >
                                                {breakInfo?.note ? (
                                                    <Typography variant="caption" fontWeight="bold" color="info.main">{breakInfo.note}</Typography>
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled" sx={{ borderBottom: '1px dashed', borderColor: 'text.disabled' }}>
                                                        + dodaj przerwę / dyżur
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                                );
                            })()}
                            </Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {renderDialogs()}
        </Card>
    );
}
