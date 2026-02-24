import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Product {
    id: string;
    product_name: string;
    real_price: string;
    unitCurrency?: string;
    product_category: string;
    images: string[];
    quantity: string;
    measure: string;
    purity_grade?: string;
    moisture_max?: string;
    packaging?: string;
    sampling_method?: string;
    country?: {
        flagImage?: string;
        name?: string;
    };
    selected_country_name?: string;
    selected_state?: string;
}

interface ComparisonState {
    comparisonList: Product[];
    maxProducts: number;
}

const initialState: ComparisonState = {
    comparisonList: [],
    maxProducts: 4,
};

const comparisonSlice = createSlice({
    name: 'comparison',
    initialState,
    reducers: {
        addToComparison: (state, action: PayloadAction<Product>) => {
            const exists = state.comparisonList.find(p => p.id === action.payload.id);
            if (!exists && state.comparisonList.length < state.maxProducts) {
                state.comparisonList.push(action.payload);
            }
        },
        removeFromComparison: (state, action: PayloadAction<string>) => {
            state.comparisonList = state.comparisonList.filter(p => p.id !== action.payload);
        },
        clearComparison: (state) => {
            state.comparisonList = [];
        },
        toggleComparison: (state, action: PayloadAction<Product>) => {
            const index = state.comparisonList.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.comparisonList.splice(index, 1);
            } else if (state.comparisonList.length < state.maxProducts) {
                state.comparisonList.push(action.payload);
            }
        }
    },
    extraReducers: (builder) => {
        builder.addCase('auth/logout', () => initialState);
    },
});

export const { addToComparison, removeFromComparison, clearComparison, toggleComparison } = comparisonSlice.actions;
export default comparisonSlice.reducer;
