'use client';

import React from 'react';
import { GuestGuard } from '@/providers/guest-guard';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <GuestGuard>{children}</GuestGuard>;
}
