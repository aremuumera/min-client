import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BVState {
    formData: {
        companyName: string;
        companyEmail: string;
        phoneNumber: string;
        phoneCountryCode: string;
        phoneCountryName: string;
        licenseNumber: string;
        dateRegistered: string | null;
        description: string;
    };
    errors: Record<string, string>;
    categoryData: any;
    companyLocationData: any;
    uploadedFiles: any[];
    isLoading: boolean;
    isSubmitted: boolean;
}

const initialState: BVState = {
    formData: {
        companyName: '',
        companyEmail: '',
        phoneNumber: '',
        phoneCountryCode: '',
        phoneCountryName: '',
        licenseNumber: '',
        dateRegistered: null,
        description: '',
    },
    errors: {
        companyName: '',
        companyEmail: '',
        phoneNumber: '',
        licenseNumber: '',
        dateRegistered: '',
        description: '',
        productSubCategory: '',
        productCategory: '',
        productMainCategory: '',
        country: '',
        state: '',
        city: '',
        address: '',
        zipCode: '',
        streetNo: '',
        fullAddress: '',
    },
    categoryData: {},
    companyLocationData: {},
    uploadedFiles: [],
    isLoading: false,
    isSubmitted: false,
};

export const businessCompanyInfoSlice = createSlice({
    name: 'businessCompanyInfo',
    initialState,
    reducers: {
        updateCompanyInfo: (state, action: PayloadAction<{ field: string; value: any }>) => {
            const { field, value } = action.payload;
            (state.formData as any)[field] = value;
        },
        updateCompanyInfoBulk: (state, action: PayloadAction<any>) => {
            state.formData = {
                ...state.formData,
                ...action.payload,
            };
        },
        setCompanyInfoErrors: (state, action: PayloadAction<any>) => {
            state.errors = {
                ...state.errors,
                ...action.payload,
            };
        },
        clearCompanyInfoErrors: (state, action: PayloadAction<string[]>) => {
            const fieldsToReset = action.payload;
            fieldsToReset.forEach((field) => {
                state.errors[field] = '';
            });
        },
        clearAllCompanyInfoErrors: (state) => {
            Object.keys(state.errors).forEach((key) => {
                state.errors[key] = '';
            });
        },
        updateCategoryData: (state, action: PayloadAction<any>) => {
            state.categoryData = { ...state.categoryData, ...action.payload };
        },
        setCompanyLocation: (state, action: PayloadAction<any>) => {
            state.companyLocationData = { ...state.companyLocationData, ...action.payload };
        },
        setCompanyInfoLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setCompanyInfoSubmitted: (state, action: PayloadAction<boolean>) => {
            state.isSubmitted = action.payload;
        },
        resetCompanyInfo: (state) => {
            state.formData = initialState.formData;
            state.errors = initialState.errors;
            state.categoryData = initialState.categoryData;
            state.isSubmitted = false;
        },
    },
});

export const {
    updateCompanyInfo,
    updateCompanyInfoBulk,
    setCompanyInfoErrors,
    clearCompanyInfoErrors,
    clearAllCompanyInfoErrors,
    resetCompanyInfo,
    setCompanyInfoLoading,
    updateCategoryData,
    setCompanyInfoSubmitted,
    setCompanyLocation,
} = businessCompanyInfoSlice.actions;

export default businessCompanyInfoSlice.reducer;
