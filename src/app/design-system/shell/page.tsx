import { notFound } from 'next/navigation';
import { ShellPreview } from './shell-preview';

/* The merchant shell (sidebar + top bar) with a demo supplier. Development only (404 in production). */
export default function ShellPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ShellPreview />;
}
