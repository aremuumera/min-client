import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { clearAllFilesFromIndexedDB } from '@/utils/indexDb'; // Correct import path if needed
import { authApi } from './auth_api_rtk';

// enum vType 'email_verification'

interface AuthState {
    isAuth: boolean;
    isInitialized: boolean;
    awaitingOTPVerification: boolean;
    appData: any | null;
    user: any | null;
    token: string | null;
    numb: any | null;
    loading: boolean;
    error: string | null;
    vType: string;
    reginfo: any;
    rtype: string;
    email: string;
    phone: string;
    verificationStatus: boolean;
    requestedLocation: string | null;
    showEntryModal: boolean;
    success?: boolean;
}

const initialState: AuthState = {
    isAuth: false,
    isInitialized: false,
    awaitingOTPVerification: true,
    appData: null,
    user: null,
    token: '',
    numb: null,
    loading: false,
    error: '',
    vType: '',
    reginfo: {},
    rtype: '',
    email: (typeof window !== 'undefined' && localStorage.getItem('email')) || '',
    phone: (typeof window !== 'undefined' && localStorage.getItem('phone')) || '',
    verificationStatus: false,
    requestedLocation: null,
    showEntryModal: false,
};

const initialStateFromLocalStorage = () => {
    // Ported from original logic
    if (typeof window !== 'undefined') {
        clearAllFilesFromIndexedDB('ProductImages')
            .then((data) => console.log('all indexdb data cleared:', data))
            .catch((error) => console.error('Error:', error));

        clearAllFilesFromIndexedDB('ProductAttachment')
            .then((data) => console.log('all indexdb data cleared:', data))
            .catch((error) => console.error('Error:', error));
    }
};

const AuthSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setRequestedLocation: (state, action: PayloadAction<string | null>) => {
            state.requestedLocation = action.payload;
        },
        clearRequestedLocation: (state) => {
            state.requestedLocation = null;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.numb = null;
            state.loading = false;
            state.error = null;
            state.awaitingOTPVerification = false;
            if (typeof window !== 'undefined') localStorage.removeItem('chimpstate');
            state.isAuth = false;
            state.isInitialized = true;
            initialStateFromLocalStorage();
        },
        loginSuccess: (state, action: PayloadAction<any>) => {
            console.log('loginSuccess', action.payload);
            state.user = action.payload?.user;
            state.token = action.payload?.ac;
            state.numb = action.payload?.fc;
            state.isAuth = true;
            state.isInitialized = true;
            state.loading = false;
            state.error = null;
            state.awaitingOTPVerification = false;
            if (typeof window !== 'undefined') localStorage.setItem('chimpstate', action.payload.ac);
            initialStateFromLocalStorage();
        },
        loginRefresh: (state, action: PayloadAction<any>) => {
            state.user = action.payload?.user;
            state.token = action.payload?.ac;
            state.numb = action.payload?.fc;
            state.appData = action.payload?.data;
            state.loading = false;
            state.error = null;
            state.isAuth = true;
            state.isInitialized = true;
            state.awaitingOTPVerification = false;
            if (typeof window !== 'undefined') localStorage.setItem('chimpstate', action.payload.ac);
            initialStateFromLocalStorage();
        },
        registerSuccess: (state, action: PayloadAction<any>) => {
            state.isInitialized = true;
            state.user = action.payload?.user;
            state.token = action.payload?.ac;
            state.numb = action.payload?.fc;
            state.awaitingOTPVerification = true;
            if (typeof window !== 'undefined') localStorage.setItem('chimpstate', action.payload?.ac)
            state.isAuth = false;
            initialStateFromLocalStorage();
            state.loading = false;
            state.error = null;
        },
        userSignupReset: (state) => {
            state.error = '';
            state.loading = false;
            state.success = false;
        },
        clearuserError: (state) => {
            state.user = '';
        },
        setUserEmail: (state, action: PayloadAction<string>) => {
            state.email = action.payload;
        },
        setUserPhone: (state, action: PayloadAction<string>) => {
            state.phone = action.payload;
        },
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
        },
        setRType: (state, action: PayloadAction<string>) => {
            state.rtype = action.payload;
        },
        clearUserVType: (state) => {
            state.vType = '';
            state.email = '';
            state.phone = '';
            state.rtype = '';
        },
        setUserVType: (state, action: PayloadAction<string>) => {
            state.vType = action.payload;
        },
        setRegInfo: (state, action: PayloadAction<any>) => {
            state.reginfo = action.payload;
        },
        setAwaitingOTPVerification: (state) => {
            state.awaitingOTPVerification = true;
        },
        resetAwaitingOTPVerification: (state) => {
            state.awaitingOTPVerification = false;
        },
        setShowEntryModal: (state, action: PayloadAction<boolean>) => {
            state.showEntryModal = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // --- AppCheck (Query) ---
            .addMatcher(authApi.endpoints.appCheck.matchPending, (state) => {
                if (!state.isAuth) {
                    state.isInitialized = false;
                }
            })
            .addMatcher(authApi.endpoints.appCheck.matchFulfilled, (state, action) => {
                state.isInitialized = true;
                state.token = action.payload?.ac;
                state.numb = action.payload?.fc;
                state.user = action.payload?.user;
                state.appData = action.payload?.data;
                state.isAuth = true;
                state.error = null;
                if (typeof window !== 'undefined') localStorage.setItem('chimpstate', action.payload.ac);

            })
            .addMatcher(authApi.endpoints.appCheck.matchRejected, (state, action) => {
                state.isInitialized = true;
                state.isAuth = false;
                state.token = null;
                state.numb = null;
                state.user = null;
                state.error = action.error?.message || 'Failed to initialize user.';
            })


        // --- Signup (Mutation) ---
        // .addMatcher(authApi.endpoints.signup.matchPending, (state) => {
        //     state.loading = true;
        //     state.error = null;
        // })
        // .addMatcher(authApi.endpoints.signup.matchFulfilled, (state, action) => {
        //     state.loading = false;
        //     state.user = action.payload?.user;
        //     state.token = action.payload?.ac;
        //     state.numb = action.payload?.fc;
        //     state.error = null;
        //     state.isAuth = false; // Waiting for OTP
        //     state.awaitingOTPVerification = true;
        //     state.isInitialized = true;
        //     state.vType = 'email_verification';
        // })
        // .addMatcher(authApi.endpoints.signup.matchRejected, (state, action) => {
        //     state.loading = false;
        //     // @ts-ignore
        //     state.error = action.payload?.message || action.error?.message || 'Signup failed.';
        //     state.success = false;
        //     state.isAuth = false;
        //     state.isInitialized = true;
        //     state.awaitingOTPVerification = false;
        // })


    },
});

export const {
    logout,
    loginSuccess,
    loginRefresh,
    registerSuccess,
    userSignupReset,
    clearuserError,
    setUserEmail,
    setUserPhone,
    setRegInfo,
    setRType,
    setToken,
    setUserVType,
    clearUserVType,
    setAwaitingOTPVerification,
    resetAwaitingOTPVerification,
    setRequestedLocation,
    clearRequestedLocation,
    setShowEntryModal,
} = AuthSlice.actions;

export default AuthSlice.reducer;
