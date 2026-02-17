"use client";

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useForgotPasswordMutation } from '@/redux/features/AuthFeature/auth_api_rtk';

import { setAwaitingOTPVerification, setRType, setUserEmail, setUserPhone, setUserVType } from '@/redux/features/AuthFeature/auth_slice';
import { useAlert } from '@/providers/alert-provider';
import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PhoneNumberInput from '@/utils/phone-number-input';
import { countryOptions } from '@/utils/countries-state';
import { AppDispatch } from '@/redux/store';
// import { cn } from '@/lib/utils'; // Unused in this file given the code, but imported in original

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email is required' }).email()
});

type FormData = zod.infer<typeof schema>;

export function ResetPasswordForm() {
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { showAlert } = useAlert();

  const [forgotPassword, { isLoading: loading }] = useForgotPasswordMutation();

  const [phoneData, setPhoneData] = useState({
    phoneNumber: '',
    countryCode: '',
    countryName: '',
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '' },
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: FormData) => {
    try {
      const response = await forgotPassword({
        identifier: values.email, type: 'email',

      }).unwrap();

      showAlert(response?.message || 'Password reset code sent to your email.', 'success');
      dispatch(setUserEmail(values.email));
      dispatch(setUserVType('forgot_password'));
      dispatch(setRType('email'));
      dispatch(setAwaitingOTPVerification());
      router.push(paths.auth.verifyCode);

    } catch (err: any) {
      showAlert(err?.message || err?.data?.message || 'Failed to send reset code.', 'error');
    }
  };

  const handlePhoneResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = phoneData.phoneNumber.length < 10 ? 'Invalid phone number' : null;
    if (error) {
      setPhoneError(error);
      return;
    }

    try {
      //   const resultAction = await dispatch(UserForgotPassword({...}));
      const response = await forgotPassword({
        identifier: phoneData.phoneNumber,
        type: 'phone',
        //   country: phoneData.countryName, // api definition in auth_api_rtk only takes identifier and type. 
        // If the backend needs country/countryCode, I should update the api definition. 
        // The old UserForgotPassword payload might have been loose.
        // Let's assume for now identifier + type is standard, but old code passed extra. 
        // RTK Query calls match the body. 
        // If the backend expects these fields, I should include them in the mutation argument type, or simply pass `any`.
        // auth_api_rtk defined it as { identifier: string; type: string }. 
        // I will verify if I need to update auth_api_rtk type or just cast/pass extras.
        // Let's pass them as extras assuming the backend uses them. I'll cast to any for now or update the mutation.
        ...({ country: phoneData.countryName, countryCode: phoneData.countryCode } as any)
      }).unwrap();

      showAlert(response?.message || 'Reset code sent to your phone.', 'success');
      dispatch(setUserPhone(phoneData.phoneNumber));
      dispatch(setUserVType('forgot_password'));
      dispatch(setRType('phone'));
      dispatch(setAwaitingOTPVerification());
      router.push(paths.auth.verifyCode);

    } catch (err: any) {
      showAlert(err?.message || err?.data?.message || 'Failed to send reset code.', 'error');
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6">
        <Link href={paths.auth.signIn} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-green-600 transition-colors">
          <ArrowLeft size={18} />
          Back to login
        </Link>
        <Link href={paths.home} className="inline-block w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/MINMEG 4.png" alt="Logo" className="h-[50px] w-auto" />
        </Link>
        <div className="space-y-1.5">
          <h2 className="text-3xl font-bold text-gray-900">Reset password</h2>
          <p className="text-gray-500 text-sm">
            Choose a method to reset your password and we&apos;ll send you a verification code.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {resetMethod === 'email' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  {...field}
                  label="Email address"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  disabled={loading}
                />
              )}
            />
            <div className="space-y-3">
              <Button type="submit" className="w-full py-6 font-semibold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Code'}
              </Button>
              {/* <Button
                type="button"
                variant="outlined"
                onClick={() => setResetMethod('phone')}
                className="w-full py-6"
              >
                Reset with Phone Number
              </Button> */}
            </div>
          </form>
        ) : (
          <form onSubmit={handlePhoneResetSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <PhoneNumberInput
                name="phoneNumber"
                country="NGA"
                options={countryOptions}
                _number={phoneData.phoneNumber}
                onChange={(val, code, name) => {
                  setPhoneData({ ...phoneData, phoneNumber: val, countryCode: code, countryName: name });
                  setPhoneError(null);
                }}
                isInValid={!!phoneError}
              />
              {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
            </div>
            <div className="space-y-3">
              <Button type="submit" className="w-full py-6 font-semibold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Code'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setResetMethod('email')}
                className="w-full py-6"
              >
                Reset with Email
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
