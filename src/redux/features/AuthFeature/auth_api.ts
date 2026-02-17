import { createAsyncThunk } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import AxiosInstance from '@/lib/axios-instance';
import { handleApiError } from '@/lib/err-handler';
import authService from './auth_service';
import { logout } from './auth_slice';

export const isTokenExpired = (token: string) => {
    try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch (error) {
        return true;
    }
};

export const AppCheck = createAsyncThunk(
    'UserAppCheck',
    async (_, { getState, rejectWithValue, dispatch }) => {
        const state: any = getState();
        const token = typeof window !== 'undefined' ? localStorage.getItem('chimpstate') : null;

        if (!token || token === 'undefined') {
            if (typeof window !== 'undefined') localStorage.removeItem('chimpstate');
            return rejectWithValue('No valid token found');
        }

        try {
            const response = await AxiosInstance.get(`/auth/umera/check_refresh_token`);
            const newToken = response.data?.ac;
            const firebaseToken = response.data?.fc;
            const userData = response?.data?.user;
            const data = response?.data?.data;

            if (typeof window !== 'undefined') localStorage.setItem('chimpstate', newToken);

            // Firebase integration placeholder (as per original logic)
            // if (firebaseToken) {
            //   await firebaseAuthService.signInWithCustomToken(firebaseToken);
            // }

            return {
                token: newToken,
                userData,
                user: userData,
                data: data,
                numb: firebaseToken
            };
        } catch (error: any) {
            if (error.response) {
                const { status, message } = error.response.data;
                if (status === 401 || status === 403) {

                    // dispatch(logout()); // Behavioral parity with original (commented out in original too)
                    return rejectWithValue({ status, message: 'Unauthorized' });
                }
                return rejectWithValue({ status, message });
            }
            return rejectWithValue({ status: 500, message: 'Unexpected error occurred' });
        }
    }
);

export const UserSignup = createAsyncThunk(
    'usersignup',
    async (userData: any, { rejectWithValue }) => {
        try {
            const response = await authService.SignUpService(userData);
            return response.data;
        } catch (err) {
            return rejectWithValue(handleApiError(err));
        }
    }
);

export const UserSignin = createAsyncThunk(
    'usersignin',
    async (credentials: any, { rejectWithValue }) => {
        try {
            const response = await authService.LoginService(credentials);
            return response.data;
        } catch (err) {
            return rejectWithValue(handleApiError(err));
        }
    }
);

export const UserForgotPassword = createAsyncThunk(
    'forgotPassword',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await authService.ForgotPasswordService(data);
            return response.data;
        } catch (err) {
            return rejectWithValue(handleApiError(err));
        }
    }
);

export const UserResetPassword = createAsyncThunk(
    'resetPassword',
    async (userData: any, { rejectWithValue }) => {
        try {
            const response = await authService.ResetPasswordService(userData);
            return response.data;
        } catch (err) {
            return rejectWithValue(handleApiError(err));
        }
    }
);

export const VerifyOTP = createAsyncThunk(
    'auth/verifyOTP',
    async (userData: any, { rejectWithValue }) => {
        try {
            const response = await authService.VerifyOTPService(userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const ResendOTP = createAsyncThunk(
    'auth/ResetOTP',
    async (userData: any, { rejectWithValue }) => {
        try {
            const response = await authService.ResendOTPService(userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const ChangePassword = createAsyncThunk(
    'auth/ChnagePassword',
    async (userData: any, { rejectWithValue }) => {
        try {
            const response = await authService.ChnagePasswordCurrent(userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const DeactivateAccount = createAsyncThunk(
    'auth/DeactivateAccount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authService.DeactivateAccount();
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

export const UpdateUserPreferences = createAsyncThunk(
    'auth/UpdatePreferences',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await authService.UpdatePreferences(data);
            return response.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error));
        }
    }
);
