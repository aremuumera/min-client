import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MarketplaceFilterState } from '@/lib/marketplace-filters';

interface MarketplaceState {
    /** What the backend filters on (src/lib/marketplace-filters.ts); categories come from the page's address */
    filters: MarketplaceFilterState;
    sort: any;
    search: string;
    page: number;
    limit: number;
    total: number;
    navSearch: any;
}

const initialState: MarketplaceState = {
    filters: {
        countries: null,
        materialId: null,
        locationType: null,
        fulfillment: null,
        minPrice: null,
        maxPrice: null,
        currency: null,
        rating: null,
        rfqsStatus: null,
    },
    sort: null,
    search: '',
    page: 1,
    limit: 12,
    total: 0,
    navSearch: null,
};

const marketplaceSlice = createSlice({
    name: 'marketplace',
    initialState,
    reducers: {
        setFilter: (state, action: PayloadAction<{ filterType: string; value: any }>) => {
            const { filterType, value } = action.payload;
            (state.filters as any)[filterType] = value;
            state.page = 1;
        },
        resetFilterss: (state) => {
            state.filters = initialState.filters;
            state.page = 1;
        },
        setSort: (state, action: PayloadAction<any>) => {
            state.sort = action.payload;
            state.page = 1;
        },
        setSearch: (state, action: PayloadAction<string>) => {
            state.search = action.payload;
            state.page = 1;
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.page = action.payload;
        },
        setLimit: (state, action: PayloadAction<number>) => {
            state.limit = action.payload;
            state.page = 1;
        },
        resetFilters: (state) => {
            state.filters = initialState.filters;
            state.sort = initialState.sort;
            state.search = initialState.search;
            state.page = initialState.page;
            state.limit = initialState.limit;
        },
    },
    extraReducers: (builder) => {
        builder.addCase('auth/logout', () => initialState);
    },
});

export const { setFilter, resetFilters, resetFilterss, setSort, setSearch, setPage, setLimit } =
    marketplaceSlice.actions;

export default marketplaceSlice.reducer;
