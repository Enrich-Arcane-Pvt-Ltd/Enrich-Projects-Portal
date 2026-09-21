import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
            <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center gap-8">
                            <Link href="/dashboard" className="flex items-center gap-3 group">
                                <div className="h-10 w-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200 overflow-hidden shrink-0">
                                    <img
                                        src="/images/logo.png"
                                        alt="Enrich Arcane"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                                        Enrich Vault
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                            Developer Portal
                                        </span>
                                    </span>
                                    <span className="text-xs text-slate-400">Enrich Arcane (Pvt) Ltd</span>
                                </div>
                            </Link>
                        </div>

                        <div className="hidden sm:flex sm:items-center sm:gap-4">
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2.5 rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-sm font-medium text-slate-200 transition duration-150 ease-in-out hover:border-slate-600 hover:bg-slate-800 focus:outline-none"
                                        >
                                            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-[11px] font-bold text-white flex items-center justify-center">
                                                {user.name.charAt(0)}
                                            </div>
                                            <span>{user.name}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                                user.role === 'admin'
                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            }`}>
                                                {user.role}
                                            </span>
                                            <svg
                                                className="h-4 w-4 text-slate-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content contentClasses="py-1 bg-slate-900 border border-slate-800 shadow-xl rounded-lg">
                                        <div className="px-4 py-2 border-b border-slate-800 text-xs text-slate-400">
                                            Signed in as <span className="font-medium text-slate-200">{user.email}</span>
                                        </div>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                            className="text-slate-300 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white active:bg-slate-800"
                                        >
                                            Account Settings
                                        </Dropdown.Link>
                                        {user.role === 'admin' && (
                                            <a
                                                href="/admin"
                                                className="block w-full px-4 py-2 text-start text-sm leading-5 text-amber-300 hover:bg-amber-500/10 focus:bg-amber-500/10 focus:outline-none transition duration-150 ease-in-out"
                                            >
                                                Go to Admin Portal
                                            </a>
                                        )}
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 focus:bg-rose-500/10 focus:text-rose-300 active:bg-rose-500/20"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-300 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden border-b border-slate-800 bg-slate-900 px-4 pt-2 pb-3 space-y-1'
                    }
                >
                    <ResponsiveNavLink
                        href={route('dashboard')}
                        active={route().current('dashboard')}
                        className="text-slate-200"
                    >
                        My Projects
                    </ResponsiveNavLink>
                    {user.role === 'admin' && (
                        <a
                            href="/admin"
                            className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-slate-800"
                        >
                            Admin Portal
                        </a>
                    )}
                    <ResponsiveNavLink
                        href={route('profile.edit')}
                        className="text-slate-300"
                    >
                        Profile
                    </ResponsiveNavLink>
                    <ResponsiveNavLink
                        method="post"
                        href={route('logout')}
                        as="button"
                        className="text-rose-400"
                    >
                        Log Out
                    </ResponsiveNavLink>
                </div>
            </nav>

            {header && (
                <header className="border-b border-slate-800/60 bg-slate-900/40">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
