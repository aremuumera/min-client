import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { config } from '@/lib/config';

export const addToWaitlist = (data: any) => {
    return axios.post(`${config.api.baseUrl}/waitlist`, data);
};

export const waitlistEmail = createAsyncThunk('waitlist/waitlistEmail', async (data: any, { rejectWithValue }) => {
    try {
        const response = await addToWaitlist(data);
        return response.data; // Return success response
    } catch (error: any) {
        const errorResponse = {
            message: error.response?.data?.message || 'An error occurred.',
            status: error.response?.status,
        };
        return rejectWithValue(errorResponse); // Return error payload
    }
});

interface WaitlistState {
    loading: boolean;
    successMessage: string | null;
    error: any | null;
}

const initialState: WaitlistState = {
    loading: false,
    successMessage: null,
    error: null,
};

const waitlistSlice = createSlice({
    name: 'waitlist',
    initialState,
    reducers: {
        resetWaitlistState(state) {
            state.successMessage = null;
            state.error = null;
            state.loading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(waitlistEmail.pending, (state) => {
                state.loading = true;
                state.successMessage = null;
                state.error = null;
            })
            .addCase(waitlistEmail.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.successMessage = action.payload.message;
            })
            .addCase(waitlistEmail.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload || { message: 'An unexpected error occurred.' };
            })
            .addCase('auth/logout', () => initialState);
    },
});

export const { resetWaitlistState } = waitlistSlice.actions;
export default waitlistSlice.reducer;
