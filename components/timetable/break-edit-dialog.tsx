import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton,
    Tooltip,
    Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { UserBreakEdit } from '@/lib/store';

interface BreakEditDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (edit: UserBreakEdit) => void;
    initialBreak: UserBreakEdit | null;
}

export function BreakEditDialog({ open, onClose, onSave, initialBreak }: BreakEditDialogProps) {
    const [note, setNote] = useState('');

    useEffect(() => {
        if (open) {
            setNote(initialBreak?.note || '');
        }
    }, [open, initialBreak]);

    const handleSave = () => {
        onSave({ note: note.trim() });
        onClose();
    };

    const handleDelete = () => {
        onSave({ note: '' });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edycja przerwy / Notatka</DialogTitle>
            <DialogContent dividers>
                <TextField
                    autoFocus
                    label="Informacja (np. Dyżur: parter, korytarz)"
                    fullWidth
                    multiline
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    variant="outlined"
                />
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between' }}>
                <Box>
                    {initialBreak?.note && (
                        <Tooltip title="Usuń przerwę/dyżur">
                            <IconButton onClick={handleDelete} color="error" aria-label="usuń">
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
                <Box>
                    <Button onClick={onClose} color="inherit">Anuluj</Button>
                    <Button onClick={handleSave} variant="contained" color="primary" sx={{ ml: 1 }}>Zapisz</Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
