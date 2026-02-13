
"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/utils/helper';

interface LogoProps {
    color?: 'light' | 'dark';
    height?: number;
    width?: number;
    className?: string;
}

export function Logo({ color = 'dark', height = 50, width = 120, className }: LogoProps) {
    return (
        <Link href="/" className={cn("inline-block", className)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={color === 'light' ? "/assets/MINMEG 4.png" : "/assets/MINMEG 4.png"}
                alt="MinMeg Logo"
                style={{ height, width: 'auto' }}
                className="object-contain"
            />
        </Link>
    );
}
