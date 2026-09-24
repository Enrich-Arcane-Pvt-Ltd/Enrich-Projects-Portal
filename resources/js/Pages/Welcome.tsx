import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }: PageProps) {
    return (
        <>
            <Head title="Project Information Management System - Enrich Arcane" />

            {/* Main Wrapper with Background Office Image */}
            <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-100">
                {/* Background Image Layer */}
                <img
                    src="/images/EnrichArcane.jpg"
                    alt="Enrich Arcane Office"
                    className="absolute inset-0 h-full w-full object-cover object-center filter brightness-[0.22] contrast-[1.1] scale-105 transition-transform duration-1000"
                />

                {/* Modern Gradient & Vignette Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
                <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-blue-700/20 blur-[130px] pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />

                {/* Content Container */}
                <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-6 lg:px-16">
                    {/* Header / Navbar */}
                    <header className="flex items-center justify-between border-b border-white/10 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1 backdrop-blur-md border border-white/20 shadow-lg">
                                <img
                                    src="/images/logo.jpg"
                                    alt="Enrich Arcane Logo"
                                    className="h-full w-full object-contain rounded-lg"
                                />
                            </div>
                            <div>
                                <span className="text-base font-bold tracking-tight text-white block leading-tight">
                                    Enrich Arcane
                                </span>
                                <span className="text-[11px] uppercase tracking-widest text-blue-400 font-medium">
                                    Project Information Management System
                                </span>
                            </div>
                        </div>

                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={auth.user.role === 'admin' || auth.user.role === 'superadmin' ? '/admin' : route('dashboard')}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    {auth.user.role === 'admin' || auth.user.role === 'superadmin' ? 'Go to Admin Portal' : 'Go to Dashboard'}
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-lg bg-blue-600/90 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        Log in
                                    </Link>
                                    {/* <Link
                                        href={route('register')}
                                        className="rounded-lg bg-blue-600/90 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        Register
                                    </Link> */}
                                </>
                            )}
                        </nav>
                    </header>

                    {/* Main Hero & Grid Section */}
                    <main className="my-auto py-12">
                        <div className="mx-auto max-w-6xl">
                            {/* Headline */}
                            <div className="mb-10 text-center sm:text-left">
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md mb-4">
                                    <span className="inline-block size-2 rounded-full bg-blue-400 animate-pulse" />
                                    Project Information Management System
                                </div>
                                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
                                    Centralize, Monitor &amp; Deliver <br className="hidden sm:inline" />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                                        Engineering Projects
                                    </span>
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-400">
                                    Your IT Tool Box: manage lifecycle documentation, track team deliverables, and gain end-to-end visibility across all operational milestones.
                                </p>
                            </div>

                            {/* PIMS Highlight Cards */}
                            <div className="grid gap-5 md:grid-cols-3">
                                {/* Card 1 */}
                                <div className="group rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition duration-300 hover:border-blue-500/50 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-blue-500/10">
                                    <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition">
                                        Project Lifecycle
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                                        Track sprints, milestone deliveries, and status pipelines across client accounts with granular progress metrics.
                                    </p>
                                </div>

                                {/* Card 2 */}
                                <div className="group rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition duration-300 hover:border-blue-500/50 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-blue-500/10">
                                    <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition">
                                        Artifacts &amp; Documents
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                                        Securely archive architectural diagrams, technical specifications, and client contracts in one unified repository.
                                    </p>
                                </div>

                                {/* Card 3 */}
                                <div className="group rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition duration-300 hover:border-blue-500/50 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-blue-500/10">
                                    <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition">
                                        Resource Allocation
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                                        Coordinate internal developer bandwidth, hardware, and deployment environments seamlessly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="border-t border-white/10 py-5 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <span>&copy; {new Date().getFullYear()} Enrich Arcane (Pvt) Ltd — Your IT Tool Box</span>
                        <span className="text-slate-600">Project Information Management System</span>
                    </footer>
                </div>
            </div>
        </>
    );
}