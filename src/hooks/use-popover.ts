'use client';

import * as React from 'react';

export function usePopover<T extends HTMLElement = HTMLElement>() {
    const anchorRef = React.useRef<T | null>(null);
    const [open, setOpen] = React.useState(false);

    const handleOpen = React.useCallback(() => {
        setOpen(true);
    }, []);

    const handleClose = React.useCallback(() => {
        setOpen(false);
    }, []);

    const handleToggle = React.useCallback(() => {
        setOpen((prevState) => !prevState);
    }, []);

    return { anchorRef, handleClose, handleOpen, handleToggle, open };
}
