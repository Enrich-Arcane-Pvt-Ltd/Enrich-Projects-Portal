import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProjectVaultModal from '@/Components/ProjectVaultModal';
import ProjectFormModal from '@/Components/ProjectFormModal';
import { AuditLog, DashboardStats, PageProps, Project, User } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

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

export default function Dashboard({
    auth,
    projects,
    stats,
    recentAuditActivity,
    availableDevelopers = [],
    filters,
}: DashboardProps) {
    const [scopeFilter, setScopeFilter] = useState<'all' | 'my_created' | 'other_developers' | 'assigned'>('all');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const selectedProject = useMemo(() => {
        if (!selectedProjectId) return null;
        return projects.find((p) => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || 'all');

    // Filter projects locally for instant responsiveness
    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const matchesScope =
                scopeFilter === 'all' ||
                (scopeFilter === 'my_created' && Boolean(project.is_owner)) ||
                (scopeFilter === 'other_developers' && !project.is_owner) ||
                (scopeFilter === 'assigned' && Boolean(project.is_assigned));

            const matchesSearch =
                !searchQuery ||
                project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (project.tech_stack && project.tech_stack.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesType = selectedType === 'all' || project.type === selectedType;
            const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
            const matchesPriority = selectedPriority === 'all' || project.priority === selectedPriority;

            return matchesScope && matchesSearch && matchesType && matchesStatus && matchesPriority;
        });
    }, [projects, scopeFilter, searchQuery, selectedType, selectedStatus, selectedPriority]);

    const projectTypes = [
        { id: 'all', label: 'All Types' },
        { id: 'web_app', label: 'Web Apps' },
        { id: 'mobile_app', label: 'Mobile Apps' },
        { id: 'iot_embedded', label: 'IoT & Hardware' },
        { id: 'api_service', label: 'API Services' },
        { id: 'hybrid', label: 'Hybrid' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Developer Vault Dashboard" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
                {/* Hero / Welcome Banner */}
                <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                                    Developer Vault Active • Role: {auth.user.role}
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                Welcome back, {auth.user.name}
                            </h1>
                            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                                Browse all company projects, view your assigned project teams, inspect server infrastructure, and decrypt credentials with real-time audit logging.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 flex-wrap">
                            {auth.user.role === 'developer' && (
                                <button
                                    onClick={() => {
                                        setEditingProject(null);
                                        setIsFormModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-sm shrink-0"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>New Project</span>
                                </button>
                            )}

                            {auth.user.role === 'admin' && (
                                <a
                                    href="/admin"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors shrink-0"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Switch to Admin Panel
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Metric Counter Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div
                        onClick={() => setScopeFilter('all')}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors space-y-1 ${
                            scopeFilter === 'all'
                                ? 'bg-slate-800/90 border-indigo-500/60 ring-1 ring-indigo-500/30'
                                : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                            <span>All Projects</span>
                            <span className="text-slate-400">📁</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.total_projects}</div>
                        <div className="text-[11px] text-slate-500">Total company vault</div>
                    </div>

                    <div
                        onClick={() => setScopeFilter('my_created')}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors space-y-1 ${
                            scopeFilter === 'my_created'
                                ? 'bg-slate-800/90 border-indigo-500/60 ring-1 ring-indigo-500/30'
                                : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                            <span>My Created</span>
                            <span className="text-slate-400">⭐</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.my_created_projects || 0}</div>
                        <div className="text-[11px] text-slate-500">Controller ownership</div>
                    </div>

                    <div
                        onClick={() => setScopeFilter('other_developers')}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors space-y-1 ${
                            scopeFilter === 'other_developers'
                                ? 'bg-slate-800/90 border-indigo-500/60 ring-1 ring-indigo-500/30'
                                : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                            <span>Other Developers</span>
                            <span className="text-slate-400">👥</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.other_developers_projects || 0}</div>
                        <div className="text-[11px] text-slate-500">View & vault access</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                            <span>Active In-Dev</span>
                            <span className="text-slate-400">⚡</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.active_projects}</div>
                        <div className="text-[11px] text-slate-500">Active sprints</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1 col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                            <span>Secured Secrets</span>
                            <span className="text-slate-400">🔑</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.total_credentials}</div>
                        <div className="text-[11px] text-slate-500">AES-256 Vault keys</div>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Live Search */}
                        <div className="relative flex-1 max-w-md">
                            <svg
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
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
                                placeholder="Search by name, code, stack (e.g. ESP32, MQTT, Flutter)..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                                <option value="all">All Statuses</option>
                                <option value="in_progress">In Progress</option>
                                <option value="planning">Planning</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="completed">Completed</option>
                                <option value="archived">Archived</option>
                            </select>

                            <select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value)}
                                className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                                <option value="all">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>

                            {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedType('all');
                                        setSelectedStatus('all');
                                        setSelectedPriority('all');
                                    }}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 px-2 font-medium"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Type Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {projectTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                    selectedType === type.id
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                                }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800/80 rounded-xl overflow-x-auto scrollbar-none">
                            <button
                                onClick={() => setScopeFilter('all')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                    scopeFilter === 'all'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <span>📁 All Projects</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                    scopeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {stats.total_projects}
                                </span>
                            </button>

                            <button
                                onClick={() => setScopeFilter('my_created')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                    scopeFilter === 'my_created'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <span>⭐ My Created</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                    scopeFilter === 'my_created' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {stats.my_created_projects || 0}
                                </span>
                            </button>

                            <button
                                onClick={() => setScopeFilter('other_developers')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                    scopeFilter === 'other_developers'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <span>👥 Other Developers</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                    scopeFilter === 'other_developers' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {stats.other_developers_projects || 0}
                                </span>
                            </button>

                            <button
                                onClick={() => setScopeFilter('assigned')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                    scopeFilter === 'assigned'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <span>✓ Assigned to Me</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                    scopeFilter === 'assigned' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {stats.my_assigned_projects}
                                </span>
                            </button>
                        </div>

                        <div className="text-xs text-slate-400 font-medium">
                            Showing <strong className="text-slate-200">{filteredProjects.length}</strong> {scopeFilter === 'all' ? 'total' : scopeFilter.replace('_', ' ')} {filteredProjects.length === 1 ? 'project' : 'projects'}
                        </div>
                    </div>

                    {filteredProjects.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
                            <div className="text-3xl">🔍</div>
                            <h3 className="text-base font-bold text-slate-300">No matching projects found</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                No projects match your active search and filter criteria. Try clearing filters or switching tabs.
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-colors shadow-sm flex flex-col justify-between group overflow-hidden"
                                >
                                    <div className="p-6 space-y-4">
                                        {/* Top Badges */}
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-mono text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60">
                                                    {project.code}
                                                </span>
                                                {project.is_owner ? (
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800/90 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                                        Created by You
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-700/60 flex items-center gap-1.5">
                                                        👤 {project.creator?.name || 'Developer'}
                                                    </span>
                                                )}
                                                {project.is_assigned && !project.is_owner && (
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60">
                                                        ✓ Assigned
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {project.is_owner && (
                                                    <div className="flex items-center gap-1 mr-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingProject(project);
                                                                setIsFormModalOpen(true);
                                                            }}
                                                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                                            title="Edit Project Details"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm(`Are you sure you want to delete project "${project.name}"? This will permanently delete all associated credentials, servers, and configuration.`)) {
                                                                    router.delete(`/developer/projects/${project.id}`);
                                                                }
                                                            }}
                                                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                                            title="Delete Project"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}

                                                <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
                                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                                        project.status === 'in_progress' ? 'bg-emerald-400' :
                                                        project.status === 'planning' ? 'bg-indigo-400' :
                                                        'bg-slate-400'
                                                    }`}></span>
                                                    {project.status.replace('_', ' ')}
                                                </span>

                                                <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
                                                    {project.priority === 'critical' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>}
                                                    {project.priority === 'high' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60"></span>}
                                                    {project.priority}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Title & Description */}
                                        <div className="space-y-1.5">
                                            <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                                {project.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                                {project.description || 'No project description recorded.'}
                                            </p>
                                        </div>

                                        {/* Tech Stack Chips */}
                                        {project.tech_stack && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {project.tech_stack.split(',').map((tech, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/40"
                                                    >
                                                        {tech.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Vault Resource Counters */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                                            <div className="flex items-center gap-1.5" title="Credential Vault">
                                                <span>🔑</span>
                                                <span>{project.credentials?.length || 0} Secrets</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Client Access Credentials">
                                                <span>👤</span>
                                                <span>{(project.client_access_credentials || project.clientAccessCredentials)?.length || 0} Clients</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Server & Hosting Environments">
                                                <span>🖥️</span>
                                                <span>{project.server_environments?.length || 0} Servers</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Repositories & External Links">
                                                <span>🔗</span>
                                                <span>{project.links?.length || 0} Repos</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Background Daemons & Workers">
                                                <span>⚙️</span>
                                                <span>{project.background_services?.length || 0} Daemons</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="IOT Hardware & Telemetry">
                                                <span>📡</span>
                                                <span>{project.iot_configurations?.length || 0} IoT</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Documentation & Diagrams Vault">
                                                <span>📄</span>
                                                <span>{project.documents?.length || 0} Docs</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Assigned Developers">
                                                <span>👥</span>
                                                <span>{project.developers?.length || 0} Devs</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="p-4 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {project.lead_developer ? (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <div className="h-6 w-6 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium text-[10px] flex items-center justify-center">
                                                        {project.lead_developer.name.charAt(0)}
                                                    </div>
                                                    <span className="truncate max-w-[110px]">{project.lead_developer.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500">Unassigned Lead</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setSelectedProjectId(project.id)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
                                        >
                                            <span>Open Vault</span>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Audit Transparency Log (Developer's personal recent activity) */}
                {recentAuditActivity && recentAuditActivity.length > 0 && (
                    <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">🛡️</span>
                                <h3 className="text-sm font-semibold text-white">Your Recent Vault Audit Activity</h3>
                            </div>
                            <span className="text-xs text-slate-500">Tracked for SOC2 / ISO-27001 compliance</span>
                        </div>

                        <div className="divide-y divide-slate-800/80">
                            {recentAuditActivity.map((log) => (
                                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="px-2 py-0.5 rounded font-medium uppercase text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/50">
                                            {log.action_type}
                                        </span>
                                        <span className="text-slate-300 font-mono truncate">{log.target_field}</span>
                                    </div>
                                    <span className="text-slate-500 shrink-0 font-mono">
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Interactive Vault Slide-Over / Modal */}
            <ProjectVaultModal
                project={selectedProject}
                isOpen={Boolean(selectedProject)}
                onClose={() => setSelectedProjectId(null)}
                availableDevelopers={availableDevelopers}
            />

            {/* Create & Edit Project Modal */}
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
