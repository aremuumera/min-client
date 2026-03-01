import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { clearAllFilesFromIndexedDB } from "@/utils/indexDb"; // Correct import path if needed
import { authApi } from "./auth_api_rtk";

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
  permissions: string[];
  isTeamMember: boolean;
  team_role?: string;
  ownerUserId?: string;
  vType: string;
  reginfo: any;
  rtype: string;
  email: string;
  phone: string;
  announcements_enabled: boolean;
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
  token: "",
  numb: null,
  loading: false,
  error: "",
  isTeamMember: false,
  permissions: [],
  vType: "",
  reginfo: {},
  rtype: "",
  email: (typeof window !== "undefined" && localStorage.getItem("email")) || "",
  phone: (typeof window !== "undefined" && localStorage.getItem("phone")) || "",
  announcements_enabled: true,
  verificationStatus: false,
  requestedLocation: null,
  showEntryModal: false,
};

const initialStateFromLocalStorage = () => {
  // Ported from original logic
  if (typeof window !== "undefined") {
    clearAllFilesFromIndexedDB("ProductImages")
      .then((data) => console.log("all indexdb data cleared:", data))
      .catch((error) => console.error("Error:", error));

    clearAllFilesFromIndexedDB("ProductAttachment")
      .then((data) => console.log("all indexdb data cleared:", data))
      .catch((error) => console.error("Error:", error));
  }
};

const AuthSlice = createSlice({
  name: "auth",
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
      state.isAuth = false;
      state.isInitialized = true;
      state.isTeamMember = false;
      state.permissions = [];
      state.team_role = undefined;
      state.ownerUserId = undefined;
      state.appData = null;
      state.reginfo = {};
      state.vType = "";
      state.rtype = "";
      state.email = "";
      state.phone = "";
      state.announcements_enabled = true;
      state.verificationStatus = false;
      state.requestedLocation = null;
      state.showEntryModal = false;

      if (typeof window !== "undefined") {
        // Clear auth token
        localStorage.removeItem("chimpstate");

        // Clear user-specific localStorage keys
        localStorage.removeItem("email");
        localStorage.removeItem("phone");
        localStorage.removeItem("userLocation");
        localStorage.removeItem("app.settings");

        // Purge redux-persist storage (removes persist:root and persist:auth)
        localStorage.removeItem("persist:root");
        localStorage.removeItem("persist:auth");

        // NOTE: We intentionally keep these device-level prefs:
        // - 'colorMode', 'theme', 'dashboard-sidebar-collapsed'
      }

      initialStateFromLocalStorage();
    },
    loginSuccess: (state, action: PayloadAction<any>) => {
      console.log("loginSuccess", action.payload);
      state.user = action.payload?.user;
      state.token = action.payload?.ac;
      state.numb = action.payload?.fc;
      state.appData = action.payload?.data;
      state.isAuth = true;
      state.isInitialized = true;
      state.loading = false;
      state.error = null;
      state.awaitingOTPVerification = false;
      state.isTeamMember = action.payload?.user?.isTeamMember || false;
      state.team_role = action.payload?.user?.team_role;
      state.permissions = action.payload?.user?.permissions || [];
      state.ownerUserId = action.payload?.user?.ownerUserId;
      state.announcements_enabled =
        action.payload?.user?.announcements_enabled ?? true;
      if (typeof window !== "undefined")
        localStorage.setItem("chimpstate", action.payload.ac);
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
      state.isTeamMember = action.payload.user?.isTeamMember || false;
      state.team_role = action.payload.user?.team_role;
      state.permissions = action.payload.user?.permissions || [];
      state.ownerUserId = action.payload.user?.ownerUserId;
      state.announcements_enabled =
        action.payload.user?.announcements_enabled ?? true;
      if (typeof window !== "undefined")
        localStorage.setItem("chimpstate", action.payload.ac);
      initialStateFromLocalStorage();
    },
    registerSuccess: (state, action: PayloadAction<any>) => {
      state.isInitialized = true;
      state.user = action.payload?.user;
      state.token = action.payload?.ac;
      state.numb = action.payload?.fc;
      state.awaitingOTPVerification = true;
      if (typeof window !== "undefined")
        localStorage.setItem("chimpstate", action.payload?.ac);
      state.isAuth = false;
      initialStateFromLocalStorage();
      state.loading = false;
      state.error = null;
    },
    userSignupReset: (state) => {
      state.error = "";
      state.loading = false;
      state.success = false;
    },
    clearuserError: (state) => {
      state.user = "";
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
      state.vType = "";
      state.email = "";
      state.phone = "";
      state.rtype = "";
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
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
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
      .addMatcher(
        authApi.endpoints.appCheck.matchFulfilled,
        (state, action) => {
          state.isInitialized = true;
          state.token = action.payload?.ac;
          state.numb = action.payload?.fc;
          state.user = action.payload?.user;
          state.appData = action.payload?.data;
          state.isAuth = true;
          state.error = null;
          state.isTeamMember = action.payload?.user?.isTeamMember || false;
          state.team_role = action.payload?.user?.team_role;
          state.permissions = action.payload?.user?.permissions || [];
          state.ownerUserId = action.payload?.user?.ownerUserId;
          state.announcements_enabled =
            action.payload?.user?.announcements_enabled ?? true;
          if (typeof window !== "undefined")
            localStorage.setItem("chimpstate", action.payload.ac);
        },
      )
      .addMatcher(authApi.endpoints.appCheck.matchRejected, (state, action) => {
        state.isInitialized = true;
        state.isAuth = false;
        state.token = null;
        state.numb = null;
        state.user = null;
        state.error = action.error?.message || "Failed to initialize user.";
      });

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
  setInitialized,
} = AuthSlice.actions;

// Thunk that dispatches logout AND resets all RTK Query API caches
export const logoutAndCleanup = () => (dispatch: any) => {
  // 1. Dispatch logout action (resets all slice state via extraReducers)
  dispatch(logout());

  // 2. Reset all RTK Query API caches to clear previous user's cached data
  // We lazy-import to avoid circular dependencies
  const apis = [
    require("../enquiry/enquiry_api").default,
    require("../supplier-products/products_api").default,
    require("../buyer-rfq/rfq-api").default,
    require("../supplier-profile/supplier_profile_api").default,
    require("../categories/cat_api").default,
    require("../savedFeature/saved_api").default,
    require("../reviewFeature/review_api").default,
    require("../chatFeature/chatApi").default,
    require("../business_verification_feature/bv_api").default,
    require("../blogs/blog_api").default,
    require("../business_verification_feature/bv_v1_api").default,
    require("../inspector/inspector_api").default,
    require("../invoice/invoice_api").default,
    require("../team/teamApi").teamApi,
    require("../activity/activityApi").default,
    require("../trade/trade_api").default,
    require("../definitions/definition_api").default,
  ];

  apis.forEach((api) => {
    if (api?.util?.resetApiState) {
      dispatch(api.util.resetApiState());
    }
  });
};

export default AuthSlice.reducer;
