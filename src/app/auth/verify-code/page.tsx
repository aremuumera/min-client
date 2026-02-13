
"use client";

import React from 'react';
import { VerifyCodeForm } from '@/components/auth/verify-code-form';
import { SplitLayout } from '@/components/auth/split-layout';

export default function VerifyCodePage() {
  return (
    <SplitLayout>
      <VerifyCodeForm />
    </SplitLayout>
  );
}
