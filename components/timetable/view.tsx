'use client';

import { TimetableData } from '@/types/timetable';
import { useEffect, useState } from 'react';
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
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (!data) return null;

    const renderLesson = (lessons: any[] | null) => {
        if (!lessons || lessons.length === 0) return <Typography variant="caption" color="text.secondary" fontStyle="italic">Brak</Typography>;

        return (
            <Stack spacing={1}>
                {lessons.map((lesson, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 1, bgcolor: 'action.hover', borderColor: 'divider' }}>
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
                                            if (!data.days[dayIndex]) return null;

                                            const lessons = data.days[dayIndex][timeIndex];
                                            if (!lessons || lessons.length === 0) return null; // hide empty slots on mobile

                                            return (
                                                <Paper key={timeIndex} elevation={1} sx={{ display: 'flex', gap: 2, p: 2, borderRadius: 2 }}>
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
                                                        {renderLesson(lessons)}
                                                    </Box>
                                                </Paper>
                                            );
                                        })}

                                        {(!data.days[dayIndex] || data.days[dayIndex].every(l => !l || l.length === 0)) && (
                                            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                                                <Typography color="text.secondary">Brak zajęć w tym dniu</Typography>
                                            </Paper>
                                        )}
                                    </Stack>
                                </CustomTabPanel>
                            ))}
                        </Box>
                    </Box>
                </CardContent>
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
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '60px', bgcolor: 'grey.100' }}>Nr</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '120px', bgcolor: 'grey.100' }}>Godziny</TableCell>
                            {DAYS_OF_WEEK.map(day => (
                                <TableCell key={day} align="center" sx={{ fontWeight: 'bold', minWidth: '200px', bgcolor: 'grey.100', borderLeft: '1px solid', borderColor: 'divider' }}>
                                    {day}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.values(data.hours).map((hour, timeIndex) => (
                            <TableRow key={timeIndex} hover>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.secondary', bgcolor: 'grey.50' }}>
                                    {hour.number}
                                </TableCell>
                                <TableCell align="center" sx={{ bgcolor: 'grey.50' }}>
                                    <Typography variant="body2" fontWeight="medium">{hour.timeFrom}</Typography>
                                    <Typography variant="caption" color="text.secondary">{hour.timeTo}</Typography>
                                </TableCell>

                                {DAYS_OF_WEEK.map((_, dayIndex) => {
                                    const lessons = data.days[dayIndex]?.[timeIndex] || null;
                                    return (
                                        <TableCell key={dayIndex} sx={{ verticalAlign: 'top', borderLeft: '1px solid', borderColor: 'divider', p: 1.5 }}>
                                            {renderLesson(lessons)}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
}
