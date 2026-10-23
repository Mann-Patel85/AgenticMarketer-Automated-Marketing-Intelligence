import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const backendBase = (
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        'http://127.0.0.1:8000'
    )
        .trim()
        .replace(/\/+$/, '')
        .replace(/\/api$/, '');

    const backendCallbackUrl = `${backendBase}/api/auth/google/callback?${searchParams.toString()}`;
    return NextResponse.redirect(backendCallbackUrl);
}
