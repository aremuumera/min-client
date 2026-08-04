'use client';

import * as React from 'react';
import {
  IconButton,
  Stack,
  Tooltip,
  CircularProgress
} from '@/components/ui';
import { toast } from 'sonner';

import { Paperclip as PaperclipIcon } from '@phosphor-icons/react/dist/ssr/Paperclip';
import { PaperPlaneTilt as PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';

import { ChatContext } from '@/providers/chat-provider';

interface MessageAddProps {
  disabled?: boolean;
  onSend?: (type: string, content: any) => void;
}

export function MessageAdd({ disabled = false, onSend }: MessageAddProps) {
  const [content, setContent] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { uploadAttachment, loadingMessages, loadingAttachments } = React.useContext(ChatContext);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleAttach = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const adjustTextareaHeight = React.useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const calculatedHeight = Math.min(el.scrollHeight, 100);
      el.style.height = `${Math.max(calculatedHeight, 36)}px`;
    }
  }, []);

  const handleChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = event.target.value;
    setContent(val);
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

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
      } catch (error: any) {
        console.error('Error uploading file:', error);
        toast.error(error?.message || 'Failed to upload one or more files. Please check your connection or file size.');
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
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }
  }, [content, onSend]);

  return (
    <Stack
      direction="row"
      spacing={1}
      className="items-end flex-none px-2.5 sm:px-4 py-1.5 min-h-[48px] bg-white border-t border-gray-200"
    >
      <Tooltip content="Attach file">
        <span>
          <IconButton
            aria-label="Attach file"
            disabled={disabled || isUploading || (loadingMessages && loadingAttachments)}
            onClick={handleAttach}
            className="mb-0.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 shrink-0"
          >
            {isUploading || (loadingMessages && loadingAttachments) ? (
              <CircularProgress size={18} />
            ) : (
              <PaperclipIcon size={20} weight="bold" />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <textarea
        ref={textareaRef}
        rows={1}
        disabled={disabled}
        value={content}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type your message here..."
        className="flex-auto text-xs sm:text-sm py-2 px-3 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:outline-none rounded-xl resize-none min-h-[36px] max-h-[100px] overflow-y-auto leading-relaxed transition-all duration-100"
        style={{ height: '36px' }}
      />

      <Stack direction="row" spacing={1} className="items-center mb-0.5 shrink-0">
        <Tooltip content="Send">
          <span>
            <IconButton
              aria-label="Send message"
              variant="contained"
              disabled={!content.trim() || disabled}
              onClick={handleSend}
              className="bg-emerald-600 text-white hover:bg-emerald-700 transition-all rounded-xl h-[36px] w-[36px] shrink-0"
            >
              <PaperPlaneTiltIcon weight="fill" size={16} />
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
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />
    </Stack>
  );
}

export default MessageAdd;
