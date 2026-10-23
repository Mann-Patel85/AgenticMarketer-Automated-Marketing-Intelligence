'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function RedirectHelper() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        router.replace(`/auth/callback?${searchParams.toString()}`);
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
    );
}

export default function GoogleCallbackRedirectPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <RedirectHelper />
        </Suspense>
    );
}
