import { notFound } from 'next/navigation';
import { Gallery } from './gallery';

/*
 * Component gallery — every design-system component in its states, at any screen size.
 * Development only (404 in production). Used for review and by the Playwright checks.
 */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Gallery />;
}
