import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useMemo } from 'react';

export const getUserInitials = (name?: string): string => {
    if (!name) return 'U';
    const trimmed = name.trim();
    if (!trimmed) return 'U';
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
        return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
    }
    if (trimmed.length > 1) {
        return `${trimmed.charAt(0).toUpperCase()}${trimmed.charAt(1).toUpperCase()}`;
    }
    return trimmed.charAt(0).toUpperCase();
};

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const userInitials = useMemo(() => getUserInitials(user?.name), [user?.name]);

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white w-full max-w-full overflow-x-hidden flex flex-col justify-between">
            <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md w-full">
                <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
                            <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200 overflow-hidden shrink-0">
                                    <img
                                        src="/images/logo.png"
                                        alt="Enrich Arcane"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5 sm:gap-2 truncate">
                                        Enrich Vault
                                        <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                            Developer Portal
                                        </span>
                                    </span>
                                    <span className="text-[11px] sm:text-xs text-slate-400 truncate">Enrich Arcane (Pvt) Ltd</span>
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
                                            <div className="h-6 w-6 rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold flex items-center justify-center tracking-tight">
                                                {userInitials}
                                            </div>
                                            <span>{user.name}</span>
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700/60">
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
                                aria-label="Toggle navigation menu"
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
                        ' sm:hidden border-b border-slate-800 bg-slate-900 px-4 pt-3 pb-4 space-y-2'
                    }
                >
                    {/* User identifier card in mobile menu */}
                    <div className="px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center shrink-0 tracking-tight">
                            {userInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-white truncate flex items-center gap-2">
                                <span>{user.name}</span>
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-700">
                                    {user.role}
                                </span>
                            </div>
                            <div className="text-xs text-slate-400 truncate">{user.email}</div>
                        </div>
                    </div>

                    <ResponsiveNavLink
                        href={route('dashboard')}
                        active={route().current('dashboard')}
                    >
                        My Projects
                    </ResponsiveNavLink>
                    {user.role === 'admin' && (
                        <a
                            href="/admin"
                            className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-semibold text-amber-400 hover:bg-slate-800/80 transition"
                        >
                            Admin Portal
                        </a>
                    )}
                    <ResponsiveNavLink
                        href={route('profile.edit')}
                        active={route().current('profile.edit')}
                    >
                        Profile Settings
                    </ResponsiveNavLink>
                    <ResponsiveNavLink
                        method="post"
                        href={route('logout')}
                        as="button"
                        className="!text-rose-400 hover:!bg-rose-500/10"
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

            <main className="w-full max-w-full min-w-0 flex-1">{children}</main>

            {/* Footer */}
            <footer className="relative z-10 py-5 text-center text-xs text-slate-500 border-t border-white/5 mt-auto">
                &copy; {new Date().getFullYear()} Enrich Arcane (Pvt) Ltd — Project Information Management System
            </footer>
        </div>
    );
}
