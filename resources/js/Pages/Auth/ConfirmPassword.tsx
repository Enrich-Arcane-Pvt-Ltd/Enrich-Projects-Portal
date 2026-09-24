import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Confirm Password - Enrich Arcane PIMS" />

            <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col justify-between">
                {/* Office Background Image Layer */}
                <img
                    src="/images/EnrichArcane.jpg"
                    alt="Enrich Arcane Office"
                    className="absolute inset-0 h-full w-full object-cover object-center filter brightness-[0.20] contrast-[1.15] scale-105"
                />

                {/* Ambient Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/50" />
                <div className="absolute -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-blue-700/20 blur-[130px] pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 h-[450px] w-[450px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />

                {/* Header / Brand Navigation */}
                <header className="relative z-10 px-4 py-4 sm:px-6 sm:py-6 lg:px-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1 backdrop-blur-md border border-white/20 shadow transition group-hover:border-blue-400 shrink-0">
                            <img
                                src="/images/logo.jpg"
                                alt="Enrich Arcane Logo"
                                className="h-full w-full object-contain rounded-lg"
                            />
                        </div>
                        <div>
                            <span className="text-xs sm:text-sm font-bold tracking-tight text-white block leading-tight">
                                Enrich Arcane
                            </span>
                            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-blue-400 font-semibold">
                                PIMS Portal
                            </span>
                        </div>
                    </Link>

                    <Link
                        href="/"
                        className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
                    >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="hidden sm:inline">Back to Home</span>
                        <span className="sm:hidden">Home</span>
                    </Link>
                </header>

                {/* Central Form Card */}
                <main className="relative z-10 flex flex-col items-center justify-center px-3.5 py-6 sm:px-6 sm:py-8">
                    <div className="w-full sm:max-w-md">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-8 shadow-2xl shadow-black/70 backdrop-blur-xl">
                            
                            {/* Card Header with Security Lock Icon */}
                            <div className="mb-6 flex flex-col items-center text-center">
                                <div className="mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg">
                                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                                    Confirm Password
                                </h2>
                                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                                    This is a secure area of the management system. Please confirm your password before continuing.
                                </p>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <InputLabel
                                        htmlFor="password"
                                        value="Password"
                                        className="!text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2 block"
                                    />

                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full rounded-xl border-slate-700/80 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                        placeholder="••••••••"
                                        isFocused={true}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />

                                    <InputError message={errors.password} className="mt-2 text-rose-400" />
                                </div>

                                <div className="pt-2">
                                    <PrimaryButton
                                        className="w-full justify-center rounded-lg bg-blue-600 hover:bg-blue-500 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-600/30 transition focus:ring-2 focus:ring-blue-400"
                                        disabled={processing}
                                    >
                                        {processing ? 'Verifying...' : 'Confirm'}
                                    </PrimaryButton>
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