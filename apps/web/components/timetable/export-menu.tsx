import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EventIcon from '@mui/icons-material/Event';

interface ExportMenuProps {
    onExportPdf: () => void;
    onExportIcal: () => void;
}

export function ExportMenu({ onExportPdf, onExportIcal }: ExportMenuProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Button
                variant="outlined"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleClick}
            >
                Eksportuj
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={() => { handleClose(); onExportPdf(); }}>
                    <ListItemIcon>
                        <PictureAsPdfIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Eksportuj jako PDF</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { handleClose(); onExportIcal(); }}>
                    <ListItemIcon>
                        <EventIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Eksportuj jako iCal (.ics)</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}
