import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    // Utility classes applied to form children for contrast and spacing
    const formSectionStyles = `
        overflow-hidden rounded-2xl border border-white/10 bg-slate-900/85 p-6 sm:p-8 
        shadow-2xl shadow-black/70 backdrop-blur-xl transition hover:border-white/20
        [&_header_h2]:text-lg [&_header_h2]:font-bold [&_header_h2]:!text-white
        [&_header_p]:!text-slate-400 [&_header_p]:text-xs [&_header_p]:mt-1
        [&_label]:!text-slate-300 [&_label]:text-xs [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wider [&_label]:mb-2 [&_label]:block
        [&_input]:!bg-slate-950/80 [&_input]:!border-slate-700 [&_input]:!text-white [&_input]:placeholder:!text-slate-500
        [&_input]:px-4 [&_input]:py-3 [&_input]:rounded-xl [&_input]:text-sm [&_input]:shadow-inner
        [&_input:focus]:!border-blue-500 [&_input:focus]:!ring-2 [&_input:focus]:!ring-blue-500/30
        [&_button[type='submit']]:!bg-blue-600 [&_button[type='submit']]:hover:!bg-blue-500 [&_button[type='submit']]:!text-white [&_button[type='submit']]:px-6 [&_button[type='submit']]:py-2.5 [&_button[type='submit']]:rounded-xl [&_button[type='submit']]:shadow-lg [&_button[type='submit']]:shadow-blue-600/30
    `;

    return (
        <>
            <Head title="Profile Settings - Enrich Arcane PIMS" />

            <div className="relative min-h-screen w-full bg-slate-950 font-sans text-slate-100 flex flex-col justify-between">
                {/* Background Image Layer */}
                <img
                    src="/images/EnrichArcane.jpg"
                    alt="Enrich Arcane Office"
                    className="fixed inset-0 h-full w-full object-cover object-center filter brightness-[0.16] contrast-[1.15] scale-105 pointer-events-none"
                />

                {/* Ambient Gradients */}
                <div className="fixed inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60 pointer-events-none" />
                <div className="fixed -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-blue-700/15 blur-[140px] pointer-events-none" />
                <div className="fixed -bottom-32 -right-32 h-[450px] w-[450px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

                {/* Header */}
                <header className="relative z-10 border-b border-white/10 bg-slate-950/40 backdrop-blur-md px-6 py-5 lg:px-16 flex items-center justify-between">
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
                        href={route('dashboard')}
                        className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition focus:outline-none"
                    >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </header>

                {/* Main Content Area */}
                <main className="relative z-10 flex-1 py-10 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-xs font-semibold text-blue-300 backdrop-blur-md mb-2">
                                User Account
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                Account Settings
                            </h1>
                            <p className="mt-1 text-sm text-slate-400">
                                Manage your profile details, engineering credentials, and account security.
                            </p>
                        </div>

                        {/* Section 1: Profile Information */}
                        <section className={formSectionStyles}>
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </section>

                        {/* Section 2: Update Password */}
                        <section className={formSectionStyles}>
                            <UpdatePasswordForm className="max-w-xl" />
                        </section>

                        {/* Section 3: Delete Account */}
                        <section className={`${formSectionStyles} border-rose-500/20 hover:border-rose-500/40 [&_button]:!bg-rose-600 [&_button]:hover:!bg-rose-500`}>
                            <DeleteUserForm className="max-w-xl" />
                        </section>
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-white/5 py-5 text-center text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} Enrich Arcane (Pvt) Ltd — Project Information Management System
                </footer>
            </div>
        </>
    );
}