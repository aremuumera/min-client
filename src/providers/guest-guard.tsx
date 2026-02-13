import React, { useEffect } from 'react';
import { paths } from '@/config/paths';
import { useAppSelector } from '@/redux/hooks';
import { useRouter } from 'next/navigation';

export function GuestGuard({ children }: any) {
  const router = useRouter();
  const { isAuth } = useAppSelector((state) => state.auth);

  // If user is authenticated, redirect to a protected route (e.g., dashboard)
  useEffect(() => {
    if (isAuth) {
      router.replace(paths.dashboard.overview);
    }
  }, [isAuth, router]);

  if (isAuth) {
    return null;
  }

  return <React.Fragment>{children}</React.Fragment>;
}
