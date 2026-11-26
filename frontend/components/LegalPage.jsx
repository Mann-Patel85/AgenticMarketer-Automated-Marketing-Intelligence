import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Contact shown on the legal pages. Set NEXT_PUBLIC_CONTACT_EMAIL in Vercel to publish an address.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';

export function ContactLine() {
    return CONTACT_EMAIL ? (
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">
            {CONTACT_EMAIL}
        </a>
    ) : (
        <span>your workspace administrator</span>
    );
}

export function Section({ title, children }) {
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <div className="space-y-3 text-sm leading-relaxed text-slate-300">{children}</div>
        </section>
    );
}

export default function LegalPage({ title, updated, intro, children }) {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to AgenticMarketer
            </Link>

            <article className="cyber-card rounded-3xl p-6 sm:p-10 space-y-8">
                <header className="space-y-2 border-b border-slate-800 pb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
                    <p className="text-sm text-slate-400">Last updated: {updated}</p>
                    {intro && <p className="text-sm leading-relaxed text-slate-300 pt-2">{intro}</p>}
                </header>
                {children}
            </article>

            <p className="text-center text-sm text-slate-500 mt-8">
                <Link href="/terms" className="hover:text-slate-300">Terms of Service</Link>
                <span className="mx-2">·</span>
                <Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
            </p>
        </div>
    );
}
