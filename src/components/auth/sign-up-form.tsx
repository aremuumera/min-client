"use client";

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { useSignupMutation, useValidateInviteQuery } from '@/redux/features/AuthFeature/auth_api_rtk';

import { registerSuccess, setAwaitingOTPVerification, setUserEmail, setUserVType } from '@/redux/features/AuthFeature/auth_slice';
import { useAlert } from '@/providers/alert-provider';
import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/modal';
import PhoneNumberInput from '@/utils/phone-number-input';
import { countryOptions } from '@/utils/countries-state';
import { AppDispatch } from '@/redux/store';
import { cn } from '@/utils/helper';

const schema = zod.object({
  firstName: zod.string().min(1, { message: 'First name is required' }),
  lastName: zod.string().min(1, { message: 'Last name is required' }),
  email: zod.string().min(1, { message: 'Email is required' }).email(),
  companyName: zod.string().min(1, { message: 'Company name is required' }),
  termsAndConditions: zod.boolean().refine((value) => value, 'You must accept the terms and conditions'),
  password: zod
    .string()
    .min(1, { message: 'Password is required' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/, {
      message:
        'Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    }),
  confirmPassword: zod.string().min(1, { message: 'Confirm Password is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

type FormData = zod.infer<typeof schema>;

const defaultValues: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  termsAndConditions: false,
  confirmPassword: '',
  companyName: '',
};

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const inviteToken = searchParams.get('token');
  // const roleFromUrl = searchParams.get('role');

  // Validate invite if token exists
  const {
    data: inviteData,
    isLoading: validatingInvite,
    error: inviteError
  } = useValidateInviteQuery(inviteToken as string, {
    skip: !inviteToken,
  });

  const [signup, { isLoading: loading }] = useSignupMutation();

  const { showAlert } = useAlert();

  const [openModal, setOpenModal] = useState(false);
  const [verificationType, setVerificationType] = useState('email_verification');
  const [phoneData, setPhoneData] = useState({
    phoneNumber: '',
    countryCode: '',
    countryName: '',
    role: (inviteToken ? 'inspector' : 'buyer') as 'buyer' | 'supplier' | 'inspector',
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (inviteToken && inviteData) {
      setPhoneData(prev => ({
        ...prev,
        role: inviteData.role as 'buyer' | 'supplier' | 'inspector'
      }));
      // EMAIL PRE-FILL REMOVED FOR SECURITY: User must manually type their email to prove identity.
    }
  }, [inviteToken, inviteData]);

  const validatePhone = (value: string) => {
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!value.trim()) return 'Phone number is required.';
    if (!phoneRegex.test(value)) return 'Invalid phone number.';
    return null;
  };

  const onContinue = () => {
    const error = validatePhone(phoneData.phoneNumber);
    if (error) {
      setPhoneError(error);
      showAlert(error, 'error');
      return;
    }
    setOpenModal(true);
  };

  const onSubmit = async (values: FormData) => {
    if (!verificationType) {
      showAlert('Please select a verification method.', 'error');
      return;
    }

    const payload = {
      ...values,
      phoneNumber: phoneData.phoneNumber,
      countryCode: phoneData.countryCode,
      country: phoneData.countryName,
      role: phoneData.role,
      verificationType: verificationType,
      businessName: values.companyName,
      inviteToken: inviteToken || undefined,
    };

    try {
      const response = await signup(payload).unwrap();
      setOpenModal(false);
      dispatch(registerSuccess(response))
      dispatch(setUserEmail(values.email));
      dispatch(setUserVType(verificationType as any));
      showAlert(response?.message || 'Kindly check your email for an OTP', 'success');
      router.push(paths.auth.verifyCode);
    } catch (err: any) {
      showAlert(err?.message || err?.data?.message || 'An error occurred during signup. Please try again.', 'error');
    }
  };

  if (inviteToken && validatingInvite) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
        <p className="text-gray-500 font-medium">Validating your invitation...</p>
      </div>
    );
  }

  const roleMismatch = inviteToken && inviteData && inviteData.role !== phoneData.role;

  if (inviteToken && (inviteError || roleMismatch)) {
    const errorMsg = roleMismatch
      ? `This invitation is for a ${inviteData.role} account, but the link specified ${phoneData.role}.`
      : (inviteError as any)?.data?.message || 'The invitation link is invalid or has expired.';
    return (
      <div className="w-full space-y-8 animate-in fade-in duration-700">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-red-600 rotate-45" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Invalid Invitation</h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              {/* {errorMsg} */}
              If you believe this is an error, please contact support or your administrator.
            </p>
          </div>
          {/* <Button variant="outline" className="mt-4" onClick={() => router.push(paths.auth.signIn)}>
            Back to Sign In
          </Button> */}
        </div>
      </div>
    );
  }

  // Security check: If URL role exists but doesn't match invite role, we show the invite banner with the REAL role
  // This prevents fake URLs from misleading the user.

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6">
        <Link href={paths.home} className="inline-block w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/MINMEG 4.png" alt="Logo" className="h-[50px] w-auto" />
        </Link>
        <div className="space-y-1.5">
          <h2 className="text-3xl font-bold text-gray-900">Sign up</h2>
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <Link href={paths.auth.signIn} className="text-green-600 font-semibold hover:underline decoration-2 underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Role Selection or Invite Banner */}
        {inviteToken ? (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">You've been invited!</p>
              <p className="text-xs text-blue-700">
                You are signing up as a verified {phoneData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700 text-center">Sign up as a Buyer or Supplier</label>
            <div className="flex gap-2 p-1.5 bg-gray-100 rounded-full">
              <button
                onClick={() => setPhoneData({ ...phoneData, role: 'buyer' })}
                className={cn(
                  "flex-1 py-2 px-6 rounded-full text-sm font-semibold transition-all",
                  phoneData.role === 'buyer' ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                )}
                type="button"
              >
                Buyer
              </button>
              <button
                onClick={() => setPhoneData({ ...phoneData, role: 'supplier' })}
                className={cn(
                  "flex-1 py-2 px-6 rounded-full text-sm font-semibold transition-all",
                  phoneData.role === 'supplier' ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                )}
                type="button"
              >
                Supplier
              </button>
            </div>
          </div>
        )}

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <Input
                  {...field}
                  label="First name"
                  placeholder="John"
                  error={errors.firstName?.message}
                  disabled={loading}
                />
              )}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <Input
                  {...field}
                  label="Last name"
                  placeholder="Doe"
                  error={errors.lastName?.message}
                  disabled={loading}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="companyName"
            render={({ field }) => (
              <Input
                {...field}
                label="Company Name"
                placeholder="MinMeg Solutions"
                error={errors.companyName?.message}
                disabled={loading}
              />
            )}
          />

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  {...field}
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  disabled={loading}
                />
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <Input
                  {...field}
                  type="password"
                  label="Confirm Password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  disabled={loading}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="termsAndConditions"
            render={({ field }) => (
              <div className="space-y-1">
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  label={
                    <span className="text-sm text-gray-600">
                      I agree and have read the MinMeg <Link href="/terms" className="text-green-600 hover:underline">Terms</Link> and <Link href="/conditions" className="text-green-600 hover:underline">Conditions</Link>
                    </span>
                  }
                />
                {errors.termsAndConditions && <p className="text-xs text-red-500 ml-7">{errors.termsAndConditions.message}</p>}
              </div>
            )}
          />

          <Button
            type="button"
            onClick={handleSubmit(onContinue)}
            className="w-full py-6 text-base font-semibold"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Continue'}
          </Button>
        </form>
      </div>

      {/* Verification Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} size="md">
        <ModalHeader>Select Verification Method</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <p className="text-gray-600 text-sm">
              Please choose how you'd like to verify your account. We'll send a code to your selected method.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setVerificationType('email_verification')}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group",
                  verificationType === 'email_verification'
                    ? "border-green-600 bg-green-50"
                    : "border-gray-100 hover:border-gray-200 bg-gray-50"
                )}
              >
                <div>
                  <p className={cn("font-bold text-neutral-900", verificationType === 'email_verification' ? "text-green-900" : "text-gray-900")}>
                    Verify by Email
                  </p>
                  <p className="text-xs text-gray-500">Fast and secure verification</p>
                </div>
                <CheckCircle2 className={cn("w-5 h-5", verificationType === 'email_verification' ? "text-green-600" : "text-gray-300 group-hover:text-gray-400")} />
              </button>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 font-bold">
              <Button variant="text" onClick={() => setOpenModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit(onSubmit)} className="flex-1" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Submit'}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
