'use client';

import * as React from 'react';

export function useDialog<T = any>() {
    const [state, setState] = React.useState<{ open: boolean; data?: T }>({
        open: false,
        data: undefined
    });

    const handleOpen = React.useCallback((data?: T) => {
        setState({ open: true, data });
    }, []);

    const handleClose = React.useCallback(() => {
        setState({ open: false, data: undefined });
    }, []);

    return { data: state.data, handleClose, handleOpen, open: state.open };
}
