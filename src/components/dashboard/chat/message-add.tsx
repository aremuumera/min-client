'use client';

import * as React from 'react';
import {
  Avatar,
  IconButton,
  Stack,
  Input,
  Tooltip,
  CircularProgress
} from '@/components/ui';

import { Paperclip as PaperclipIcon } from '@phosphor-icons/react/dist/ssr/Paperclip';
import { PaperPlaneTilt as PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { useSelector } from 'react-redux';

import { ChatContext } from '@/providers/chat-provider';
import { generateTextAvatar, stringToColor } from './message-box';

interface MessageAddProps {
  disabled?: boolean;
  onSend?: (type: string, content: any) => void;
}

export function MessageAdd({ disabled = false, onSend }: MessageAddProps) {
  const [content, setContent] = React.useState('');
  const [rows, setRows] = React.useState(1); // Start with single line
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useSelector((state: any) => state.auth);
  const { uploadAttachment, loadingMessages, loadingAttachments } = React.useContext(ChatContext);
  const [isUploading, setIsUploading] = React.useState(false);
  const userName = `${user?.businessName || ''}`;

  const avatarBgColor = stringToColor(userName || '');
  const textAvatar = generateTextAvatar(userName);

  const handleAttach = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setContent(value);

    // Calculate number of rows needed
    const lineCount = value.split('\n').length;
    setRows(Math.min(Math.max(lineCount, 1), 4)); // Limit to 4 rows max
  }, []);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      try {
        setIsUploading(true);
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const attachment = await uploadAttachment?.(file);
          if (attachment) {
            onSend?.('file', attachment);
          }
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onSend, uploadAttachment]
  );

  const handleSend = React.useCallback(() => {
    if (!content.trim()) return;

    onSend?.('text', content);
    setContent('');
    setRows(1); // Reset to single line after send
  }, [content, onSend]);

  const handleKeyUp = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.code === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent default line break
        handleSend();
      }
      // Shift+Enter will allow line breaks
    },
    [handleSend]
  );

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default behavior
    }
  }, []);

  return (
    <Stack
      direction="row"
      spacing={2}
      className="items-end flex-none px-6 py-2 min-h-[72px]"
    >
      <Avatar
        className="hidden sm:flex mb-1"
        style={{
          backgroundColor: avatarBgColor,
          height: '36px',
          width: '36px',
          fontSize: 'var(--fontSize-sm)',
        }}
      >
        {textAvatar}
      </Avatar>

      <Input
        multiline
        rows={rows}
        disabled={disabled}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        placeholder="Leave a message"
        className="flex-auto text-[12px] py-2"
        style={{
          // Custom styles for the textarea if needed
          // @ts-ignore
          '& textarea': {
            resize: 'none',
            maxHeight: '120px',
            overflowY: 'auto !important',
          },
        }}
        value={content}
      />

      <Stack direction="row" spacing={1} className="items-center mb-1">
        <Tooltip content="Send">
          <span>
            <IconButton
              aria-label="Send message"
              variant="contained"
              disabled={!content.trim() || disabled}
              onClick={handleSend}
              className="bg-primary-500 text-white hover:bg-primary-600"
            >
              <PaperPlaneTiltIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip content="Attach file">
          <span>
            <IconButton
              aria-label="Attach file"
              disabled={disabled || isUploading || (loadingMessages && loadingAttachments)}
              onClick={handleAttach}
            >
              {isUploading || (loadingMessages && loadingAttachments) ? (
                <CircularProgress size={20} />
              ) : (
                <PaperclipIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <input
        hidden
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </Stack>
  );
}
