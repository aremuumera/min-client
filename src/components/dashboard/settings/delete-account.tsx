
"use client";
import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { Warning as WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning';

export function DeleteAccount() {
    return (
        <Card outlined className="border-red-100 bg-red-50/10">
            <CardHeader
                avatar={
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                        <WarningIcon size={20} />
                    </div>
                }
                title={<span className="text-lg font-bold text-red-900">Delete Account</span>}
            />
            <CardContent>
                <div className="space-y-6">
                    <p className="text-sm text-red-700 leading-relaxed max-w-xl">
                        Deleting your account will permanently remove all of your business data, product listings, and RFQ history. This action is irreversible and cannot be undone.
                    </p>
                    <Button
                        variant="outlined"
                        className="bg-white border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-lg font-bold text-xs px-6 py-2 h-auto transition-all shadow-sm"
                    >
                        Deactivate Account
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
