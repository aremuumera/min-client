'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
// import { AppCheck } from '@/redux/features/AuthFeature/auth_api'; // Removed thunk
import { useAppCheckQuery } from '@/redux/features/AuthFeature/auth_api_rtk'; // Added RTK hook
import { logout, setRequestedLocation } from '@/redux/features/AuthFeature/auth_slice';
import { paths, requiresVerification } from '@/config/paths';
import { Modal, ModalHeader, ModalBody, Button, Box } from '@/components/ui';
import { jwtDecode } from 'jwt-decode';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { requestedLocation, isAuth, user, appData, isInitialized, token } = useAppSelector(
    (state) => state.auth
  );

  // AppCheck (refresh token)
  const { isLoading, isError, refetch, isUninitialized } = useAppCheckQuery(undefined,
    {
      skip: typeof window === 'undefined' || !localStorage.getItem('chimpstate'),
    }
  );

  const isBusinessVerified = appData?.businessVerification?.isVerified;
  const [showProfileModal, setShowProfileModal] = React.useState(false);


  const lastRefetchTime = React.useRef<number>(0);

  React.useEffect(() => {
    const now = Date.now();
    // Only refetch on navigation if we are authenticated 
    // AND it has been more than 15 seconds since the last refresh
    // AND the query is initialized
    if (isAuth && !isUninitialized && now - lastRefetchTime.current > 15000) {
      lastRefetchTime.current = now;
      refetch();
    }
  }, [pathname, isAuth, refetch, isUninitialized]);

  // Token expiration check
  React.useEffect(() => {
    if (!token) return;

    const checkExpiry = () => {
      try {
        const decoded: any = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp < Date.now() / 1000) {
          console.log('called-5')

          dispatch(logout());
          router.replace(paths.auth.signIn);
        }
      } catch (e) {
        console.log('called-4')
        dispatch(logout());
        router.replace(paths.auth.signIn);
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [token, dispatch, router]);

  const handleCreateProfile = () => {
    setShowProfileModal(false);
    router.replace(paths.dashboard.products.companyProfile);
  };

  React.useEffect(() => {
    // If we are already authenticated from login, we don't need to wait for loading
    // unless we really aren't initialized
    if (!isInitialized && isLoading && !isAuth) return;

    // Not authenticated or user data missing
    if (!isAuth || !user) {
      // Double check if we are still loading or initializing
      if (isLoading && !isAuth) return;

      if (!requestedLocation) {
        dispatch(setRequestedLocation(pathname));
      }

      // Only logout if we genuinely failed auth check and aren't just waiting
      if (isInitialized && !isAuth && !isLoading) {
        dispatch(logout());
        router.replace(paths.auth.signIn);
      }
      return;
    }

    // Authenticated but NOT verified trying to access verified route
    if (requiresVerification(pathname) && !isBusinessVerified) {
      router.replace(paths.errors.notFound);
      return;
    }

    // Redirect to saved location after login
    if (requestedLocation) {
      const targetLocation = requestedLocation;
      dispatch(setRequestedLocation(null));
      router.replace(targetLocation);
      return;
    }
  }, [
    isAuth,
    isInitialized,
    requestedLocation,
    pathname,
    dispatch,
    router,
    user,
    isBusinessVerified,
    isLoading,
    isError,
  ]);

  if (!isInitialized || (isLoading && !isAuth)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (isAuth) {
    return (
      <>
        <Modal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        >
          <ModalHeader>Complete Your Supplier Profile</ModalHeader>
          <ModalBody>
            <Box className="py-2">
              <div className="mb-4 text-base">
                Welcome! To start using the platform as a supplier, you need to complete your profile first.
              </div>
              <div className="text-sm text-neutral-600 mb-4">
                Your profile helps buyers understand your business and the products or services you offer.
              </div>
              <div className="text-sm text-neutral-600">
                This process will only take a few minutes and includes:
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-neutral-600">
                <li>Business information</li>
                <li>Product/Service details</li>
                <li>Contact information</li>
              </ul>
            </Box>
            <div className="mt-6">
              <Button onClick={handleCreateProfile} variant="contained" color="primary" className="w-full py-3 text-lg">
                Create Profile Now
              </Button>
            </div>
          </ModalBody>
        </Modal>
        {children}
      </>
    );
  }

  // Not authenticated and initialized -> return null as we are redirecting
  return null;
}
