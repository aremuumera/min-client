import Link from 'next/link';
import { Button, NoAccess } from '@/components/ui';
import { paths } from '@/config/paths';
import { Logo } from '@/utils/logo';

export const metadata = { title: 'No access | MINMEG' };

/** Where AuthGuard sends a role-blocked page (e.g. a buyer opening supplier tools) */
export default function NotAuthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <Logo height={48} />
      <NoAccess
        title="This page isn't part of your account"
        description="Your account type doesn't include this area. If you need it, ask your account owner or MINMEG support."
        action={
          <Button asChild variant="contained">
            <Link href={paths.dashboard.overview}>Back to dashboard</Link>
          </Button>
        }
      />
    </main>
  );
}
