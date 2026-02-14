
export const paths = {
    home: '/',
    aboutUs: '/about-us',
    services: '/services',
    compliance: '/compliance',
    guides: '/guides',
    caseStudies: '/case-studies',
    faq: '/faq',
    contact: '/contact',
    escrow: '/escrow',
    serviceProviders: '/service-providers',
    pricing: '/pricing',
    ourPlans: '/our-plans',
    becomeASupplier: '/become-a-supplier',
    postYouRfq: '/post-your-rfq',
    rfq: (rfqId: string | number) => `/rfq/${rfqId}`,
    products: '/dashboard/products/all-mineral-cp',
    auth: {
        signIn: '/auth/sign-in',
        signUp: '/auth/sign-up',
        signUpConfirm: '/auth/sign-up-confirm',
        newPasswordRequired: '/auth/new-password-required',
        resetPassword: '/auth/reset-password',
        verifyCode: '/auth/verify-code',
    },
    company: {
        aboutUs: '/about-us',
        whatWeDo: 'what-we-do',
        ourTechnology: '/our-technology',
        ourStories: 'our-stories',
        career: '/career',
    },
    resources: {
        blog: '/blogs',
        blog_detail: (blogId: string | number) => `/blogs/${blogId}`,
        support: '/support',
        community: '/community',
    },
    errors: {
        notAuthorized: '/errors/not-authorized',
        notFound: '/errors/not-found',
        internalServerError: '/errors/internal-server-error',
    },

    //==================================== Errors route  =================================
    notAuthorized: '/errors/not-authorized',
    notFound: '/errors/not-found',
    internalServerError: '/errors/internal-server-error',

    //==================================== Market Place route  =================================
    marketplace: {
        products: '/dashboard/products/all-mineral-cp',
        allCp: '/dashboard/products/all-mineral-cp',
        // Granular category routes
        mainCategory: (mainCategoryId: string) => `/dashboard/products/all-mineral-cp/${mainCategoryId}`,
        subCategory: (mainCategoryId: string, subCategoryId: string) => `/dashboard/products/all-mineral-cp/${mainCategoryId}/${subCategoryId}`,
        subSubCategory: (mainCategoryId: string, subCategoryId: string, subSubCategoryId: string) => `/dashboard/products/all-mineral-cp/${mainCategoryId}/${subCategoryId}/${subSubCategoryId}`,

        recentRfQ: '/dashboard/products/rfq-products',
        companyProfile: (companyId: string | number) => `/dashboard/business/${companyId}`,
        product: (productId: string | number) => `/dashboard/products/details/${productId}/product`,
        productDetails: (productId: string | number, productName: string) => `/dashboard/products/details/${productId}/${productName}`,
        rfqDetails: (rfqId: string | number, rfqName: string) => `/dashboard/rfqs/details/${rfqId}/${rfqName}`,
    },

    //====================================   Dashboard route  =================================
    dashboard: {
        overview: '/dashboard',
        savedProducts: '/dashboard/saved-products',
        becomeASupplier: '/dashboard/become-a-supplier',
        companyInfoVerification: '/dashboard/company-info-verification',
        invoices: '/dashboard/invoices',
        settings: {
            account: '/dashboard/settings/account',
            notifications: '/dashboard/settings/notifications',
            security: '/dashboard/settings/security',
            business: '/dashboard/settings/business',
            legals: '/dashboard/settings/legals',
        },
        analytics: '/dashboard/analytics',
        chat: {
            base: '/dashboard/chat',
            compose: '/dashboard/chat/compose',
            thread: (threadType: string, threadId: string | number, itemId: string | number = '0') => `/dashboard/chat/${threadType}/${threadId}/${itemId}`,
        },
        notifications: '/dashboard/notifications',

        // supplier listing
        products: {
            list: '/dashboard/supplier-list',
            create: '/dashboard/supplier-list/create',
            update: '/dashboard/supplier-list/update',
            companyProfile: '/dashboard/supplier-list/company-profile/create',
        },
        // rfq listing
        rfqs: {
            list: '/dashboard/rfq-list',
            create: '/dashboard/rfq-list/create',
            update: (listedRfqId: string | number) => `/dashboard/rfq-list/update/${listedRfqId}`,
        },
    },

    waitlist: 'https://waitlist.minmeg.com/',
};

export const routeAccess = {
    // Routes that don't require authentication at all or verification
    public: [
        // general routes
        paths.home,
        paths.aboutUs,
        paths.services,
        paths.compliance,
        paths.guides,
        paths.caseStudies,
        paths.faq,
        paths.contact,
        paths.escrow,
        paths.serviceProviders,
        paths.pricing,
        paths.ourPlans,
        paths.becomeASupplier,
        paths.postYouRfq,
        // paths.product,
        paths.products,
        // Auth routes
        paths.auth.signIn,
        paths.auth.signUp,
        paths.auth.signUpConfirm,
        paths.auth.resetPassword,
        paths.auth.verifyCode,
        // Company info routes
        paths.company.aboutUs,
        paths.company.whatWeDo,
        paths.company.ourTechnology,
        paths.company.ourStories,
        paths.company.career,
        paths.resources.blog,
        paths.resources.support,
        paths.resources.community,
    ],

    // Routes that require auth but NOT business verification
    authOnly: [paths.dashboard.overview],

    // Routes that require BOTH auth AND business verification
    verified: [
        paths.dashboard.invoices,
        // paths.dashboard.invoices.concat('/:invoiceId'), // Can't easily concat string to string[] unless I change logic. keeping simple for now.
        // products
        paths.dashboard.products.list,
        paths.dashboard.products.create,
        paths.dashboard.products.update,
        paths.dashboard.products.companyProfile,
        // rfqs
        paths.dashboard.rfqs.list,
        paths.dashboard.rfqs.create,
        paths.dashboard.rfqs.update,
        // setttings
        paths.dashboard.settings.account,
        paths.dashboard.settings.notifications,
        paths.dashboard.settings.security,
        // chat
        paths.dashboard.chat.base,
        paths.dashboard.chat.compose,
        // Others
        paths.dashboard.analytics,
        paths.dashboard.savedProducts,
        paths.dashboard.becomeASupplier,
        // notifications
        paths.dashboard.notifications,
        // marketplace
        paths.marketplace.products,
        paths.marketplace.allCp,
        paths.marketplace.recentRfQ,
        // paths.marketplace.mainCategory(':mainCategoryId'),
    ],
};

// Helper functions
export const isPublicRoute = (pathname: string): boolean => {
    return routeAccess.public.some((route) => pathname === route || pathname.startsWith(route));
};

export const requiresVerification = (pathname: string): boolean => {
    return routeAccess.verified.some((route) => pathname.startsWith(route as string));
};

export const requiresAuthOnly = (pathname: string): boolean => {
    return routeAccess.authOnly.some((route) => pathname.startsWith(route as string));
};
