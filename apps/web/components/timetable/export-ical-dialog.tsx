import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Box
} from '@mui/material';

interface ExportIcalDialogProps {
    open: boolean;
    onClose: () => void;
    onExport: (options: IcalExportOptions) => void;
}

export interface IcalExportOptions {
    recurrenceType: 'none' | 'count' | 'until';
    count?: number;
    untilDate?: string;
    interval: number; // np. co ile tygodni (1 = co tydzień)
}

export function ExportIcalDialog({ open, onClose, onExport }: ExportIcalDialogProps) {
    const [recurrenceType, setRecurrenceType] = useState<'none' | 'count' | 'until'>('count');
    const [count, setCount] = useState<number>(10);
    const [untilDate, setUntilDate] = useState<string>('');
    const [interval, setIntervalVal] = useState<number>(1);

    const handleExport = () => {
        onExport({
            recurrenceType,
            count: recurrenceType === 'count' ? count : undefined,
            untilDate: recurrenceType === 'until' ? untilDate : undefined,
            interval
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Opcje eksportu do iCal</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControl>
                        <FormLabel>Zasięg eksportu</FormLabel>
                        <RadioGroup
                            value={recurrenceType}
                            onChange={(e) => setRecurrenceType(e.target.value as any)}
                        >
                            <FormControlLabel value="none" control={<Radio />} label="Tylko obecny tydzień (bez powtórzeń)" />
                            <FormControlLabel value="count" control={<Radio />} label="Powtarzaj określoną liczbę razy" />
                            {recurrenceType === 'count' && (
                                <Box sx={{ ml: 4, mb: 1 }}>
                                    <TextField
                                        type="number"
                                        label="Liczba tygodni"
                                        size="small"
                                        value={count}
                                        onChange={(e) => setCount(parseInt(e.target.value))}
                                        inputProps={{ min: 1 }}
                                    />
                                </Box>
                            )}
                            <FormControlLabel value="until" control={<Radio />} label="Powtarzaj do konkretnej daty" />
                            {recurrenceType === 'until' && (
                                <Box sx={{ ml: 4, mb: 1 }}>
                                    <TextField
                                        type="date"
                                        size="small"
                                        value={untilDate}
                                        onChange={(e) => setUntilDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                            )}
                        </RadioGroup>
                    </FormControl>

                    <FormControl>
                        <FormLabel>Częstotliwość</FormLabel>
                        <RadioGroup
                            value={interval}
                            onChange={(e) => setIntervalVal(parseInt(e.target.value))}
                            row
                        >
                            <FormControlLabel value={1} control={<Radio />} label="Co tydzień" />
                            <FormControlLabel value={2} control={<Radio />} label="Co 2 tygodnie" />
                        </RadioGroup>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Anuluj</Button>
                <Button onClick={handleExport} variant="contained" color="primary">
                    Pobierz iCal
                </Button>
            </DialogActions>
        </Dialog>
    );
}
