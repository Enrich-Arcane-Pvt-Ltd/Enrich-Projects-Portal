import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProjectVaultModal from '@/Components/ProjectVaultModal';
import ProjectFormModal from '@/Components/ProjectFormModal';
import {
    PROJECT_PRIORITY_OPTIONS,
    PROJECT_STATUS_LABELS,
    PROJECT_STATUS_OPTIONS,
    PROJECT_TYPE_OPTIONS,
    ProjectStatus,
} from '@/types/enums';
import type { AuditLog, DashboardStats, PageProps, Project, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type Scope = 'all' | 'my_created' | 'other_developers' | 'assigned';

interface DashboardProps extends PageProps {
    projects: Project[];
    stats: DashboardStats;
    recentAuditActivity: AuditLog[];
    availableDevelopers?: User[];
    filters: {
        search?: string;
        type?: string;
        status?: string;
        priority?: string;
    };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Full class names so Tailwind can see them at build time.
const STACK_DOTS: Record<string, string> = {
    laravel: 'bg-red-500',
    flutter: 'bg-sky-400',
    esp32: 'bg-amber-400',
    mqtt: 'bg-purple-400',
    mysql: 'bg-blue-400',
    redis: 'bg-rose-400',
    docker: 'bg-cyan-400',
    go: 'bg-teal-400',
    postgresql: 'bg-indigo-400',
    freertos: 'bg-lime-400',
    node: 'bg-green-500',
    timescaledb: 'bg-yellow-400',
};

const stackDot = (tech?: string) => {
    if (!tech) return 'bg-slate-500';
    const key = tech.trim().toLowerCase();
    const hit = Object.keys(STACK_DOTS).find((k) => key.startsWith(k));
    return hit ? STACK_DOTS[hit] : 'bg-slate-500';
};

const stackList = (project: Project) =>
    project.tech_stack ? project.tech_stack.split(',').map((t) => t.trim()).filter(Boolean) : [];

const statusStyle = (status: string) => {
    switch (status) {
        case ProjectStatus.IN_PROGRESS:
            return 'text-emerald-400 border-emerald-500/30';
        case ProjectStatus.PLANNING:
            return 'text-indigo-400 border-indigo-500/30';
        case ProjectStatus.MAINTENANCE:
            return 'text-amber-400 border-amber-500/30';
        case ProjectStatus.COMPLETED:
            return 'text-sky-400 border-sky-500/30';
        case ProjectStatus.ARCHIVED:
            return 'text-slate-400 border-slate-700';
        default:
            return 'text-slate-400 border-slate-700';
    }
};

const timeAgo = (iso?: string) => {
    if (!iso) return null;
    const diff = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(diff)) return null;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
    return new Date(iso).toLocaleDateString();
};

const resourceCounts = (p: Project) => [
    { label: 'Secrets', value: p.credentials?.length || 0 },
    { label: 'Clients', value: (p.client_access_credentials || p.clientAccessCredentials)?.length || 0 },
    { label: 'Servers', value: p.server_environments?.length || 0 },
    { label: 'Repos', value: p.links?.length || 0 },
    { label: 'IoT', value: p.iot_configurations?.length || 0 },
    { label: 'Devs', value: p.developers?.length || 0 },
];



const selectClass =
    'px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50';

/* ------------------------------------------------------------------ */
/* User Initials & Monogram Helper                                     */
/* ------------------------------------------------------------------ */

const getUserInitials = (name: string, allNames: string[] = []): string => {
    if (!name) return 'U';
    const trimmed = name.trim();
    if (!trimmed) return 'U';
    const firstChar = trimmed.charAt(0).toUpperCase();

    // Check if other users in the system share the same starting letter
    const hasSameFirstLetter = allNames.some((other) => {
        if (!other) return false;
        const otherTrimmed = other.trim();
        return (
            otherTrimmed.toLowerCase() !== trimmed.toLowerCase() &&
            otherTrimmed.charAt(0).toUpperCase() === firstChar
        );
    });

    // If only one user has this starting letter, display just the first letter
    if (!hasSameFirstLetter) {
        return firstChar;
    }

    // Multiple users start with the same letter: get the first letter and another letter
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
        // e.g. "Sunimal Opatha" -> "SO", "Super Admin" -> "SA"
        return `${firstChar}${parts[1].charAt(0).toUpperCase()}`;
    }
    if (trimmed.length > 1) {
        // Single word name: e.g. "Sunimal" -> "SU"
        return `${firstChar}${trimmed.charAt(1).toUpperCase()}`;
    }
    // Single-character name: deterministically pick another letter
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const seed = (trimmed.charCodeAt(0) * 7 + 11) % alphabet.length;
    return `${firstChar}${alphabet[seed]}`;
};

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function StatusPill({ status }: { status: string }) {
    const label = PROJECT_STATUS_LABELS[status as ProjectStatus] || status.replace('_', ' ');
    return (
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${statusStyle(status)}`}>
            {label}
        </span>
    );
}

function Avatar({
    name,
    allNames = [],
    size = 'h-8 w-8',
}: {
    name: string;
    allNames?: string[];
    size?: string;
}) {
    const initials = getUserInitials(name, allNames);
    return (
        <div
            title={name}
            className={`${size} rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center shrink-0 tracking-tight`}
        >
            {initials}
        </div>
    );
}

function StackDot({ tech }: { tech?: string }) {
    if (!tech) return null;
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`h-3 w-3 rounded-full ${stackDot(tech)}`} />
            {tech}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Dashboard({
    auth,
    projects,
    stats,
    recentAuditActivity,
    availableDevelopers = [],
    filters,
}: DashboardProps) {
    const [scopeFilter, setScopeFilter] = useState<Scope>('all');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || 'all');

    const selectedProject = useMemo(
        () => (selectedProjectId ? projects.find((p) => p.id === selectedProjectId) || null : null),
        [projects, selectedProjectId],
    );

    const hasActiveFilters =
        Boolean(searchQuery) || selectedType !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all';

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedType('all');
        setSelectedStatus('all');
        setSelectedPriority('all');
    };

    const openCreate = () => {
        setEditingProject(null);
        setIsFormModalOpen(true);
    };

    const filteredProjects = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return projects.filter((project) => {
            const matchesScope =
                scopeFilter === 'all' ||
                (scopeFilter === 'my_created' && Boolean(project.is_owner)) ||
                (scopeFilter === 'other_developers' && !project.is_owner) ||
                (scopeFilter === 'assigned' && Boolean(project.is_assigned));

            const matchesSearch =
                !q ||
                project.name.toLowerCase().includes(q) ||
                project.code.toLowerCase().includes(q) ||
                (project.tech_stack && project.tech_stack.toLowerCase().includes(q)) ||
                (project.description && project.description.toLowerCase().includes(q));

            return (
                matchesScope &&
                matchesSearch &&
                (selectedType === 'all' || project.type === selectedType) &&
                (selectedStatus === 'all' || project.status === selectedStatus) &&
                (selectedPriority === 'all' || project.priority === selectedPriority)
            );
        });
    }, [projects, scopeFilter, searchQuery, selectedType, selectedStatus, selectedPriority]);

    // Track user accesses per project in localStorage + backend audit interactions
    const [localAccessCounts, setLocalAccessCounts] = useState<Record<number, number>>(() => {
        try {
            const key = `pims_access_counts_${auth.user.id}`;
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    const recordProjectAccess = (projectId: number) => {
        setLocalAccessCounts((prev) => {
            const next = { ...prev, [projectId]: (prev[projectId] || 0) + 1 };
            try {
                localStorage.setItem(`pims_access_counts_${auth.user.id}`, JSON.stringify(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    // 4 projects of user most accessing
    const popularProjects = useMemo(() => {
        const getScore = (p: Project) => {
            const local = localAccessCounts[p.id] || 0;
            const audit = p.access_count || 0;
            const accesses = local + audit;
            const fallbackRank = (p.is_owner ? 0 : p.is_assigned ? 1 : 2) * 10 + (p.status === 'in_progress' ? 0 : 5);
            return { accesses, fallbackRank };
        };

        return [...projects]
            .sort((a, b) => {
                const scoreA = getScore(a);
                const scoreB = getScore(b);
                if (scoreB.accesses !== scoreA.accesses) {
                    return scoreB.accesses - scoreA.accesses;
                }
                return scoreA.fallbackRank - scoreB.fallbackRank;
            })
            .slice(0, 4);
    }, [projects, localAccessCounts]);

    // All distinct user names in the system for initial conflict detection
    const allUserNames = useMemo(() => {
        const set = new Set<string>();
        if (auth.user?.name) set.add(auth.user.name);
        availableDevelopers.forEach((d) => d.name && set.add(d.name));
        projects.forEach((p) => {
            if (p.lead_developer?.name) set.add(p.lead_developer.name);
            if (p.creator?.name) set.add(p.creator.name);
            p.developers?.forEach((d) => d.name && set.add(d.name));
        });
        return Array.from(set);
    }, [auth.user, availableDevelopers, projects]);

    const userInitials = useMemo(() => {
        return getUserInitials(auth.user.name, allUserNames);
    }, [auth.user.name, allUserNames]);

    // Project list pagination (8 per page)
    const PROJECTS_PER_PAGE = 8;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedType, selectedStatus, selectedPriority, scopeFilter]);

    const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);

    const paginatedProjects = useMemo(() => {
        const start = (currentPage - 1) * PROJECTS_PER_PAGE;
        return filteredProjects.slice(start, start + PROJECTS_PER_PAGE);
    }, [filteredProjects, currentPage]);

    // "People" sidebar block.
    const people = useMemo(() => {
        const map = new Map<string, string>();
        availableDevelopers.forEach((d) => map.set(String(d.id ?? d.name), d.name));
        projects.forEach((p) => {
            if (p.lead_developer) {
                const lead = p.lead_developer as { id?: number | string; name: string };
                map.set(String(lead.id ?? lead.name), lead.name);
            }
        });
        return Array.from(map.values());
    }, [availableDevelopers, projects]);

    // "Top languages" equivalent.
    const topStacks = useMemo(() => {
        const counts = new Map<string, number>();
        projects.forEach((p) => stackList(p).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name]) => name);
    }, [projects]);

    const tabs: { id: Scope; label: string; count: number }[] = [
        { id: 'all', label: 'All projects', count: stats.total_projects },
        { id: 'my_created', label: 'My created', count: stats.my_created_projects || 0 },
        { id: 'other_developers', label: 'Other developers', count: stats.other_developers_projects || 0 },
        { id: 'assigned', label: 'Assigned to me', count: stats.my_assigned_projects },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Developer Vault Dashboard" />

            <div className="py-5 sm:py-8 px-3.5 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto w-full min-w-0">
                {/* ---------------- Organization-style header ---------------- */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 min-w-0 w-full">
                    <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                        <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-xl bg-indigo-600 text-white text-xl sm:text-3xl font-bold flex items-center justify-center shrink-0 tracking-wider shadow-lg shadow-indigo-600/20">
                            {userInitials}
                        </div>
                        <div className="min-w-0 space-y-1 sm:space-y-2">
                            <h1 className="text-lg sm:text-2xl font-semibold text-white truncate">{auth.user.name}</h1>
                            <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-1 text-xs text-slate-400">
                                
                                <span className="capitalize font-medium text-slate-300">{auth.user.role}</span>
                                <span>•</span>
                                <span>{stats.total_projects} projects</span>
                                <span>•</span>
                                <span>{stats.total_credentials} secured secrets</span>
                            </div>
                        </div>
                    </div>

                    {auth.user.role === 'developer' && (
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors w-full sm:w-auto shadow-sm shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New project
                        </button>
                    )}
                </header>

                {/* ---------------- Tab navigation (scope filter) ---------------- */}
                <nav className="mt-6 sm:mt-8 border-b border-slate-800 flex gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-0.5 w-full max-w-full min-w-0">
                    {tabs.map((tab) => {
                        const active = scopeFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setScopeFilter(tab.id)}
                                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap border-b-2 -mb-px transition-colors shrink-0 ${
                                    active
                                        ? 'border-indigo-500 text-white font-semibold'
                                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                }`}
                            >
                                {tab.label}
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] sm:text-[11px] font-medium">
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* ---------------- Two-column body ---------------- */}
                <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_296px] gap-8 lg:gap-10 w-full min-w-0">
                    {/* ===== Main column ===== */}
                    <main className="space-y-8 sm:space-y-10 min-w-0 w-full">
                        {/* Popular projects */}
                        {scopeFilter === 'all' && popularProjects.length > 0 && (
                            <section className="space-y-3 w-full min-w-0">
                                <h2 className="text-base font-normal text-slate-100">Popular projects</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
                                    {popularProjects.map((project) => {
                                        const stack = stackList(project);
                                        return (
                                            <Link
                                                key={project.id}
                                                href={route('projects.show', project.id)}
                                                onClick={() => {
                                                    recordProjectAccess(project.id);
                                                }}
                                                className="text-left rounded-md border border-slate-800 bg-slate-900/50 hover:border-slate-600 transition-colors p-3.5 sm:p-4 flex flex-col gap-3 min-h-[112px] min-w-0 w-full"
                                            >
                                                <div className="flex items-start justify-between gap-2.5 min-w-0">
                                                    <span className="text-sm font-semibold text-sky-400 hover:underline break-words min-w-0 flex-1">
                                                        {project.name}
                                                    </span>
                                                    <div className="shrink-0">
                                                        <StatusPill status={project.status} />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-400 line-clamp-2 flex-1 break-words">
                                                    {project.description || project.code}
                                                </p>
                                                <div className="flex items-center gap-3 sm:gap-4 flex-wrap min-w-0">
                                                    <StackDot tech={stack[0]} />
                                                    {stack[1] && <StackDot tech={stack[1]} />}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Project list */}
                        <section className="space-y-4 w-full min-w-0">
                            <div className="flex items-center gap-2 text-slate-100">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                </svg>
                                <h2 className="text-base font-normal">Projects</h2>
                            </div>

                            {/* Toolbar */}
                            <div className="flex flex-col lg:flex-row gap-2.5 w-full min-w-0">
                                <div className="relative flex-1 w-full min-w-0">
                                    <svg
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Find a project by name, code or stack..."
                                        className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-md bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-2.5 w-full lg:w-auto min-w-0">
                                    <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={`${selectClass} w-full sm:w-auto min-w-0`}>
                                        <option value="all">All types</option>
                                        {PROJECT_TYPE_OPTIONS.map((t) => (
                                            <option key={t.id} value={t.id}>{t.label}</option>
                                        ))}
                                    </select>
                                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={`${selectClass} w-full sm:w-auto min-w-0`}>
                                        <option value="all">All statuses</option>
                                        {PROJECT_STATUS_OPTIONS.map((s) => (
                                            <option key={s.id} value={s.id}>{s.label}</option>
                                        ))}
                                    </select>
                                    <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className={`${selectClass} w-full sm:w-auto min-w-0`}>
                                        <option value="all">All priorities</option>
                                        {PROJECT_PRIORITY_OPTIONS.map((p) => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>
                                        <strong className="text-slate-200">{filteredProjects.length}</strong>{' '}
                                        {filteredProjects.length === 1 ? 'result' : 'results'}
                                    </span>
                                    <button onClick={resetFilters} className="text-indigo-400 hover:text-indigo-300 font-medium">
                                        Clear filters
                                    </button>
                                </div>
                            )}

                            {/* Rows */}
                            {filteredProjects.length === 0 ? (
                                <div className="rounded-md border border-slate-800 p-8 sm:p-12 text-center space-y-1">
                                    <h3 className="text-sm font-semibold text-slate-200">No projects match these filters</h3>
                                    <p className="text-xs text-slate-500">Clear the filters or switch tabs to see more projects.</p>
                                </div>
                            ) : (
                                <ul className="rounded-md border border-slate-800 divide-y divide-slate-800 overflow-hidden w-full min-w-0">
                                    {paginatedProjects.map((project) => {
                                        const stack = stackList(project);
                                        const updated = timeAgo((project as { updated_at?: string }).updated_at);
                                        return (
                                            <li key={project.id} className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 hover:bg-slate-900/40 transition-colors w-full min-w-0">
                                                <div className="min-w-0 space-y-2 flex-1 w-full">
                                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                        <Link
                                                            href={route('projects.show', project.id)}
                                                            onClick={() => {
                                                                recordProjectAccess(project.id);
                                                            }}
                                                            className="text-base font-semibold text-sky-400 hover:underline text-left break-words min-w-0"
                                                        >
                                                            {project.name}
                                                        </Link>
                                                        <StatusPill status={project.status} />
                                                    </div>

                                                    {project.description && (
                                                        <p className="text-sm text-slate-400 line-clamp-2 max-w-2xl break-words min-w-0">{project.description}</p>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs text-slate-400 min-w-0">
                                                        {stack.slice(0, 3).map((t) => (
                                                            <StackDot key={t} tech={t} />
                                                        ))}
                                                        {resourceCounts(project)
                                                            .filter((r) => r.value > 0)
                                                            .map((r) => (
                                                                <span key={r.label} className="shrink-0">
                                                                    {r.value} {r.label}
                                                                </span>
                                                            ))}
                                                        {project.lead_developer && <span className="break-words">Lead: {project.lead_developer.name}</span>}
                                                        {updated && <span className="shrink-0">Updated {updated}</span>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto min-w-0">
                                                    {project.is_owner && (
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingProject(project);
                                                                    setIsFormModalOpen(true);
                                                                }}
                                                                className="p-2 rounded-md border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                                                                title="Edit project details"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm(`Are you sure you want to delete project "${project.name}"? This will permanently delete all associated credentials, servers, and configuration.`)) {
                                                                        router.delete(`/developer/projects/${project.id}`);
                                                                    }
                                                                }}
                                                                className="p-2 rounded-md border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 transition-colors"
                                                                title="Delete project"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    <Link
                                                        href={route('projects.show', project.id)}
                                                        onClick={() => {
                                                            recordProjectAccess(project.id);
                                                        }}
                                                        className="px-3.5 py-1.5 rounded-md border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-200 text-xs font-semibold transition-colors"
                                                    >
                                                        Open vault
                                                    </Link>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {/* Pagination (8 per page) */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-400 w-full min-w-0">
                                    <div className="text-center sm:text-left">
                                        Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * PROJECTS_PER_PAGE + 1}</span> to{' '}
                                        <span className="font-semibold text-slate-200">{Math.min(currentPage * PROJECTS_PER_PAGE, filteredProjects.length)}</span> of{' '}
                                        <span className="font-semibold text-slate-200">{filteredProjects.length}</span> projects
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-2.5 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`min-w-[32px] h-8 px-2 rounded-md border text-xs font-semibold transition-colors ${
                                                    currentPage === pageNum
                                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                                                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-2.5 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </main>

                    {/* ===== Sidebar ===== */}
                    <aside className="space-y-8 w-full min-w-0">
                        {/* People */}
                        {people.length > 0 && (
                            <section className="space-y-3 pb-8 border-b border-slate-800 w-full min-w-0">
                                <h2 className="text-base font-normal text-slate-100">People</h2>
                                <div className="flex flex-wrap gap-1.5 min-w-0">
                                    {people.map((name) => (
                                        <Avatar key={name} name={name} allNames={allUserNames} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Vault overview */}
                        <section className="space-y-3 pb-8 border-b border-slate-800 w-full min-w-0">
                            <h2 className="text-base font-normal text-slate-100">Vault overview</h2>
                            <dl className="space-y-2 text-sm">
                                {[
                                    { label: 'Active in development', value: stats.active_projects },
                                    { label: 'Secured secrets (AES-256)', value: stats.total_credentials },
                                    { label: 'Created by you', value: stats.my_created_projects || 0 },
                                    { label: 'Assigned to you', value: stats.my_assigned_projects },
                                ].map((row) => (
                                    <div key={row.label} className="flex items-center justify-between gap-3 min-w-0">
                                        <dt className="text-slate-400 truncate min-w-0 flex-1">{row.label}</dt>
                                        <dd className="font-semibold text-slate-100 shrink-0">{row.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>

                        {/* Top stacks */}
                        {topStacks.length > 0 && (
                            <section className="space-y-3 pb-8 border-b border-slate-800 w-full min-w-0">
                                <h2 className="text-base font-normal text-slate-100">Top stacks</h2>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 min-w-0">
                                    {topStacks.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setSearchQuery(t)}
                                            className="hover:text-white text-slate-400"
                                            title={`Filter by ${t}`}
                                        >
                                            <StackDot tech={t} />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Recent activity */}
                        {recentAuditActivity && recentAuditActivity.length > 0 && (
                            <section className="space-y-3 w-full min-w-0">
                                <h2 className="text-base font-normal text-slate-100">Your recent activity</h2>
                                <ul className="space-y-3 w-full min-w-0">
                                    {recentAuditActivity.map((log) => (
                                        <li key={log.id} className="text-xs space-y-1 w-full min-w-0">
                                            <div className="flex items-start gap-2 w-full min-w-0">
                                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium uppercase shrink-0 mt-0.5">
                                                    {log.action_type}
                                                </span>
                                                <span className="text-slate-300 font-mono text-[11px] break-words min-w-0 flex-1" title={log.target_field}>
                                                    {log.target_field}
                                                </span>
                                            </div>
                                            <div className="text-slate-500 text-[11px]">{new Date(log.created_at).toLocaleString()}</div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </aside>
                </div>
            </div>

            {/* Interactive vault slide-over / modal */}
            <ProjectVaultModal
                project={selectedProject}
                isOpen={Boolean(selectedProject)}
                onClose={() => setSelectedProjectId(null)}
                availableDevelopers={availableDevelopers}
            />

            {/* Create & edit project modal */}
            <ProjectFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setEditingProject(null);
                }}
                projectToEdit={editingProject}
            />
        </AuthenticatedLayout>
    );
}