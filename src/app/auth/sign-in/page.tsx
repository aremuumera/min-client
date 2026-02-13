
"use client";

import React from 'react';
import { SignInForm } from '@/components/auth/sign-in-form';
import { SplitLayout } from '@/components/auth/split-layout';

export default function SignInPage() {
  return (
    <SplitLayout>
      <SignInForm />
    </SplitLayout>
  );
}
