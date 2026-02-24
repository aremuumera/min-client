import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RfqProductState {
    rfqProductDetailsFormData: any;
    rfqProductLocation: any;
    rfqPaymentTerms: any;
    uploadedFiles: any[];
    rfqSupplyTerms: any;
    states: any[];
    rfqSuccessData: any;
}

const initialState: RfqProductState = {
    rfqProductDetailsFormData: {},
    rfqProductLocation: {},
    rfqPaymentTerms: {},
    uploadedFiles: [],
    rfqSupplyTerms: {},
    states: [],
    rfqSuccessData: {}
};

const rfqProductSlice = createSlice({
    name: 'rfqProduct',
    initialState,
    reducers: {
        updateRfqProductDetailsFormData: (state, action: PayloadAction<any>) => {
            state.rfqProductDetailsFormData = { ...state.rfqProductDetailsFormData, ...action.payload };
        },
        updateRfqProductLocation: (state, action: PayloadAction<any>) => {
            state.rfqProductLocation = { ...state.rfqProductLocation, ...action.payload };
        },
        setStates: (state, action: PayloadAction<any>) => {
            state.states = { ...state.states, ...action.payload };
        },
        updateRfqPaymentTerms: (state, action: PayloadAction<any>) => {
            state.rfqPaymentTerms = { ...state.rfqPaymentTerms, ...action.payload };
        },
        updateRfqSupplyTerms: (state, action: PayloadAction<any>) => {
            state.rfqSupplyTerms = { ...state.rfqSupplyTerms, ...action.payload };
        },
        setUploadedFiles: (state, action: PayloadAction<any[]>) => {
            state.uploadedFiles = action.payload;
        },
        deleteUploadedFile: (state, action: PayloadAction<string>) => {
            state.uploadedFiles = state.uploadedFiles.filter((file) => file.name !== action.payload);
        },
        setRfqSuccessData: (state, action: PayloadAction<any>) => {
            state.rfqSuccessData = action.payload;
        },
        resetProductState: (state) => {
            state.rfqProductDetailsFormData = {};
            state.rfqProductLocation = {};
            state.rfqPaymentTerms = {};
            state.uploadedFiles = [];
            state.rfqSupplyTerms = {};
            state.states = [];
        },
        resetRFQState: () => initialState,
    },
    extraReducers: (builder) => {
        builder.addCase('auth/logout', () => initialState);
    },
});

export const {
    updateRfqProductDetailsFormData,
    updateRfqProductLocation,
    setStates,
    resetProductState,
    updateRfqSupplyTerms,
    updateRfqPaymentTerms,
    setUploadedFiles,
    resetRFQState,
    setRfqSuccessData,
    deleteUploadedFile,
} = rfqProductSlice.actions;

export default rfqProductSlice.reducer;
