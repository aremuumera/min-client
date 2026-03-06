'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useAppCheckQuery } from '@/redux/features/AuthFeature/auth_api_rtk';
import { logoutAndCleanup, setRequestedLocation, setInitialized } from '@/redux/features/AuthFeature/auth_slice';
import { paths, requiresVerification, isPublicRoute } from '@/config/paths';
import { Modal, ModalHeader, ModalBody, Button, Box } from '@/components/ui';
import { jwtDecode } from 'jwt-decode';
import { firebaseAuthService } from '@/lib/firebase';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuth, user, appData, isInitialized, token } = useAppSelector(
    (state) => state.auth
  );
  const Token = localStorage.getItem('chimpstate') || token;
  const firebaseToken = useAppSelector((state) => state.auth.numb);

  // AppCheck (refresh Token)
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
          console.log(' Firebase Auth signed in:', user?.uid);
        })
        .catch((err) => {
          console.error(' Firebase Auth sign-in failed:', err);
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

  // Handle initialization when auth check is skipped (no token)
  React.useEffect(() => {
    if (isUninitialized && !isInitialized && typeof window !== 'undefined' && !localStorage.getItem('chimpstate')) {
      dispatch(setInitialized(true));
    }
  }, [isUninitialized, isInitialized, dispatch]);

  // Token expiration check
  React.useEffect(() => {
    if (!Token) return;

    const checkExpiry = () => {
      try {
        const decoded: any = jwtDecode(Token);
        // Check if Token is expired
        if (decoded.exp < Date.now() / 1000) {
          // console.log('called-5')

          dispatch(logoutAndCleanup() as any);
          router.replace(paths.auth.signIn);
        }
      } catch (e) {
        // console.log('called-4')
        dispatch(logoutAndCleanup() as any);
        router.replace(paths.auth.signIn);
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [Token, dispatch, router]);

  const handleCreateProfile = () => {
    const userRole = user?.role;
    if (userRole === 'inspector') {
      router.replace(paths.dashboard.inspections.setup);
    } else if (userRole === 'supplier') {
      router.replace(paths.dashboard.products.companyProfile);
    }
  };

  React.useEffect(() => {
    // Not authenticated or user data missing
    if (!isAuth || !user) {

      // Double check if we are still loading or initializing
      if (isLoading && !isAuth) return;

      // Only logout if we genuinely failed auth check and aren't just waiting
      if (isInitialized && !isAuth && !isLoading) {
        dispatch(logoutAndCleanup() as any);
        router.replace(paths.auth.signIn);
      }
      return;
    }

    // Authenticated but NOT verified trying to access verified route
    if (requiresVerification(pathname) && !isBusinessVerified) {
      router.replace(paths.errors.notFound);
      return;
    }

    // --- Profile Creation Guard ---
    const userRole = user?.role;
    const isProfileCreated = appData?.isProfileCreated;

    // Define allowed routes and target profile paths per role
    const profileConfig: Record<string, { allowed: string[]; target: string; title: string }> = {
      supplier: {
        allowed: [paths.dashboard.overview, paths.dashboard.products.companyProfile, paths.dashboard.settings.account],
        target: paths.dashboard.products.companyProfile,
        title: 'Supplier Profile'
      },
      inspector: {
        allowed: [paths.dashboard.overview, paths.dashboard.inspections.profile, paths.dashboard.inspections.setup, paths.dashboard.settings.account],
        target: paths.dashboard.inspections.setup,
        title: 'Inspector Profile'
      }
    };

    const config = profileConfig[userRole || ''];

    if (config && isBusinessVerified && !isProfileCreated) {
      const isOnTargetPage = pathname === config.target;

      if (!isOnTargetPage) {
        setShowProfileModal(true);
      } else {
        setShowProfileModal(false);
      }

      const isOnAllowedRoute = config.allowed.some((route) => {
        // Overview must be an exact match to prevent it from catching all /dashboard/* sub-routes
        if (route === paths.dashboard.overview) {
          return pathname === paths.dashboard.overview;
        }
        return pathname.startsWith(route);
      });

      if (!isOnAllowedRoute) {
        router.replace(paths.dashboard.overview);
        return;
      }
    } else {
      setShowProfileModal(false);
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

  }, [
    isAuth,
    isInitialized,
    pathname,
    dispatch,
    router,
    user,
    appData,
    isBusinessVerified,
    isLoading,
    isError,
  ]);

  // console.log('AuthGuard State:', { isAuth, user: !!user, isInitialized, isLoading, isUninitialized });

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
          onClose={() => { }} // Disable closing
          closeOnBackdropClick={false}
          closeOnEscape={false}
        >
          <ModalHeader showCloseButton={false}>Complete Your {user?.role === 'inspector' ? 'Inspector' : 'Supplier'} Profile</ModalHeader>
          <ModalBody>
            <Box className="py-2">
              <div className="mb-4 text-base font-semibold">
                Welcome! To start using the platform as {user?.role === 'inspector' ? 'an inspector' : 'a supplier'}, you need to complete your profile first.
              </div>
              <div className="text-sm text-neutral-600 mb-4">
                Your profile helps {user?.role === 'inspector' ? 'Min-meg and clients' : 'buyers'} understand your {user?.role === 'inspector' ? 'expertise and operational capacity' : 'business and the products or services you offer'}.
              </div>
              <div className="text-sm text-neutral-600">
                This process will only take a few minutes and includes:
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-neutral-600">
                {user?.role === 'inspector' ? (
                  <>
                    <li>Company branding (Logo & Banner)</li>
                    <li>Service Matrix & Pricing</li>
                    <li>Workload & Operational Limits</li>
                  </>
                ) : (
                  <>
                    <li>Business information</li>
                    <li>Product/Service details</li>
                    <li>Contact information</li>
                  </>
                )}
              </ul>
            </Box>
            <div className="mt-6 space-y-3">
              <Button onClick={handleCreateProfile} variant="contained" color="primary" className="w-full py-3 text-lg">
                Complete Setup Now
              </Button>
              <Button
                onClick={() => refetch()}
                variant="outlined"
                color="primary"
                className="w-full py-2 hover:bg-neutral-50 transition-colors"
                loading={isLoading}
              >
                I've Completed Setup (Check Status)
              </Button>
            </div>
          </ModalBody>
        </Modal>
        {children}
      </>
    );
  }

  // Not authenticated and initialized -> return null as we are redirecting
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50/50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
    </div>
  );
}
