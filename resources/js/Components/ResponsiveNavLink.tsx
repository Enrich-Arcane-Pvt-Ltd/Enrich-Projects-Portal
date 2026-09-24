import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out focus:outline-none ${
                active
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            } ${className}`}
        >
            {children}
        </Link>
    );
}
