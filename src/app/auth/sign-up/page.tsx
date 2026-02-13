
"use client";

import React from 'react';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { SplitLayout } from '@/components/auth/split-layout';

export default function SignUpPage() {
  return (
    <SplitLayout>
      <SignUpForm />
    </SplitLayout>
  );
}
