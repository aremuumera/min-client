'use client';

import * as React from 'react';

export function useSelection<T = string>(keys: T[] = []) {
    const [selected, setSelected] = React.useState<Set<T>>(new Set());

    React.useEffect(() => {
        setSelected(new Set());
    }, [keys]);

    const handleDeselectAll = React.useCallback(() => {
        setSelected(new Set());
    }, []);

    const handleDeselectOne = React.useCallback((key: T) => {
        setSelected((prev) => {
            const copy = new Set(prev);
            copy.delete(key);
            return copy;
        });
    }, []);

    const handleSelectAll = React.useCallback(() => {
        setSelected(new Set(keys));
    }, [keys]);

    const handleSelectOne = React.useCallback((key: T) => {
        setSelected((prev) => {
            const copy = new Set(prev);
            copy.add(key);
            return copy;
        });
    }, []);

    const selectedAny = selected.size > 0;
    const selectedAll = selected.size === keys.length;

    return {
        deselectAll: handleDeselectAll,
        deselectOne: handleDeselectOne,
        selectAll: handleSelectAll,
        selectOne: handleSelectOne,
        selected,
        selectedAny,
        selectedAll,
    };
}
