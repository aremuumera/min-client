import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProductState {
    productDetailsFormData: any;
    descriptionFields: Array<{ header: string; description: string }>;
    uploadedFiles: any[];
    uploadedAttachment: any[];
    productLocation: any;
    productPaymentData: any;
    serverReadyData: any;
    serverReadyImagesData: any[];
    serverReadyAttachmentData: any[];
    productSuccessData: any;
}

const initialState: ProductState = {
    productDetailsFormData: {},
    descriptionFields: [{ header: '', description: '' }],
    uploadedFiles: [],
    uploadedAttachment: [],
    productLocation: {},
    productPaymentData: {},
    serverReadyData: {},
    serverReadyImagesData: [],
    serverReadyAttachmentData: [],
    productSuccessData: {}
};

const productSlice = createSlice({
    name: 'product',
    initialState,
    reducers: {
        updateProductDetailsFormData: (state, action: PayloadAction<any>) => {
            state.productDetailsFormData = { ...state.productDetailsFormData, ...action.payload };
        },
        updateProductLocation: (state, action: PayloadAction<any>) => {
            state.productLocation = { ...state.productLocation, ...action.payload };
        },
        updateProductPaymentData: (state, action: PayloadAction<any>) => {
            state.productPaymentData = { ...state.productPaymentData, ...action.payload };
        },
        clearProductPayment: (state) => {
            state.productPaymentData = [];
        },
        setServerReadyData: (state, action: PayloadAction<any>) => {
            state.serverReadyData = { ...state.serverReadyData, ...action.payload };
        },
        setServerReadyImagesData: (state, action: PayloadAction<any[]>) => {
            state.serverReadyImagesData = [...state.serverReadyImagesData, ...action.payload];
        },
        setServerReadyAttachmentData: (state, action: PayloadAction<any[]>) => {
            state.serverReadyAttachmentData = [...state.serverReadyAttachmentData, ...action.payload];
        },
        addDescriptionField: (state) => {
            state.descriptionFields.push({ header: '', description: '' });
        },
        removeDescriptionField: (state, action: PayloadAction<number>) => {
            state.descriptionFields.splice(action.payload, 1);
        },
        updateDescriptionField: (state, action: PayloadAction<{ index: number; field: 'header' | 'description'; value: string }>) => {
            const { index, field, value } = action.payload;
            state.descriptionFields[index][field] = value;
        },
        setUploadedFiles: (state, action: PayloadAction<any[]>) => {
            state.uploadedFiles = action.payload;
        },
        deleteUploadedFile: (state, action: PayloadAction<string>) => {
            state.uploadedFiles = state.uploadedFiles.filter((file) => file.name !== action.payload);
        },
        setUploadedAttachment: (state, action: PayloadAction<any[]>) => {
            state.uploadedAttachment = action.payload;
        },
        setProductSuccessData: (state, action: PayloadAction<any>) => {
            state.productSuccessData = action.payload;
        },
        deleteUploadedAttachment: (state, action: PayloadAction<string>) => {
            state.uploadedAttachment = state.uploadedAttachment.filter((file) => file.name !== action.payload);
        },
        resetProductState: (state) => {
            state.productDetailsFormData = {};
            state.descriptionFields = [{ header: '', description: '' }];
            state.uploadedFiles = [];
            state.uploadedAttachment = [];
            state.productLocation = {};
            state.productPaymentData = {};
            state.serverReadyData = {};
            state.serverReadyImagesData = [];
            state.serverReadyAttachmentData = [];
        },
    },
});

export const {
    updateProductDetailsFormData,
    updateProductLocation,
    addDescriptionField,
    clearProductPayment,
    removeDescriptionField,
    updateDescriptionField,
    setUploadedFiles,
    deleteUploadedFile,
    updateProductPaymentData,
    setUploadedAttachment,
    deleteUploadedAttachment,
    setServerReadyImagesData,
    setServerReadyAttachmentData,
    resetProductState,
    setProductSuccessData,
    setServerReadyData
} = productSlice.actions;

export default productSlice.reducer;
