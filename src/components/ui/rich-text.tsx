import * as React from 'react';

/*
 * Shows text from the text editor with its formatting. It builds React elements from a short list
 * of known tags and treats everything else as plain text, so stored text can never run as HTML.
 */
const TAGS: Record<string, string> = {
  p: 'mb-2 last:mb-0',
  h1: 'mb-2 text-lg font-semibold',
  h2: 'mb-2 text-base font-semibold',
  h3: 'mb-2 text-sm font-semibold',
  ul: 'mb-2 list-disc pl-5',
  ol: 'mb-2 list-decimal pl-5',
  li: '',
  strong: 'font-semibold',
  b: 'font-semibold',
  em: 'italic',
  i: 'italic',
  u: 'underline',
  s: 'line-through',
  blockquote: 'mb-2 border-l-2 border-hairline-strong pl-3',
  code: 'font-mono text-[0.9em]',
  pre: 'mb-2 overflow-x-auto font-mono text-[0.9em]',
  a: 'text-brand-green-dark underline',
};
const TOKEN = /<(\/?)(p|h1|h2|h3|ul|ol|li|strong|b|em|i|u|s|blockquote|code|pre|a|br)(\s[^<>]*)?\/?>/gi;
const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&nbsp;': ' ' };
const decode = (text: string) => text.replace(/&(amp|lt|gt|quot|nbsp|#39|#x27);/g, (m) => ENTITIES[m] ?? m);
const safeHref = (attrs = '') => {
  const href = /href="([^"]*)"/i.exec(attrs)?.[1];
  return href && /^(https?:|mailto:)/i.test(decode(href)) ? decode(href) : undefined;
};

interface Frame {
  tag: string;
  href?: string;
  children: React.ReactNode[];
}

const close = (frame: Frame, key: number) =>
  React.createElement(frame.tag, { key, className: TAGS[frame.tag] || undefined, ...(frame.tag === 'a' ? { href: frame.href, target: '_blank', rel: 'noopener noreferrer' } : {}) }, ...frame.children);

export function richTextNodes(source: string): React.ReactNode[] {
  const root: Frame = { tag: '', children: [] };
  const stack = [root];
  let key = 0;
  let last = 0;
  const text = (value: string) => {
    if (value) stack[stack.length - 1].children.push(decode(value));
  };
  for (const match of source.matchAll(TOKEN)) {
    text(source.slice(last, match.index));
    last = match.index + match[0].length;
    const tag = match[2].toLowerCase();
    if (tag === 'br') {
      stack[stack.length - 1].children.push(<br key={key++} />);
    } else if (match[1]) {
      if (stack.some((f) => f.tag === tag)) {
        while (stack.length > 1) {
          const frame = stack.pop()!;
          stack[stack.length - 1].children.push(frame.tag === 'a' && !frame.href ? <React.Fragment key={key++}>{frame.children}</React.Fragment> : close(frame, key++));
          if (frame.tag === tag) break;
        }
      }
    } else {
      stack.push({ tag, href: tag === 'a' ? safeHref(match[3]) : undefined, children: [] });
    }
  }
  text(source.slice(last));
  while (stack.length > 1) {
    const frame = stack.pop()!;
    stack[stack.length - 1].children.push(frame.tag === 'a' && !frame.href ? <React.Fragment key={key++}>{frame.children}</React.Fragment> : close(frame, key++));
  }
  return root.children;
}

export function RichText({ text, className }: { text: string; className?: string }) {
  return <div className={`whitespace-pre-wrap break-words ${className ?? ''}`}>{richTextNodes(text)}</div>;
}
