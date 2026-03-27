import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton
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
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setNote(initialBreak?.note || '');
        }
    }, [open, initialBreak]);

    const handleSave = () => {
        onSave({ note: note.trim() });
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm("Czy na pewno chcesz usunąć tę przerwę/notatkę?")) {
            onSave({ note: '' });
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Edycja przerwy / Notatka
                {initialBreak?.note && (
                    <IconButton edge="end" color="error" onClick={handleDelete} title="Usuń przerwę">
                        <DeleteIcon />
                    </IconButton>
                )}
            </DialogTitle>
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
