"use client";

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useResendOTPMutation, useVerifyOTPMutation } from '@/redux/features/AuthFeature/auth_api_rtk';

import { clearUserVType, resetAwaitingOTPVerification } from '@/redux/features/AuthFeature/auth_slice';
import { useAlert } from '@/providers/alert-provider';
import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button';
import { AppDispatch } from '@/redux/store';
import { cn } from '@/utils/helper';
import { useAppSelector } from '@/redux';

export function VerifyCodeForm() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { email, awaitingOTPVerification, vType } = useAppSelector((state) => state.auth);


  console.log(email, awaitingOTPVerification, vType);

  const [verifyOTP, { isLoading: verifying }] = useVerifyOTPMutation();
  const [resendOTP, { isLoading: resending }] = useResendOTPMutation();

  const loading = verifying || resending;

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [counter, setCounter] = useState(30);
  const [isCounting, setIsCounting] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (!awaitingOTPVerification) {
      router.push(paths.auth.signIn);
    }
  }, [awaitingOTPVerification, router]);

  useEffect(() => {
    if (isCounting) {
      const timer = setInterval(() => {
        setCounter((prev) => {
          if (prev === 1) {
            clearInterval(timer);
            setIsCounting(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isCounting]);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vType) {
      showAlert('Please select a verification method.', 'error');
      return;
    }

    if (otp.length !== 6) {
      setOtpError('OTP must be exactly 6 digits.');
      return;
    }

    try {
      const response = await verifyOTP({ otp, identifier: email || '', verificationType: vType as any }).unwrap();

      showAlert(response?.message || 'OTP verified successfully.', 'success');
      if (vType === 'forgot_password') {
        router.push(paths.auth.newPasswordRequired);
      } else {
        dispatch(clearUserVType());
        dispatch(resetAwaitingOTPVerification());
        router.push(paths.auth.signIn);
      }

    } catch (err: any) {
      showAlert(err?.message || err?.data?.message || 'Invalid OTP. Please try again.', 'error');
    }
  };

  const handleResendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await resendOTP({ email: email || '', verificationType: vType as any }).unwrap();

      showAlert(response?.message || 'New OTP sent successfully.', 'success');
      setIsCounting(true);
      setCounter(30);

    } catch (err: any) {
      showAlert(err?.message || err?.data?.message || 'Failed to resend OTP.', 'error');
    }
  };

  const currentOtp = otp.split('');

  const handleChange = (i: number, val: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...currentOtp];
    newOtp[i] = val;
    const finalVal = newOtp.join('');
    setOtp(finalVal);
    setOtpError('');

    // Move focus
    if (val && i < 5) {
      (e.target.nextSibling as HTMLInputElement)?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      // Need to target previous sibling accurately. 
      // e.currentTarget is the input.
      (e.currentTarget.previousSibling as HTMLInputElement)?.focus();
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
          <h2 className="text-3xl font-bold text-gray-900">Verify code</h2>
          <p className="text-gray-500 text-sm">
            We&apos;ve sent a 6-digit confirmation code to <span className="text-gray-900 font-semibold">{email}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleVerifySubmit} className="space-y-8">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Enter Verification Code</label>
          <div className="flex gap-2 justify-between">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                className={cn(
                  "w-12 h-14 text-center text-xl font-bold bg-gray-50 border rounded-xl outline-none transition-all",
                  otpError ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 focus:bg-white"
                )}
                value={otp[i] || ''}
                onChange={(e) => handleChange(i, e.target.value, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>
          {otpError && <p className="text-xs text-red-500 text-center">{otpError}</p>}
        </div>

        <Button
          type="submit"
          className="w-full py-6 text-base font-semibold"
          disabled={loading || otp.length < 6}
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Verify Account'}
        </Button>
      </form>

      <div className="pt-6 border-t border-gray-100 italic text-center">
        <p className="text-sm text-gray-500 mb-2">Didn&apos;t receive the code?</p>
        <button
          onClick={handleResendOtp}
          disabled={isCounting || loading}
          type="button"
          className={cn(
            "text-sm font-bold transition-all",
            isCounting ? "text-gray-400 cursor-not-allowed" : "text-green-600 hover:text-green-700 hover:underline"
          )}
        >
          {isCounting ? `Resend code in ${counter}s` : 'Resend code now'}
        </button>
      </div>
    </div>
  );
}
