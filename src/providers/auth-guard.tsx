'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useAppCheckQuery } from '@/redux/features/AuthFeature/auth_api_rtk';
import { logout, setRequestedLocation } from '@/redux/features/AuthFeature/auth_slice';
import { paths, requiresVerification, isPublicRoute } from '@/config/paths';
import { Modal, ModalHeader, ModalBody, Button, Box } from '@/components/ui';
import { jwtDecode } from 'jwt-decode';
import { firebaseAuthService } from '@/lib/firebase';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { requestedLocation, isAuth, user, appData, isInitialized, token } = useAppSelector(
    (state) => state.auth
  );
  const firebaseToken = useAppSelector((state) => state.auth.numb);

  // AppCheck (refresh token)
  const { isLoading, isError, refetch, isUninitialized } = useAppCheckQuery(undefined,
    {
      skip: typeof window === 'undefined' || !localStorage.getItem('chimpstate'),
    }
  );

  const isBusinessVerified = appData?.businessVerification?.isVerified;
  const [showProfileModal, setShowProfileModal] = React.useState(false);

  // Sign into Firebase Auth when custom token is available
  const firebaseSignedIn = React.useRef(false);
  React.useEffect(() => {
    if (firebaseToken && !firebaseSignedIn.current) {
      firebaseSignedIn.current = true;
      firebaseAuthService.signInWithCustomToken(firebaseToken)
        .then((user) => {
          console.log('✅ Firebase Auth signed in:', user?.uid);
        })
        .catch((err) => {
          console.error('❌ Firebase Auth sign-in failed:', err);
          firebaseSignedIn.current = false; // Allow retry
        });
    }
    if (!firebaseToken) {
      firebaseSignedIn.current = false;
    }
  }, [firebaseToken]);

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
    // Not authenticated or user data missing
    if (!isAuth || !user) {
      if (isPublicRoute(pathname)) return; // Allow public routes for guests

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

    // Supplier is verified but hasn't created store profile yet — block all routes
    // except overview and the profile creation page
    const userRole = user?.role;
    const isSupplierProfileCreated = appData?.isProfileCreated;
    const allowedWithoutProfile = [
      paths.dashboard.overview,
      paths.dashboard.products.companyProfile,
      paths.dashboard.settings.account,
    ];
    const isOnAllowedRoute = allowedWithoutProfile.some((route) => pathname.startsWith(route));

    if (
      isBusinessVerified &&
      userRole === 'supplier' &&
      !isSupplierProfileCreated &&
      !isOnAllowedRoute
    ) {
      setShowProfileModal(true);
      router.replace(paths.dashboard.overview);
      return;
    }

    // --- Role-Based Route Protection ---
    const supplierOnlyRoutes = [
      paths.dashboard.products.list, // /dashboard/supplier-list
      '/dashboard/received-inquiries'
    ];

    const buyerOnlyRoutes = [
      paths.dashboard.rfqs.list, // /dashboard/rfq-list
      '/dashboard/my-trade-inquiries'
    ];

    const inspectorOnlyRoutes = [
      '/dashboard/inspections'
    ];

    const isSupplierRoute = supplierOnlyRoutes.some(route => pathname.startsWith(route));
    const isBuyerRoute = buyerOnlyRoutes.some(route => pathname.startsWith(route));
    const isInspectorRoute = inspectorOnlyRoutes.some(route => pathname.startsWith(route));

    // Buyers cannot access supplier or inspector tools
    if (userRole === 'buyer' && (isInspectorRoute)) {
      router.replace(paths.errors.notAuthorized);
      return;
    }

    // Suppliers cannot access buyer or inspector tools
    if (userRole === 'supplier' && (isInspectorRoute)) {
      router.replace(paths.errors.notAuthorized);
      return;
    }

    // Inspectors cannot access supplier tools, buyer tools, or the become-a-supplier flow
    if (
      userRole === 'inspector' &&
      (isSupplierRoute || isBuyerRoute || pathname.startsWith(paths.dashboard.becomeASupplier))
    ) {
      router.replace(paths.errors.notAuthorized);
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
    appData,
    isBusinessVerified,
    isLoading,
    isError,
  ]);

  const shouldShowLoader = !isInitialized || (isLoading && !isAuth);

  // If we don't have user data or app data yet AND we are authenticated, wait for it
  const isWaitingForUserData = isAuth && (!user || !appData);

  if (shouldShowLoader || isWaitingForUserData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
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
