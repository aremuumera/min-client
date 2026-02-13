'use client';

import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { CloudArrowUp as CloudArrowUpIcon } from '@phosphor-icons/react/dist/ssr/CloudArrowUp';
import { useDropzone } from 'react-dropzone';

interface FileDropzoneProps {
  caption?: string;
  [key: string]: any;
}

export function FileDropzone({ caption, ...props }: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone(props);

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          alignItems: 'center',
          border: '1px dashed var(--mui-palette-divider)',
          borderRadius: 1,
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          outline: 'none',
          p: 6,
          ...(isDragActive && { bgcolor: 'var(--mui-palette-action-selected)', opacity: 0.5 }),
          '&:hover': { ...(!isDragActive && { bgcolor: 'var(--mui-palette-action-hover)' }) },
        }}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar
            className="w-16 h-16 bg-white shadow-lg text-gray-900"
          >
            <CloudArrowUpIcon className="text-2xl" />
          </Avatar>
          <Stack spacing={1}>
            <Typography variant="h6">
              <span className="underline">
                Click to upload
              </span>{' '}
              or drag and drop
            </Typography>
            {caption ? (
              <Typography color="text.secondary" variant="body2">
                {caption}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
