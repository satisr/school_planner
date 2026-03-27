import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField
} from '@mui/material';
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
            <DialogActions>
                <Button onClick={onClose} color="inherit">Anuluj</Button>
                <Button onClick={handleSave} variant="contained" color="primary">Zapisz</Button>
            </DialogActions>
        </Dialog>
    );
}
