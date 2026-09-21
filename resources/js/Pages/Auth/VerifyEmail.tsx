import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <>
            <Head title="Verify Email - Enrich Arcane PIMS" />

            <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col justify-between">
                {/* Background Image Layer */}
                <img
                    src="/images/EnrichArcane.jpg"
                    alt="Enrich Arcane Office"
                    className="absolute inset-0 h-full w-full object-cover object-center filter brightness-[0.20] contrast-[1.15] scale-105"
                />

                {/* Ambient Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/50" />
                <div className="absolute -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-blue-700/20 blur-[130px] pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 h-[450px] w-[450px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />

                {/* Top Navigation Bar */}
                <header className="relative z-10 px-6 py-6 lg:px-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1 backdrop-blur-md border border-white/20 shadow transition group-hover:border-blue-400">
                            <img
                                src="/images/logo.jpg"
                                alt="Enrich Arcane Logo"
                                className="h-full w-full object-contain rounded-lg"
                            />
                        </div>
                        <div>
                            <span className="text-sm font-bold tracking-tight text-white block leading-tight">
                                Enrich Arcane
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold">
                                PIMS Portal
                            </span>
                        </div>
                    </Link>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
                    >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log Out
                    </Link>
                </header>

                {/* Central Form Card */}
                <main className="relative z-10 flex flex-col items-center justify-center px-4 py-8 sm:px-6">
                    <div className="w-full sm:max-w-md">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/70 backdrop-blur-xl">
                            
                            {/* Icon & Title */}
                            <div className="mb-6 flex flex-col items-center text-center">
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg">
                                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-white">
                                    Verify Your Email
                                </h2>
                                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                                    Thanks for signing up! Please verify your email address by clicking on the link we just emailed to you. If you didn't receive it, we will gladly send you another.
                                </p>
                            </div>

                            {status === 'verification-link-sent' && (
                                <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-medium text-emerald-400 text-center">
                                    A new verification link has been sent to the email address you provided during registration.
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                <PrimaryButton
                                    className="w-full justify-center rounded-lg bg-blue-600 hover:bg-blue-500 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-600/30 transition focus:ring-2 focus:ring-blue-400"
                                    disabled={processing}
                                >
                                    {processing ? 'Sending...' : 'Resend Verification Email'}
                                </PrimaryButton>

                                <div className="text-center pt-2">
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="text-xs text-slate-400 hover:text-rose-400 underline transition focus:outline-none"
                                    >
                                        Log out of account
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 py-5 text-center text-xs text-slate-500 border-t border-white/5">
                    &copy; {new Date().getFullYear()} Enrich Arcane (Pvt) Ltd — Project Information Management System
                </footer>
            </div>
        </>
    );
}