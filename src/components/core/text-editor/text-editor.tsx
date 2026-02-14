'use client';

import * as React from 'react';
import { Box } from '@/components/ui/box';
import Link from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

import { TextEditorToolbar } from './text-editor-toolbar';

/**
 * A thin wrapper around tiptap.
 *
 * How to get the updated content:
 * ```ts
 * <TextEditor
 *   onUpdate={({ editor }) => {
 *     console.log(editor.getHTML());
 *   }}
 * />
 * ```
 */

interface TextEditorProps {
  content?: any;
  editable?: boolean;
  hideToolbar?: boolean;
  onUpdate?: (props: { editor: Editor }) => void;
  placeholder?: string;
}

export function TextEditor({
  content,
  editable = true,
  hideToolbar,
  onUpdate = () => {
    // noop
  },
  placeholder,
}: TextEditorProps) {
  const extensions = [
    StarterKit,
    Placeholder.configure({ emptyEditorClass: 'is-editor-empty', placeholder }),
    Link.configure({ openOnClick: false, autolink: true }),
    Underline,
  ];

  const editor = useEditor({ extensions, content, editable, onUpdate, immediatelyRender: false });

  return (
    <>
      <style>{`
        .tiptap-root .tiptap-container {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          min-height: 0;
        }
        .tiptap-root .tiptap {
          color: var(--mui-palette-text-primary);
          flex: 1 1 auto;
          overflow: auto;
          padding: 8px 16px;
        }
        .tiptap-root .tiptap:focus-visible {
          outline: none;
        }
        .tiptap-root .tiptap.resize-cursor {
          cursor: ew-resize;
        }
        .tiptap-root .tiptap.resize-cursor table {
          cursor: col-resize;
        }
        .tiptap-root .tiptap .is-editor-empty:before {
          color: var(--mui-palette-text-secondary);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointerEvents: none;
        }
      `}</style>
      <Box
        className="tiptap-root"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          ...(editable && {
            border: '1px solid var(--mui-palette-divider)',
            borderRadius: 1,
            boxShadow: 'var(--mui-shadows-1)',
          }),
        }}
      >
        {!hideToolbar ? <TextEditorToolbar editor={editor} /> : <div />}
        <EditorContent className="tiptap-container" editor={editor} />
      </Box>
    </>
  );
}
