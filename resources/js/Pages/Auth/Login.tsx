import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in - Enrich Arcane PIMS" />

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
                            
                            {/* Card Header & Brand Icon */}
                            <div className="mb-6 flex flex-col items-center text-center">
                                <div className="mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20 shadow-lg">
                                    <img
                                        src="/images/logo.jpg"
                                        alt="Enrich Arcane Logo"
                                        className="h-full w-full object-contain rounded-xl"
                                    />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                                    Sign In to PIMS
                                </h2>
                                <p className="mt-1 text-xs text-slate-400">
                                    Enter your credentials to access the management portal
                                </p>
                            </div>

                            {status && (
                                <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm font-medium text-emerald-400">
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <InputLabel
                                        htmlFor="email"
                                        value="Email Address"
                                        className="!text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2 block"
                                    />

                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full rounded-xl border-slate-700/80 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                        placeholder="name@enricharcane.com"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />

                                    <InputError message={errors.email} className="mt-2 text-rose-400" />
                                </div>

                                {/* Password Field */}
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
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />

                                    <InputError message={errors.password} className="mt-2 text-rose-400" />
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center cursor-pointer">
                                        <Checkbox
                                            name="remember"
                                            checked={data.remember}
                                            className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                                            onChange={(e) =>
                                                setData(
                                                    'remember',
                                                    (e.target.checked || false) as false,
                                                )
                                            }
                                        />
                                        <span className="ms-2 text-xs text-slate-400">
                                            Remember me
                                        </span>
                                    </label>

                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs text-blue-400 hover:text-blue-300 underline focus:outline-none"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <PrimaryButton
                                        className="w-full justify-center rounded-lg bg-blue-600 hover:bg-blue-500 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-600/30 transition focus:ring-2 focus:ring-blue-400"
                                        disabled={processing}
                                    >
                                        {processing ? 'Signing In...' : 'Log In'}
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