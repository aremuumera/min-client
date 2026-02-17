import AxiosInstance from '@/lib/axios-instance';
import { config } from '@/lib/config';
import axios from 'axios';

const SignUpService = (userData: any) => {
    return axios.post(`${config.api.baseUrl}/auth/umera/register`, userData, {
        withCredentials: true,
    });
};

const LoginService = (userData: any) => {
    return AxiosInstance.post(`/auth/umera/login`, userData);
};

const ForgotPasswordService = (data: any) => {
    return AxiosInstance.post(`/auth/umera/forgot_password`, data);
};

const VerifyOTPService = (userData: any) => {
    return AxiosInstance.post(`/auth/umera/verify_otp_check`, userData);
};

const ResendOTPService = (userData: any) => {
    return AxiosInstance.post(`/auth/umera/resend_otp_check`, userData);
};

const ResetPasswordService = (userData: any) => {
    return AxiosInstance.post(`/auth/umera/reset_password`, userData);
};

const ChnagePasswordCurrent = (userData: any) => {
    return AxiosInstance.post(`/auth/current/change-password`, userData);
};

const DeactivateAccount = () => {
    return AxiosInstance.post(`/auth/current/deactivate`);
};

const UpdatePreferences = (data: any) => {
    return AxiosInstance.put(`/auth/current/preferences`, data);
};

const authService = {
    VerifyOTPService,
    SignUpService,
    LoginService,
    ResetPasswordService,
    ForgotPasswordService,
    ResendOTPService,
    ChnagePasswordCurrent,
    DeactivateAccount,
    UpdatePreferences,
};

export default authService;
export type { authService };
