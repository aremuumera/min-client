"use client";

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { useLoginMutation } from '@/redux/features/AuthFeature/auth_api_rtk';

import { loginSuccess, setAwaitingOTPVerification, setUserEmail, setUserVType } from '@/redux/features/AuthFeature/auth_slice';
import { useAlert } from '@/providers/alert-provider';
import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppDispatch } from '@/redux/store';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email is required' }).email(),
  password: zod.string().min(1, { message: 'Password is required' }),
});

type FormData = zod.infer<typeof schema>;

const defaultValues: FormData = { email: '', password: '' };

export function SignInForm() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [login, { isLoading: loading }] = useLoginMutation();

  const { showAlert } = useAlert();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormData) => {
    const payload = {
      type: 'email',
      identifier: values.email,
      password: values.password,
    };

    try {
      const response = await login(payload).unwrap();

      dispatch(loginSuccess(response));

      console.log('response', response);

      showAlert(response?.message || 'Welcome back!', 'success');
      router.push(paths.dashboard.overview);

    } catch (err: any) {
      const status = err?.status;
      const message = err?.message || err?.data?.message || 'Login failed, Please try again later';

      if (status === 411) {
        dispatch(setUserEmail(values.email));
        dispatch(setUserVType('email_verification'));
        dispatch(setAwaitingOTPVerification());
        showAlert('Kindly verify your account, a 6 digit token has been sent to your mail', 'error');
        router.push(paths.auth.verifyCode);
      } else {
        showAlert(message, 'error');
      }
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
          <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
          <p className="text-gray-500 text-sm">
            Don&apos;t have an account?{' '}
            <Link href={paths.auth.signUp} className="text-green-600 font-semibold hover:underline decoration-2 underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-5">
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                {...field}
                label="Email address"
                placeholder="Enter your email"
                error={errors.email?.message}
                disabled={loading}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                {...field}
                label="Password"
                placeholder="Enter your password"
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
        </div>

        <div className="flex items-center justify-between">
          <Link href={paths.auth.resetPassword} className="text-sm font-semibold text-green-600 hover:underline underline-offset-4">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full py-6 text-base font-semibold"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
