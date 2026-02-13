"use client";

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useResetPasswordMutation } from '@/redux/features/AuthFeature/auth_api_rtk';

import { clearUserVType, resetAwaitingOTPVerification } from '@/redux/features/AuthFeature/auth_slice';
import { useAlert } from '@/providers/alert-provider';
import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppDispatch, RootState } from '@/redux/store';
import { useAppDispatch, useAppSelector } from '@/redux';

const schema = zod.object({
  password: zod
    .string()
    .min(1, { message: 'Password is required' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/, {
      message:
        'Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    }),
  confirmPassword: zod.string().min(1, { message: 'Confirm Password is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = zod.infer<typeof schema>;

export function NewPasswordRequiredForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { email, rtype } = useAppSelector((state) => state.auth);
  const { showAlert } = useAlert();

  const [resetPassword, { isLoading: loading }] = useResetPasswordMutation();

  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { password: '', confirmPassword: '' },
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormData) => {
    const payload = {
      newPassword: values.password,
      identifier: email || '',
      type: rtype || 'email',
    };

    console.log(payload);

    try {
      const response = await resetPassword(payload).unwrap();

      dispatch(clearUserVType());
      dispatch(resetAwaitingOTPVerification());
      showAlert(response?.message || 'Password reset successful. Please login with your new password.', 'success');
      router.push(paths.auth.signIn);

    } catch (err: any) {
      showAlert(err?.message || err?.data?.message || 'Password reset failed.', 'error');
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6">
        <Link href={paths.home} className="inline-block w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/MINMEG 4.png" alt="Logo" className="h-[50px] w-auto" />
        </Link>
        <div className="space-y-1.5">
          <h2 className="text-3xl font-bold text-gray-900">New password required</h2>
          <p className="text-gray-500 text-sm">
            Set a strong password for your account to ensure it remains secure.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-5">
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                {...field}
                label="New Password"
                placeholder="Enter new password"
                type={showPassword ? 'text' : 'password'}
                error={errors.password?.message}
                disabled={loading}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <Input
                {...field}
                label="Confirm Password"
                placeholder="Confirm new password"
                type={showPassword ? 'text' : 'password'}
                error={errors.confirmPassword?.message}
                disabled={loading}
              />
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full py-6 text-base font-semibold"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
}
