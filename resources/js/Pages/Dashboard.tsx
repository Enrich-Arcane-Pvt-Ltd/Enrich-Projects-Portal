import AuthenticatedLayout, { getUserInitials } from '@/Layouts/AuthenticatedLayout';
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
    availableAdmins?: User[];
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
    react: 'bg-cyan-400',
    vue: 'bg-emerald-400',
    angular: 'bg-red-600',
    next: 'bg-slate-200',
    svelte: 'bg-orange-500',
    flutter: 'bg-sky-400',
    esp32: 'bg-amber-400',
    mqtt: 'bg-purple-400',
    mysql: 'bg-blue-400',
    mongo: 'bg-emerald-500',
    mongodb: 'bg-emerald-500',
    express: 'bg-amber-500',
    redis: 'bg-rose-400',
    docker: 'bg-cyan-400',
    kubernetes: 'bg-blue-500',
    go: 'bg-teal-400',
    golang: 'bg-teal-400',
    postgresql: 'bg-indigo-400',
    postgres: 'bg-indigo-400',
    freertos: 'bg-lime-400',
    node: 'bg-green-500',
    nodejs: 'bg-green-500',
    timescaledb: 'bg-yellow-400',
    python: 'bg-blue-400',
    django: 'bg-emerald-600',
    fastapi: 'bg-teal-500',
    flask: 'bg-slate-300',
    typescript: 'bg-blue-500',
    ts: 'bg-blue-500',
    javascript: 'bg-yellow-400',
    js: 'bg-yellow-400',
    java: 'bg-red-500',
    spring: 'bg-green-500',
    php: 'bg-indigo-400',
    rust: 'bg-orange-600',
    csharp: 'bg-purple-500',
    dotnet: 'bg-purple-600',
    swift: 'bg-orange-500',
    kotlin: 'bg-violet-400',
    aws: 'bg-amber-500',
    firebase: 'bg-amber-400',
    graphql: 'bg-pink-500',
    tailwind: 'bg-sky-400',
};

// Curated vibrant fallback palette for any new or custom tech stacks added by developers.
const FALLBACK_PALETTE = [
    'bg-emerald-400',
    'bg-violet-400',
    'bg-orange-400',
    'bg-pink-400',
    'bg-fuchsia-400',
    'bg-indigo-400',
    'bg-teal-400',
    'bg-lime-400',
    'bg-amber-400',
    'bg-cyan-400',
    'bg-rose-400',
    'bg-sky-400',
    'bg-purple-400',
    'bg-blue-400',
    'bg-yellow-400',
    'bg-red-400',
];

const getFallbackDot = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    const idx = Math.abs(hash) % FALLBACK_PALETTE.length;
    return FALLBACK_PALETTE[idx];
};

const stackDot = (tech?: string) => {
    if (!tech) return 'bg-slate-500';
    const raw = tech.trim().toLowerCase();
    const clean = raw.replace(/[^a-z0-9]/g, '');

    // Check direct or prefix matches on raw or clean string
    const hit = Object.keys(STACK_DOTS).find(
        (k) => raw.startsWith(k) || clean.startsWith(k) || clean.includes(k) || k.includes(clean)
    );
    if (hit) return STACK_DOTS[hit];

    // If tech stack is custom/unmapped, generate a consistent vibrant color
    return getFallbackDot(clean || raw);
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

const formatRole = (role?: string) => {
    if (!role) return 'Team Member';
    if (role === 'qa') return 'QA Engineer';
    if (role === 'developer') return 'Developer';
    if (role === 'admin') return 'Administrator';
    if (role === 'superadmin') return 'Super Admin';
    return role.charAt(0).toUpperCase() + role.slice(1);
};

const formatMemberSince = (iso?: string) => {
    if (!iso) return 'Recently joined';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const formatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const now = new Date();
    let years = now.getFullYear() - date.getFullYear();
    let months = now.getMonth() - date.getMonth();
    if (months < 0) {
        years--;
        months += 12;
    }

    let diffText = '';
    if (years > 0 && months > 0) {
        diffText = ` (${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'} ago)`;
    } else if (years > 0) {
        diffText = ` (${years} ${years === 1 ? 'year' : 'years'} ago)`;
    } else if (months > 0) {
        diffText = ` (${months} ${months === 1 ? 'month' : 'months'} ago)`;
    } else {
        const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        diffText = days > 0 ? ` (${days} ${days === 1 ? 'day' : 'days'} ago)` : ' (recently joined)';
    }

    return `${formatted}${diffText}`;
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
    size = 'h-8 w-8',
}: {
    name: string;
    allNames?: string[];
    size?: string;
}) {
    const initials = getUserInitials(name);
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
    availableAdmins = [],
    filters,
}: DashboardProps) {
    const [scopeFilter, setScopeFilter] = useState<Scope>('all');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Project deletion approval request states
    const [deletionRequestProject, setDeletionRequestProject] = useState<Project | null>(null);
    const [pendingDeletionProject, setPendingDeletionProject] = useState<Project | null>(null);
    const [approvedDeletionProject, setApprovedDeletionProject] = useState<Project | null>(null);
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');
    const [deletionReason, setDeletionReason] = useState<string>('');
    const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);

    // Project edit permission request states (for completed projects)
    const [editPermissionRequestProject, setEditPermissionRequestProject] = useState<Project | null>(null);
    const [pendingEditPermissionProject, setPendingEditPermissionProject] = useState<Project | null>(null);
    const [selectedEditAdminId, setSelectedEditAdminId] = useState<string>('');
    const [editPermissionReason, setEditPermissionReason] = useState<string>('');
    const [isSubmittingEditPermission, setIsSubmittingEditPermission] = useState(false);

    // Project access request states (for developers requesting access to unassigned/unowned projects)
    const [accessRequestProject, setAccessRequestProject] = useState<Project | null>(null);
    const [pendingAccessProject, setPendingAccessProject] = useState<Project | null>(null);
    const [rejectedAccessProject, setRejectedAccessProject] = useState<Project | null>(null);
    const [selectedAccessAdminId, setSelectedAccessAdminId] = useState<string>('');
    const [accessReason, setAccessReason] = useState<string>('');
    const [isSubmittingAccess, setIsSubmittingAccess] = useState(false);

    // Selected user for profile modal/drawer view
    const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);

    const handleEditClick = (project: Project) => {
        if (project.status === ProjectStatus.COMPLETED) {
            if (project.edit_permission_status === 'approved') {
                setEditingProject(project);
                setIsFormModalOpen(true);
            } else if (project.edit_permission_status === 'pending') {
                setPendingEditPermissionProject(project);
            } else {
                setEditPermissionRequestProject(project);
                setSelectedEditAdminId(availableAdmins[0]?.id ? String(availableAdmins[0].id) : '');
                setEditPermissionReason('');
            }
        } else {
            setEditingProject(project);
            setIsFormModalOpen(true);
        }
    };

    const submitEditPermissionRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editPermissionRequestProject || !selectedEditAdminId) return;

        setIsSubmittingEditPermission(true);
        router.post(
            `/developer/projects/${editPermissionRequestProject.id}/request-edit-permission`,
            {
                admin_id: selectedEditAdminId,
                reason: editPermissionReason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditPermissionRequestProject(null);
                    setEditPermissionReason('');
                },
                onFinish: () => setIsSubmittingEditPermission(false),
            }
        );
    };

    const cancelEditPermissionRequest = (projectId: number) => {
        setIsSubmittingEditPermission(true);
        router.post(
            `/developer/projects/${projectId}/cancel-edit-permission-request`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setPendingEditPermissionProject(null),
                onFinish: () => setIsSubmittingEditPermission(false),
            }
        );
    };

    const handleDeleteClick = (project: Project) => {
        if (project.deletion_status === 'approved') {
            setApprovedDeletionProject(project);
        } else if (project.deletion_status === 'pending') {
            setPendingDeletionProject(project);
        } else {
            setDeletionRequestProject(project);
            setSelectedAdminId(availableAdmins[0]?.id ? String(availableAdmins[0].id) : '');
            setDeletionReason('');
        }
    };

    const submitDeletionRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletionRequestProject || !selectedAdminId) return;

        setIsSubmittingDeletion(true);
        router.post(
            `/developer/projects/${deletionRequestProject.id}/request-deletion`,
            {
                admin_id: selectedAdminId,
                reason: deletionReason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDeletionRequestProject(null);
                    setDeletionReason('');
                },
                onFinish: () => setIsSubmittingDeletion(false),
            }
        );
    };

    const cancelDeletionRequest = (projectId: number) => {
        setIsSubmittingDeletion(true);
        router.post(
            `/developer/projects/${projectId}/cancel-deletion-request`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setPendingDeletionProject(null),
                onFinish: () => setIsSubmittingDeletion(false),
            }
        );
    };

    const executeApprovedDelete = (projectId: number) => {
        setIsSubmittingDeletion(true);
        router.delete(`/developer/projects/${projectId}`, {
            preserveScroll: true,
            onSuccess: () => setApprovedDeletionProject(null),
            onFinish: () => setIsSubmittingDeletion(false),
        });
    };

    const handleAccessClick = (project: Project) => {
        if (project.access_request?.status === 'pending') {
            setPendingAccessProject(project);
        } else if (project.access_request?.status === 'rejected') {
            setRejectedAccessProject(project);
        } else {
            setAccessRequestProject(project);
            setSelectedAccessAdminId(availableAdmins[0]?.id ? String(availableAdmins[0].id) : '');
            setAccessReason('');
        }
    };

    const submitAccessRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessRequestProject || !selectedAccessAdminId) return;

        setIsSubmittingAccess(true);
        router.post(
            `/developer/projects/${accessRequestProject.id}/request-access`,
            {
                admin_id: selectedAccessAdminId,
                reason: accessReason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAccessRequestProject(null);
                    setAccessReason('');
                },
                onFinish: () => setIsSubmittingAccess(false),
            }
        );
    };

    const cancelAccessRequest = (projectId: number) => {
        setIsSubmittingAccess(true);
        router.post(
            `/developer/projects/${projectId}/cancel-access-request`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setPendingAccessProject(null),
                onFinish: () => setIsSubmittingAccess(false),
            }
        );
    };

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

        const list = auth.user.role === 'qa'
            ? projects.filter((p) => p.is_assigned)
            : projects;

        return [...list]
            .sort((a, b) => {
                const scoreA = getScore(a);
                const scoreB = getScore(b);
                if (scoreB.accesses !== scoreA.accesses) {
                    return scoreB.accesses - scoreA.accesses;
                }
                return scoreA.fallbackRank - scoreB.fallbackRank;
            })
            .slice(0, 4);
    }, [projects, localAccessCounts, auth.user.role]);

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
        return getUserInitials(auth.user.name);
    }, [auth.user.name]);

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

    // "People" sidebar block - exclude current logged-in user
    const people = useMemo<User[]>(() => {
        const map = new Map<number, User>();

        // Add from availableDevelopers (excluding current logged-in user)
        availableDevelopers.forEach((dev) => {
            if (dev.id && dev.id !== auth.user.id) {
                map.set(dev.id, dev);
            }
        });

        // Also add from projects (leadDeveloper, manager, developers pivot, creator)
        projects.forEach((p) => {
            if (p.lead_developer && p.lead_developer.id && p.lead_developer.id !== auth.user.id) {
                const existing = map.get(p.lead_developer.id);
                map.set(p.lead_developer.id, { ...p.lead_developer, ...existing });
            }
            if (p.manager && p.manager.id && p.manager.id !== auth.user.id) {
                const existing = map.get(p.manager.id);
                map.set(p.manager.id, { ...p.manager, ...existing });
            }
            if (p.creator && p.creator.id && p.creator.id !== auth.user.id) {
                const existing = map.get(p.creator.id);
                map.set(p.creator.id, { ...p.creator, ...existing });
            }
            if (p.developers && Array.isArray(p.developers)) {
                p.developers.forEach((dev) => {
                    if (dev.id && dev.id !== auth.user.id) {
                        const existing = map.get(dev.id);
                        map.set(dev.id, { ...dev, ...existing });
                    }
                });
            }
        });

        return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [availableDevelopers, projects, auth.user.id]);

    // Projects associated with the selected profile user
    const userCollaboratedProjects = useMemo(() => {
        if (!selectedProfileUser) return [];
        return projects.filter(
            (p) =>
                p.created_by_id === selectedProfileUser.id ||
                p.lead_developer_id === selectedProfileUser.id ||
                p.manager_id === selectedProfileUser.id ||
                (p.developers && p.developers.some((d) => d.id === selectedProfileUser.id))
        );
    }, [projects, selectedProfileUser]);

    // "Top languages" equivalent.
    const topStacks = useMemo(() => {
        const counts = new Map<string, number>();
        projects.forEach((p) => stackList(p).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name]) => name);
    }, [projects]);

    useEffect(() => {
        if (auth.user.role === 'qa' && (scopeFilter === 'my_created' || scopeFilter === 'other_developers')) {
            setScopeFilter('all');
        }
    }, [auth.user.role, scopeFilter]);

    const tabs: { id: Scope; label: string; count: number }[] = useMemo(() => {
        if (auth.user.role === 'qa') {
            return [
                { id: 'all', label: 'All projects', count: stats.total_projects },
                { id: 'assigned', label: 'Assigned to me', count: stats.my_assigned_projects },
            ];
        }

        return [
            { id: 'all', label: 'All projects', count: stats.total_projects },
            { id: 'my_created', label: 'My created', count: stats.my_created_projects || 0 },
            { id: 'other_developers', label: 'Other developers', count: stats.other_developers_projects || 0 },
            { id: 'assigned', label: 'Assigned to me', count: stats.my_assigned_projects },
        ];
    }, [auth.user.role, stats]);

    return (
        <AuthenticatedLayout>
            <Head title={auth.user.role === 'qa' ? 'QA Portal Dashboard' : 'Developer Vault Dashboard'} />

            <div className="py-5 sm:py-8 px-3.5 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto w-full min-w-0">
                {/* ---------------- Organization-style header ---------------- */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 min-w-0 w-full">
                    <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                        <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-xl bg-indigo-600 text-white text-xl sm:text-3xl font-bold flex items-center justify-center shrink-0 tracking-wider shadow-lg shadow-indigo-600/20 overflow-hidden">
                            {auth.user.avatar_url ? (
                                <img src={auth.user.avatar_url} alt={auth.user.name} className="h-full w-full object-cover" />
                            ) : (
                                userInitials
                            )}
                        </div>
                        <div className="min-w-0 space-y-1 sm:space-y-2">
                            <h1 className="text-lg sm:text-2xl font-semibold text-white truncate">{auth.user.name}</h1>
                            <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-1 text-xs text-slate-400">
                                
                                <span className="capitalize font-medium text-slate-300">
                                    {auth.user.role === 'qa' ? 'QA Engineer' : auth.user.role}
                                </span>
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
                                        const canOpen = project.can_open ?? (
                                            auth.user.role === 'admin' || auth.user.role === 'superadmin'
                                                ? true
                                                : auth.user.role === 'qa'
                                                ? Boolean(project.is_assigned)
                                                : Boolean(project.is_owner || project.is_assigned || project.access_request?.status === 'approved')
                                        );

                                        if (!canOpen) {
                                            if (auth.user.role === 'developer') {
                                                const isPending = project.access_request?.status === 'pending';
                                                const isRejected = project.access_request?.status === 'rejected';

                                                return (
                                                    <div
                                                        key={project.id}
                                                        onClick={() => handleAccessClick(project)}
                                                        className={`text-left rounded-md border p-3.5 sm:p-4 flex flex-col gap-3 min-h-[112px] min-w-0 w-full cursor-pointer transition-colors ${
                                                            isPending
                                                                ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10'
                                                                : isRejected
                                                                ? 'border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10'
                                                                : 'border-slate-800 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-slate-900/70'
                                                        }`}
                                                        title={
                                                            isPending
                                                                ? 'Access requested - waiting for admin approval'
                                                                : isRejected
                                                                ? 'Access request was rejected - click to review or re-request'
                                                                : 'Click to request access permission from an administrator'
                                                        }
                                                    >
                                                        <div className="flex items-start justify-between gap-2.5 min-w-0">
                                                            <span className="text-sm font-semibold text-slate-300 break-words min-w-0 flex-1 flex items-center gap-1.5">
                                                                <svg className={`w-3.5 h-3.5 shrink-0 ${isPending ? 'text-amber-400 animate-pulse' : isRejected ? 'text-rose-400' : 'text-indigo-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                                </svg>
                                                                {project.name}
                                                            </span>
                                                            <div className="shrink-0 flex items-center gap-1.5">
                                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                                                    isPending
                                                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                                                        : isRejected
                                                                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                                                        : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                                                }`}>
                                                                    {isPending ? 'Pending Access' : isRejected ? 'Access Rejected' : 'Request Access'}
                                                                </span>
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
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={project.id}
                                                    className="text-left rounded-md border border-slate-800 bg-slate-900/30 p-3.5 sm:p-4 flex flex-col gap-3 min-h-[112px] min-w-0 w-full opacity-60 cursor-not-allowed select-none"
                                                    title="Access restricted: You must be assigned to this project to open its vault"
                                                >
                                                    <div className="flex items-start justify-between gap-2.5 min-w-0">
                                                        <span className="text-sm font-semibold text-slate-400 break-words min-w-0 flex-1 flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                            </svg>
                                                            {project.name}
                                                        </span>
                                                        <div className="shrink-0">
                                                            <StatusPill status={project.status} />
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-2 flex-1 break-words">
                                                        {project.description || project.code}
                                                    </p>
                                                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap min-w-0">
                                                        <StackDot tech={stack[0]} />
                                                        {stack[1] && <StackDot tech={stack[1]} />}
                                                    </div>
                                                </div>
                                            );
                                        }

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
                                        const canOpen = project.can_open ?? (
                                            auth.user.role === 'admin' || auth.user.role === 'superadmin'
                                                ? true
                                                : auth.user.role === 'qa'
                                                ? Boolean(project.is_assigned)
                                                : Boolean(project.is_owner || project.is_assigned || project.access_request?.status === 'approved')
                                        );

                                        return (
                                            <li key={project.id} className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 hover:bg-slate-900/40 transition-colors w-full min-w-0">
                                                <div className="min-w-0 space-y-2 flex-1 w-full">
                                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                        {canOpen ? (
                                                            <Link
                                                                href={route('projects.show', project.id)}
                                                                onClick={() => {
                                                                    recordProjectAccess(project.id);
                                                                }}
                                                                className="text-base font-semibold text-sky-400 hover:underline text-left break-words min-w-0"
                                                            >
                                                                {project.name}
                                                            </Link>
                                                        ) : auth.user.role === 'developer' ? (
                                                            <button
                                                                onClick={() => handleAccessClick(project)}
                                                                className="text-base font-semibold text-slate-300 hover:text-indigo-400 hover:underline text-left break-words min-w-0 flex items-center gap-1.5"
                                                                title="Click to request access permission from an administrator"
                                                            >
                                                                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                </svg>
                                                                {project.name}
                                                            </button>
                                                        ) : (
                                                            <span
                                                                className="text-base font-semibold text-slate-300 text-left break-words min-w-0 cursor-default"
                                                                title="Access restricted: You must be assigned to this project to open its vault"
                                                            >
                                                                {project.name}
                                                            </span>
                                                        )}
                                                        <StatusPill status={project.status} />
                                                        {project.deletion_status === 'pending' && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Deletion Approval Pending
                                                            </span>
                                                        )}
                                                        {project.deletion_status === 'approved' && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Deletion Approved
                                                            </span>
                                                        )}
                                                        {project.deletion_status === 'rejected' && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                                                Deletion Rejected
                                                            </span>
                                                        )}
                                                        {project.status === 'completed' && project.edit_permission_status === 'pending' && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                                                <svg className="w-2.5 h-2.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Edit Permission Pending
                                                            </span>
                                                        )}
                                                        {project.status === 'completed' && project.edit_permission_status === 'approved' && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Edit Permission Approved
                                                            </span>
                                                        )}
                                                        {project.status === 'completed' && project.edit_permission_status === 'rejected' && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                                                Edit Permission Rejected
                                                            </span>
                                                        )}
                                                        {auth.user.role === 'developer' && !project.is_owner && !project.is_assigned && (
                                                            <>
                                                                {project.access_request?.status === 'pending' && (
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                                                        <svg className="w-2.5 h-2.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        Access Request Pending
                                                                    </span>
                                                                )}
                                                                {project.access_request?.status === 'approved' && (
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        Access Granted
                                                                    </span>
                                                                )}
                                                                {project.access_request?.status === 'rejected' && (
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                                                        Access Rejected
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
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
                                                    {auth.user.role !== 'qa' && project.is_owner && (
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleEditClick(project)}
                                                                className={`p-2 rounded-md border transition-colors ${
                                                                    project.status === 'completed'
                                                                        ? project.edit_permission_status === 'approved'
                                                                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                                                            : project.edit_permission_status === 'pending'
                                                                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                                                            : project.edit_permission_status === 'rejected'
                                                                            ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                                                            : 'border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/50'
                                                                        : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                                                                }`}
                                                                title={
                                                                    project.status === 'completed'
                                                                        ? project.edit_permission_status === 'approved'
                                                                            ? 'Edit permission approved! Click to edit project details'
                                                                            : project.edit_permission_status === 'pending'
                                                                            ? `Edit permission requested from ${project.edit_permission_admin?.name || 'Admin'} (Pending Review)`
                                                                            : project.edit_permission_status === 'rejected'
                                                                            ? 'Edit permission was rejected. Click to review or re-request.'
                                                                            : 'Project completed (locked). Click to request admin edit permission'
                                                                        : 'Edit project details'
                                                                }
                                                            >
                                                                {project.status === 'completed' && project.edit_permission_status !== 'approved' ? (
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(project)}
                                                                className={`p-2 rounded-md border transition-colors ${
                                                                    project.deletion_status === 'approved'
                                                                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500'
                                                                        : project.deletion_status === 'pending'
                                                                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                                                        : project.deletion_status === 'rejected'
                                                                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                                                        : 'border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50'
                                                                }`}
                                                                title={
                                                                    project.deletion_status === 'approved'
                                                                        ? 'Deletion approved by admin! Click to permanently delete project'
                                                                        : project.deletion_status === 'pending'
                                                                        ? `Deletion requested from ${project.deletion_admin?.name || 'Admin'} (Pending Approval)`
                                                                        : project.deletion_status === 'rejected'
                                                                        ? 'Deletion request was rejected. Click to review or re-request.'
                                                                        : 'Request admin approval to delete project'
                                                                }
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    {canOpen ? (
                                                        <Link
                                                            href={route('projects.show', project.id)}
                                                            onClick={() => {
                                                                recordProjectAccess(project.id);
                                                            }}
                                                            className="px-3.5 py-1.5 rounded-md border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                                                        >
                                                            Open vault
                                                        </Link>
                                                    ) : auth.user.role === 'developer' ? (
                                                        project.access_request?.status === 'pending' ? (
                                                            <button
                                                                onClick={() => handleAccessClick(project)}
                                                                className="px-3 py-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                                                                title="Access request is waiting for administrator approval. Click to view status."
                                                            >
                                                                <svg className="w-3.5 h-3.5 animate-pulse text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Access Pending
                                                            </button>
                                                        ) : project.access_request?.status === 'rejected' ? (
                                                            <button
                                                                onClick={() => handleAccessClick(project)}
                                                                className="px-3 py-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                                                                title="Access request was rejected. Click to see reason or re-request."
                                                            >
                                                                <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                                Access Rejected
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAccessClick(project)}
                                                                className="px-3 py-1.5 rounded-md border border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                                                                title="You are not assigned to this project. Click to request access permission from an administrator."
                                                            >
                                                                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                                </svg>
                                                                Request access
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span
                                                            className="px-3 py-1.5 rounded-md border border-slate-800 bg-slate-900/50 text-slate-500 text-xs font-medium inline-flex items-center gap-1.5 cursor-not-allowed select-none"
                                                            title="Access restricted: You must be assigned to this project to open its vault"
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                            </svg>
                                                            Not assigned
                                                        </span>
                                                    )}
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
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-normal text-slate-100">People</h2>
                                    <span className="text-xs text-slate-500 font-medium">{people.length}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 min-w-0">
                                    {people.map((person) => (
                                        <button
                                            key={person.id}
                                            type="button"
                                            onClick={() => setSelectedProfileUser(person)}
                                            className="relative group focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                                            title={`${person.name} (${formatRole(person.role)}) - Click to view profile`}
                                        >
                                            {person.avatar_url ? (
                                                <img
                                                    src={person.avatar_url}
                                                    alt={person.name}
                                                    className="h-9 w-9 rounded-full object-cover border-2 border-slate-700 group-hover:border-indigo-500 shadow-sm transition-colors"
                                                />
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-slate-800 border-2 border-slate-700 group-hover:border-indigo-500 text-slate-200 text-xs font-semibold flex items-center justify-center shrink-0 tracking-tight shadow-sm transition-colors">
                                                    {getUserInitials(person.name)}
                                                </div>
                                            )}
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                                        </button>
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
                                    ...(auth.user.role !== 'qa' ? [{ label: 'Created by you', value: stats.my_created_projects || 0 }] : []),
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

            {/* Modal: Request Deletion Approval */}
            {deletionRequestProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    onClick={() => setDeletionRequestProject(null)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Request Project Deletion</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Admin approval is required to delete a project.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDeletionRequestProject(null)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Project summary card */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-white break-words">
                                    {deletionRequestProject.name}
                                </span>
                                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {deletionRequestProject.code}
                                </span>
                            </div>
                            {deletionRequestProject.description && (
                                <p className="text-xs text-slate-400 line-clamp-2">
                                    {deletionRequestProject.description}
                                </p>
                            )}
                            {deletionRequestProject.deletion_status === 'rejected' && (
                                <div className="mt-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                                    <span className="font-semibold text-rose-200">Previous Request Rejected:</span>{' '}
                                    {deletionRequestProject.deletion_rejection_reason || 'No reason specified'}
                                </div>
                            )}
                        </div>

                        <form onSubmit={submitDeletionRequest} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Select Administrator for Approval <span className="text-rose-400">*</span>
                                </label>
                                {availableAdmins.length > 0 ? (
                                    <select
                                        value={selectedAdminId}
                                        onChange={(e) => setSelectedAdminId(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    >
                                        <option value="" disabled>Select an administrator...</option>
                                        {availableAdmins.map((admin) => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.name} ({admin.email})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                                        No administrators found to review this request.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Reason for Deletion <span className="text-slate-500">(Optional)</span>
                                </label>
                                <textarea
                                    value={deletionReason}
                                    onChange={(e) => setDeletionReason(e.target.value)}
                                    placeholder="Explain why this project should be deleted..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletionRequestProject(null)}
                                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedAdminId || isSubmittingDeletion}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                                >
                                    {isSubmittingDeletion ? (
                                        <>
                                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Sending Request...
                                        </>
                                    ) : (
                                        'Send Request to Admin'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Pending Deletion Approval Status */}
            {pendingDeletionProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    onClick={() => setPendingDeletionProject(null)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                                    <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Deletion Request Pending</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Awaiting administrator review and approval.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPendingDeletionProject(null)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                            <div>
                                <div className="text-xs text-slate-400">Project</div>
                                <div className="text-sm font-semibold text-white">{pendingDeletionProject.name}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-slate-400">Assigned Admin:</span>
                                    <div className="text-slate-200 font-medium">
                                        {pendingDeletionProject.deletion_admin?.name || 'Administrator'}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-400">Requested:</span>
                                    <div className="text-slate-200 font-medium">
                                        {pendingDeletionProject.deletion_requested_at
                                            ? new Date(pendingDeletionProject.deletion_requested_at).toLocaleDateString()
                                            : 'Recently'}
                                    </div>
                                </div>
                            </div>
                            {pendingDeletionProject.deletion_reason && (
                                <div className="text-xs pt-2 border-t border-slate-800">
                                    <span className="text-slate-400">Submitted Reason:</span>
                                    <div className="text-slate-300 italic mt-0.5">
                                        &ldquo;{pendingDeletionProject.deletion_reason}&rdquo;
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                            Once the administrator approves your request, you will receive confirmation and be able to finalize project deletion. You can also withdraw your request at any time.
                        </p>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                disabled={isSubmittingDeletion}
                                onClick={() => cancelDeletionRequest(pendingDeletionProject.id)}
                                className="px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors"
                            >
                                {isSubmittingDeletion ? 'Cancelling...' : 'Withdraw Request'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingDeletionProject(null)}
                                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Approved Deletion Confirmation ("Do u really want to Delete this project?") */}
            {approvedDeletionProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    onClick={() => setApprovedDeletionProject(null)}
                >
                    <div
                        className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Delete Project</h3>
                                    <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Approved by {approvedDeletionProject.deletion_approved_by?.name || 'Administrator'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setApprovedDeletionProject(null)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Exact user-requested reminder */}
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 space-y-2">
                            <p className="text-sm font-semibold text-rose-200">
                                Do u really want to Delete this project?
                            </p>
                            <p className="text-xs text-rose-300/90 leading-relaxed">
                                This will permanently delete <strong className="text-white">{approvedDeletionProject.name}</strong> ({approvedDeletionProject.code}), along with all secured credentials, server environments, client access entries, and IoT configurations. This action cannot be reversed.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setApprovedDeletionProject(null)}
                                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isSubmittingDeletion}
                                onClick={() => executeApprovedDelete(approvedDeletionProject.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                            >
                                {isSubmittingDeletion ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Deleting...
                                    </>
                                ) : (
                                    'Yes, Delete Project'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal: Request Edit Permission for Completed Project */}
            {editPermissionRequestProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    onClick={() => setEditPermissionRequestProject(null)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Request Edit Permission</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Completed projects require admin permission before editing.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditPermissionRequestProject(null)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Project summary card */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-white break-words">
                                    {editPermissionRequestProject.name}
                                </span>
                                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {editPermissionRequestProject.code}
                                </span>
                            </div>
                            {editPermissionRequestProject.description && (
                                <p className="text-xs text-slate-400 line-clamp-2">
                                    {editPermissionRequestProject.description}
                                </p>
                            )}
                            {editPermissionRequestProject.edit_permission_status === 'rejected' && (
                                <div className="mt-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                                    <span className="font-semibold text-rose-200">Previous Request Rejected:</span>{' '}
                                    {editPermissionRequestProject.edit_permission_rejection_reason || 'No reason specified'}
                                </div>
                            )}
                        </div>

                        <form onSubmit={submitEditPermissionRequest} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Select Administrator or Super Admin <span className="text-rose-400">*</span>
                                </label>
                                {availableAdmins.length > 0 ? (
                                    <select
                                        value={selectedEditAdminId}
                                        onChange={(e) => setSelectedEditAdminId(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    >
                                        <option value="" disabled>Select an administrator...</option>
                                        {availableAdmins.map((admin) => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.name} ({admin.role === 'superadmin' ? 'Super Admin' : 'Admin'} - {admin.email})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                                        No administrators found to review this request.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Reason for Editing <span className="text-slate-500">(Optional)</span>
                                </label>
                                <textarea
                                    value={editPermissionReason}
                                    onChange={(e) => setEditPermissionReason(e.target.value)}
                                    placeholder="Explain what updates or changes need to be made to this completed project..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditPermissionRequestProject(null)}
                                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedEditAdminId || isSubmittingEditPermission}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                                >
                                    {isSubmittingEditPermission ? (
                                        <>
                                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Sending Request...
                                        </>
                                    ) : (
                                        'Send Edit Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Pending Edit Permission Status */}
            {pendingEditPermissionProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    onClick={() => setPendingEditPermissionProject(null)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                                    <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Edit Permission Pending</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Awaiting administrator review and approval.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPendingEditPermissionProject(null)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                            <div>
                                <div className="text-xs text-slate-400">Completed Project</div>
                                <div className="text-sm font-semibold text-white">{pendingEditPermissionProject.name}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-slate-400">Assigned Admin:</span>
                                    <div className="text-slate-200 font-medium">
                                        {pendingEditPermissionProject.edit_permission_admin?.name || 'Administrator'}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-400">Requested:</span>
                                    <div className="text-slate-200 font-medium">
                                        {pendingEditPermissionProject.edit_permission_requested_at
                                            ? new Date(pendingEditPermissionProject.edit_permission_requested_at).toLocaleDateString()
                                            : 'Recently'}
                                    </div>
                                </div>
                            </div>
                            {pendingEditPermissionProject.edit_permission_reason && (
                                <div className="text-xs pt-2 border-t border-slate-800">
                                    <span className="text-slate-400">Submitted Reason:</span>
                                    <div className="text-slate-300 italic mt-0.5">
                                        &ldquo;{pendingEditPermissionProject.edit_permission_reason}&rdquo;
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                            Once the administrator approves your request, you will receive a notification and the project details form will be unlocked for editing.
                        </p>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                disabled={isSubmittingEditPermission}
                                onClick={() => cancelEditPermissionRequest(pendingEditPermissionProject.id)}
                                className="px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors"
                            >
                                {isSubmittingEditPermission ? 'Cancelling...' : 'Withdraw Request'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingEditPermissionProject(null)}
                                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Request Access Permission from Admin */}
            {accessRequestProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    onClick={() => setAccessRequestProject(null)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Request Project Access</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Request authorization from an administrator to access this project vault.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAccessRequestProject(null)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Project summary card */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-white break-words">
                                    {accessRequestProject.name}
                                </span>
                                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {accessRequestProject.code}
                                </span>
                            </div>
                            {accessRequestProject.description && (
                                <p className="text-xs text-slate-400 line-clamp-2">
                                    {accessRequestProject.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                                <span>Created by: <strong className="text-slate-300">{accessRequestProject.creator?.name || 'Developer'}</strong></span>
                                {accessRequestProject.tech_stack && (
                                    <>
                                        <span>•</span>
                                        <span className="text-slate-400 truncate">{accessRequestProject.tech_stack}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <form onSubmit={submitAccessRequest} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Select Administrator or Super Admin <span className="text-rose-400">*</span>
                                </label>
                                {availableAdmins.length > 0 ? (
                                    <select
                                        value={selectedAccessAdminId}
                                        onChange={(e) => setSelectedAccessAdminId(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    >
                                        <option value="" disabled>Select an administrator...</option>
                                        {availableAdmins.map((admin) => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.name} ({admin.role === 'superadmin' ? 'Super Admin' : 'Admin'} - {admin.email})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                                        No administrators found to review this request.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Reason / Justification <span className="text-slate-500">(Optional)</span>
                                </label>
                                <textarea
                                    value={accessReason}
                                    onChange={(e) => setAccessReason(e.target.value)}
                                    placeholder="Explain why you need access to this project (e.g. assisting in debugging, contributing, code review)..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAccessRequestProject(null)}
                                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedAccessAdminId || isSubmittingAccess}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                                >
                                    {isSubmittingAccess ? (
                                        <>
                                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Sending Request...
                                        </>
                                    ) : (
                                        'Send Access Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Pending Access Status */}
            {pendingAccessProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    onClick={() => setPendingAccessProject(null)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                                    <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Access Request Pending</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Awaiting administrator review and approval.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPendingAccessProject(null)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                            <div>
                                <div className="text-xs text-slate-400">Project</div>
                                <div className="text-sm font-semibold text-white">{pendingAccessProject.name}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-slate-400">Assigned Admin:</span>
                                    <div className="text-slate-200 font-medium">
                                        {pendingAccessProject.access_request?.admin?.name || 'Administrator'}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-400">Requested:</span>
                                    <div className="text-slate-200 font-medium">
                                        {pendingAccessProject.access_request?.requested_at
                                            ? new Date(pendingAccessProject.access_request.requested_at).toLocaleDateString()
                                            : 'Recently'}
                                    </div>
                                </div>
                            </div>
                            {pendingAccessProject.access_request?.reason && (
                                <div className="text-xs pt-2 border-t border-slate-800">
                                    <span className="text-slate-400">Submitted Justification:</span>
                                    <div className="text-slate-300 italic mt-0.5">
                                        &ldquo;{pendingAccessProject.access_request.reason}&rdquo;
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                            Once the administrator approves your request, you will receive a notification and full access to open this project vault will be granted.
                        </p>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                disabled={isSubmittingAccess}
                                onClick={() => cancelAccessRequest(pendingAccessProject.id)}
                                className="px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors"
                            >
                                {isSubmittingAccess ? 'Cancelling...' : 'Withdraw Request'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingAccessProject(null)}
                                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Rejected Access Status */}
            {rejectedAccessProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    onClick={() => setRejectedAccessProject(null)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Access Request Rejected</h3>
                                    <p className="text-xs text-rose-300 mt-0.5">
                                        Your previous request to access this project vault was not approved.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setRejectedAccessProject(null)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 space-y-3">
                            <div>
                                <div className="text-xs text-slate-400">Project</div>
                                <div className="text-sm font-semibold text-white">{rejectedAccessProject.name}</div>
                            </div>
                            <div>
                                <span className="text-xs text-rose-300 font-medium">Rejection Reason:</span>
                                <div className="text-xs text-slate-200 mt-1 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                                    {rejectedAccessProject.access_request?.rejection_reason || 'No specific reason was provided by the administrator.'}
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                            You can re-apply for access with updated justification or select a different administrator to review your request.
                        </p>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const proj = rejectedAccessProject;
                                    setRejectedAccessProject(null);
                                    setAccessRequestProject(proj);
                                    setSelectedAccessAdminId(availableAdmins[0]?.id ? String(availableAdmins[0].id) : '');
                                    setAccessReason('');
                                }}
                                className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Request Access Again
                            </button>
                            <button
                                type="button"
                                onClick={() => setRejectedAccessProject(null)}
                                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Slide-over Profile View Panel */}
            {selectedProfileUser && (
                <div
                    className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity"
                    onClick={() => setSelectedProfileUser(null)}
                >
                    <div
                        className="w-full max-w-sm sm:max-w-md bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shadow-2xl flex flex-col text-slate-200 animate-in slide-in-from-right duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                            <h3 className="text-base font-bold text-white tracking-tight">Profile</h3>
                            <button
                                type="button"
                                onClick={() => setSelectedProfileUser(null)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                title="Close"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5 flex-1">
                            {/* Profile Image */}
                            <div className="w-full">
                                {selectedProfileUser.avatar_url ? (
                                    <img
                                        src={selectedProfileUser.avatar_url}
                                        alt={selectedProfileUser.name}
                                        className="w-full aspect-square max-h-80 object-cover rounded-2xl border border-slate-800 shadow-xl"
                                    />
                                ) : (
                                    <div className="w-full aspect-square max-h-80 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center text-6xl font-bold text-indigo-300 shadow-xl tracking-wider">
                                        {getUserInitials(selectedProfileUser.name)}
                                    </div>
                                )}
                            </div>

                            {/* Name & Role */}
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    {selectedProfileUser.name}
                                </h2>
                                <p className="text-sm font-medium text-slate-300">
                                    {formatRole(selectedProfileUser.role)}
                                </p>
                            </div>

                            {/* Status Indicators */}
                            <div className="space-y-2 pt-1 text-xs text-slate-300">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 shrink-0" />
                                    <span className="font-medium text-emerald-400">Active</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-slate-400">
                                    <svg className="w-3.5 h-3.5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} local time
                                    </span>
                                </div>
                            </div>

                            {/* Contact Information (Excludes Message / Huddle) */}
                            <div className="pt-4 border-t border-slate-800/80 space-y-3.5">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Contact information
                                </h4>

                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs text-slate-400">Email address</div>
                                        <a
                                            href={`mailto:${selectedProfileUser.email}`}
                                            className="text-xs sm:text-sm font-medium text-sky-400 hover:underline break-all"
                                        >
                                            {selectedProfileUser.email}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs text-slate-400">Phone</div>
                                        {selectedProfileUser.contact_no ? (
                                            <a
                                                href={`tel:${selectedProfileUser.contact_no}`}
                                                className="text-xs sm:text-sm font-medium text-sky-400 hover:underline"
                                            >
                                                {selectedProfileUser.contact_no}
                                            </a>
                                        ) : (
                                            <span className="text-xs sm:text-sm text-slate-500 italic">Not provided</span>
                                        )}
                                    </div>
                                </div>

                                {selectedProfileUser.birth_date && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs text-slate-400">Birth date</div>
                                            <div className="text-xs sm:text-sm font-medium text-slate-200">
                                                {new Date(selectedProfileUser.birth_date).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* About Me (Excludes Recent DMs) */}
                            <div className="pt-4 border-t border-slate-800/80 space-y-3">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    About me
                                </h4>

                                {selectedProfileUser.bio && (
                                    <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                        {selectedProfileUser.bio}
                                    </div>
                                )}

                                <div>
                                    <div className="text-xs text-slate-400 font-medium">Start Date</div>
                                    <div className="text-xs sm:text-sm font-medium text-sky-400 mt-0.5">
                                        {formatMemberSince(selectedProfileUser.created_at)}
                                    </div>
                                </div>

                                {userCollaboratedProjects.length > 0 && (
                                    <div className="pt-3 border-t border-slate-800/60">
                                        <div className="text-xs text-slate-400 mb-2">
                                            Assigned Projects ({userCollaboratedProjects.length})
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {userCollaboratedProjects.slice(0, 8).map((proj) => (
                                                <span
                                                    key={proj.id}
                                                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300"
                                                >
                                                    {proj.name}
                                                </span>
                                            ))}
                                            {userCollaboratedProjects.length > 8 && (
                                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800/40 text-slate-500">
                                                    +{userCollaboratedProjects.length - 8} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}