
"use client";

import React from 'react';
import { NewPasswordRequiredForm } from '@/components/auth/new-password-required-form';
import { SplitLayout } from '@/components/auth/split-layout';

export default function NewPasswordRequiredPage() {
  return (
    <SplitLayout>
      <NewPasswordRequiredForm />
    </SplitLayout>
  );
}
