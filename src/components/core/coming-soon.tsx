
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

interface ComingSoonProps {
    title?: string;
    description?: string;
    backPath?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
    title = "Feature Coming Soon",
    description = "We're working hard to bring you this feature. Stay tuned for updates!",
    backPath = "/dashboard"
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-green-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
            <p className="text-gray-600 max-w-md mb-8">
                {description}
            </p>
            <Link href={backPath}>
                <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                    <Home size={18} />
                    Back to Dashboard
                </Button>
            </Link>
        </div>
    );
};
