'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTeamSetupMutation } from '@/redux/features/AuthFeature/auth_api_rtk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/utils/logo';
import { paths } from '@/config/paths';

function TeamSetupForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [teamSetup, { isLoading }] = useTeamSetupMutation();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error("Invalid or missing invitation token");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            await teamSetup({ token, password }).unwrap();
            toast.success("Account setup successfully! Please login.");
            router.push(paths.auth.signIn);
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to setup account");
        }
    };

    if (!token) {
        return (
            <div className="text-center text-red-500">
                <h3 className="text-lg font-bold">Invalid Invitation</h3>
                <p>The invitation link is missing the token. Please check the link in your email.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl border border-neutral-200">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
                <Logo height={40} />
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mt-4">Welcome to the Team</h2>
                <p className="text-sm text-neutral-500">Set your password to join the company workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Input
                        label="Create Password"
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Min 6 characters"
                        endAdornment={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Input
                        label="Confirm Password"
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter password"
                    />
                </div>

                <Button type="submit" variant="contained" color="primary" fullWidth loading={isLoading}>
                    {isLoading ? "Setting up..." : "Complete Setup"}
                </Button>
            </form>
        </div>
    );
}

export default function TeamSetupPage() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-green-600" />}>
                <TeamSetupForm />
            </Suspense>
        </div>
    );
}
