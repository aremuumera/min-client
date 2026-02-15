import * as React from 'react';
import { Box, Typography } from '@/components/ui';

export default function ChatPage() {
  return (
    <Box className="flex flex-col items-center justify-center flex-auto h-full">
      <Typography variant="h6" color="textSecondary">
        Select a conversation to start messaging
      </Typography>
    </Box>
  );
}
