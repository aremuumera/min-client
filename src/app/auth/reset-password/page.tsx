
"use client";

import React from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { SplitLayout } from '@/components/auth/split-layout';

export default function ResetPasswordPage() {
  return (
    <SplitLayout>
      <ResetPasswordForm />
    </SplitLayout>
  );
}
