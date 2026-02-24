import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SupplierProfileState {
    profileDetailsFormData: any;
    supplierProfileLogo: any[];
    supplierProfileBanner: any[];
    profileDescriptionFields: Array<{ header: string; description: string }>;
    supplierMediaInfo: any;
    supplierLocationInfo: any;
    productLocation?: any;
    supplierPaymentTerms?: any;
}

const initialState: SupplierProfileState = {
    profileDetailsFormData: {
        companyName: '',
        companyDescription: '',
        businessCategory: '',
        totalEmployees: '',
        yearEstablished: '',
        yearExperience: '',
        businessType: '',
        totalRevenue: '',
        selectedPayments: [],
        selectedShippings: [],
    },
    supplierProfileLogo: [],
    supplierProfileBanner: [],
    profileDescriptionFields: [{ header: '', description: '' }],
    supplierMediaInfo: {
        companyEmail: '',
        companyPhone: '',
        facebook: '',
        instagram: '',
        linkedIn: '',
        xSocial: '',
    },
    supplierLocationInfo: {
        selectedCountry: '',
        selectedState: '',
        fullAddress: '',
        longitude: '',
        latitude: '',
        streetNo: '',
        zipCode: '',
    },
};

const supplierProfileSlice = createSlice({
    name: 'supplierProfile',
    initialState,
    reducers: {
        updateProfileDetailsFormData: (state, action: PayloadAction<any>) => {
            state.profileDetailsFormData = { ...state.profileDetailsFormData, ...action.payload };
        },
        updateSupplierMediaInfo: (state, action: PayloadAction<any>) => {
            state.supplierMediaInfo = { ...state.supplierMediaInfo, ...action.payload };
        },
        updateSupplierLocationInfo: (state, action: PayloadAction<any>) => {
            state.supplierLocationInfo = { ...state.supplierLocationInfo, ...action.payload };
        },
        updateProductLocation: (state, action: PayloadAction<any>) => {
            state.productLocation = { ...state.productLocation, ...action.payload };
        },
        updatePaymentTerms: (state, action: PayloadAction<any>) => {
            state.supplierPaymentTerms = { ...state.supplierPaymentTerms, ...action.payload };
        },
        addProfileDescriptionField: (state) => {
            state.profileDescriptionFields.push({ header: '', description: '' });
        },
        removeProfileDescriptionField: (state, action: PayloadAction<number>) => {
            state.profileDescriptionFields.splice(action.payload, 1);
        },
        updateProfileDescriptionField: (state, action: PayloadAction<{ index: number; field: 'header' | 'description'; value: string }>) => {
            const { index, field, value } = action.payload;
            state.profileDescriptionFields[index][field] = value;
        },
        setSupplierProfileLogo: (state, action: PayloadAction<any[]>) => {
            state.supplierProfileLogo = action.payload;
        },
        deleteSupplierProfileLogo: (state, action: PayloadAction<number>) => {
            state.supplierProfileLogo = state.supplierProfileLogo.filter((_, i) => i !== action.payload);
        },
        setSupplierProfileBanner: (state, action: PayloadAction<any[]>) => {
            state.supplierProfileBanner = action.payload;
        },
        deleteSupplierProfileBanner: (state, action: PayloadAction<string>) => {
            // Ported logic from original (which had a bug with nested array wrap)
            state.supplierProfileBanner = state.supplierProfileBanner.filter((file) => file.name !== action.payload);
        },
        resetProductState: () => initialState,
    },
    extraReducers: (builder) => {
        builder.addCase('auth/logout', () => initialState);
    },
});

export const {
    updateProfileDetailsFormData,
    updateSupplierMediaInfo,
    updateSupplierLocationInfo,
    updateProductLocation,
    updatePaymentTerms,
    addProfileDescriptionField,
    removeProfileDescriptionField,
    updateProfileDescriptionField,
    resetProductState,
    setSupplierProfileLogo,
    deleteSupplierProfileLogo,
    setSupplierProfileBanner,
    deleteSupplierProfileBanner,
} = supplierProfileSlice.actions;

export default supplierProfileSlice.reducer;
