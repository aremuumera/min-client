import { notFound } from 'next/navigation';
import { AccessPreview } from './access-preview';

/* The team-member sheet with demo data, as the owner and as a limited member. Development only (404 in production). */
export default function AccessPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <AccessPreview />;
}
