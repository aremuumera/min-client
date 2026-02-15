'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { Stack } from '@/components/ui/stack';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <Box className="flex h-[50vh] flex-col items-center justify-center p-8 text-center">
            <Stack spacing={4} className="items-center max-w-md">
                <Typography variant="h4" className="font-bold">
                    Something went wrong!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    We encountered an unexpected error while loading this page.
                </Typography>
                <Button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    variant="contained"
                >
                    Try again
                </Button>
            </Stack>
        </Box>
    );
}
