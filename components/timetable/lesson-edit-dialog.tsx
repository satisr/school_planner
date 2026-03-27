import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Stack,
    IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { UserLessonEdit } from '@/lib/store';

interface LessonEditDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (edits: UserLessonEdit[]) => void;
    initialLessons: UserLessonEdit[] | null;
    dayName: string;
    hourName: string;
}

export function LessonEditDialog({ open, onClose, onSave, initialLessons, dayName, hourName }: LessonEditDialogProps) {
    const [lessons, setLessons] = useState<UserLessonEdit[]>([]);

    useEffect(() => {
        if (open) {
            if (initialLessons && initialLessons.length > 0) {
                // clone
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setLessons(initialLessons.map(l => ({ ...l })));
            } else {
                // start with empty if no lessons exist
                setLessons([]);
            }
        }
    }, [open, initialLessons]);

    const handleLessonChange = (index: number, field: keyof UserLessonEdit, value: string) => {
        const newLessons = [...lessons];
        newLessons[index] = { ...newLessons[index], [field]: value };
        setLessons(newLessons);
    };

    const handleDeleteLesson = (index: number) => {
        const newLessons = [...lessons];
        newLessons[index] = { ...newLessons[index], deleted: true };
        setLessons(newLessons);
    };

    const handleAddLesson = () => {
        setLessons([...lessons, { subject: '', isNew: true }]);
    };

    const handleSave = () => {
        onSave(lessons);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Edycja lekcji
                <Typography variant="caption" display="block" color="text.secondary">
                    {dayName}, godz. {hourName}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    {lessons.map((lesson, idx) => {
                        if (lesson.deleted) return null;

                        return (
                            <Box key={idx} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, position: 'relative' }}>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteLesson(idx)}
                                    sx={{ position: 'absolute', top: 4, right: 4 }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="subtitle2" sx={{ mb: 2 }}>Grupa {idx + 1}</Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Przedmiot"
                                        size="small"
                                        fullWidth
                                        value={lesson.subject || ''}
                                        onChange={(e) => handleLessonChange(idx, 'subject', e.target.value)}
                                    />
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Nauczyciel"
                                            size="small"
                                            fullWidth
                                            value={lesson.teacher || ''}
                                            onChange={(e) => handleLessonChange(idx, 'teacher', e.target.value)}
                                        />
                                        <TextField
                                            label="Sala"
                                            size="small"
                                            fullWidth
                                            value={lesson.room || ''}
                                            onChange={(e) => handleLessonChange(idx, 'room', e.target.value)}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Klasa"
                                            size="small"
                                            fullWidth
                                            value={lesson.className || ''}
                                            onChange={(e) => handleLessonChange(idx, 'className', e.target.value)}
                                        />
                                        <TextField
                                            label="Grupa (nazwa)"
                                            size="small"
                                            fullWidth
                                            value={lesson.groupName || ''}
                                            onChange={(e) => handleLessonChange(idx, 'groupName', e.target.value)}
                                        />
                                    </Box>
                                    <TextField
                                        label="Notatka / Informacja (np. odwołane, zastępstwo)"
                                        size="small"
                                        fullWidth
                                        value={lesson.note || ''}
                                        onChange={(e) => handleLessonChange(idx, 'note', e.target.value)}
                                    />
                                </Stack>
                            </Box>
                        );
                    })}

                    <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAddLesson} fullWidth>
                        Dodaj lekcję / grupę
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Anuluj</Button>
                <Button onClick={handleSave} variant="contained" color="primary">Zapisz</Button>
            </DialogActions>
        </Dialog>
    );
}
