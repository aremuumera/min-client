import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/helper';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: number;
    color?: string;
}

export function Spinner({ size = 20, color = 'text-primary-600', className, ...props }: SpinnerProps) {
    return (
        <div className={cn('flex items-center justify-center', className)} {...props}>
            <Loader2 size={size} className={cn('animate-spin', color)} />
        </div>
    );
}
