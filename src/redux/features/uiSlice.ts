import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

interface UiState {
    // Sidebar
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;

    // Modals
    activeModal: string | null;
    modalData: unknown;

    // Theme
    colorMode: 'light' | 'dark';

    // Toasts
    toasts: Toast[];

    // Loading states
    globalLoading: boolean;

    // Mobile
    isMobile: boolean;
    mobileMenuOpen: boolean;
}

const initialState: UiState = {
    sidebarOpen: true,
    sidebarCollapsed: false,
    activeModal: null,
    modalData: null,
    colorMode: 'light',
    toasts: [],
    globalLoading: false,
    isMobile: false,
    mobileMenuOpen: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        // Sidebar
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarOpen = action.payload;
        },
        setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
            state.sidebarCollapsed = action.payload;
        },

        // Modals
        openModal: (state, action: PayloadAction<{ modal: string; data?: unknown }>) => {
            state.activeModal = action.payload.modal;
            state.modalData = action.payload.data ?? null;
        },
        closeModal: (state) => {
            state.activeModal = null;
            state.modalData = null;
        },

        // Theme
        setColorMode: (state, action: PayloadAction<'light' | 'dark'>) => {
            state.colorMode = action.payload;
            if (typeof window !== 'undefined') {
                localStorage.setItem('colorMode', action.payload);
                document.documentElement.classList.toggle('dark', action.payload === 'dark');
            }
        },
        toggleColorMode: (state) => {
            const newMode = state.colorMode === 'light' ? 'dark' : 'light';
            state.colorMode = newMode;
            if (typeof window !== 'undefined') {
                localStorage.setItem('colorMode', newMode);
                document.documentElement.classList.toggle('dark', newMode === 'dark');
            }
        },

        // Toasts
        addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
            const id = Math.random().toString(36).substring(2, 9);
            state.toasts.push({ ...action.payload, id });
        },
        removeToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
        },
        clearToasts: (state) => {
            state.toasts = [];
        },

        // Loading
        setGlobalLoading: (state, action: PayloadAction<boolean>) => {
            state.globalLoading = action.payload;
        },

        // Mobile
        setIsMobile: (state, action: PayloadAction<boolean>) => {
            state.isMobile = action.payload;
        },
        toggleMobileMenu: (state) => {
            state.mobileMenuOpen = !state.mobileMenuOpen;
        },
        setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
            state.mobileMenuOpen = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase('auth/logout', (state) => {
            // Reset everything except theme preference (device-level pref)
            return { ...initialState, colorMode: state.colorMode };
        });
    },
});

export const {
    toggleSidebar,
    setSidebarOpen,
    setSidebarCollapsed,
    openModal,
    closeModal,
    setColorMode,
    toggleColorMode,
    addToast,
    removeToast,
    clearToasts,
    setGlobalLoading,
    setIsMobile,
    toggleMobileMenu,
    setMobileMenuOpen,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectSidebarOpen = (state: { ui: UiState }) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: { ui: UiState }) => state.ui.sidebarCollapsed;
export const selectActiveModal = (state: { ui: UiState }) => state.ui.activeModal;
export const selectModalData = (state: { ui: UiState }) => state.ui.modalData;
export const selectColorMode = (state: { ui: UiState }) => state.ui.colorMode;
export const selectToasts = (state: { ui: UiState }) => state.ui.toasts;
export const selectGlobalLoading = (state: { ui: UiState }) => state.ui.globalLoading;
export const selectIsMobile = (state: { ui: UiState }) => state.ui.isMobile;
export const selectMobileMenuOpen = (state: { ui: UiState }) => state.ui.mobileMenuOpen;
