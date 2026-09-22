import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProjectVaultModal from '@/Components/ProjectVaultModal';
import { AuditLog, DashboardStats, PageProps, Project } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

interface DashboardProps extends PageProps {
    projects: Project[];
    stats: DashboardStats;
    recentAuditActivity: AuditLog[];
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
    filters,
}: DashboardProps) {
    const [scopeFilter, setScopeFilter] = useState<'all' | 'assigned'>('all');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || 'all');

    // Filter projects locally for instant responsiveness
    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const matchesScope = scopeFilter === 'all' || Boolean(project.is_assigned);

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
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/90 p-6 sm:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                                    Developer Vault Active • Role: {auth.user.role}
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                Welcome back, {auth.user.name}
                            </h1>
                            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                                Browse all company projects, view your assigned project teams, inspect server infrastructure, and decrypt credentials with real-time audit logging.
                            </p>
                        </div>

                        {auth.user.role === 'admin' && (
                            <a
                                href="/admin"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Switch to Filament Admin Panel
                            </a>
                        )}
                    </div>
                </div>

                {/* Metric Counter Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div
                        onClick={() => setScopeFilter('all')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1 ${
                            scopeFilter === 'all'
                                ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30'
                                : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                            <span>All Projects</span>
                            <span className="text-indigo-400">📁</span>
                        </div>
                        <div className="text-2xl font-black text-white">{stats.total_projects}</div>
                        <div className="text-[11px] text-slate-400">Total company vault</div>
                    </div>

                    <div
                        onClick={() => setScopeFilter('assigned')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1 ${
                            scopeFilter === 'assigned'
                                ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                                : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                            <span>Assigned to You</span>
                            <span className="text-emerald-400">👤</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-400">{stats.my_assigned_projects}</div>
                        <div className="text-[11px] text-emerald-500/80 font-semibold">Your team assignments</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                            <span>Active In-Dev</span>
                            <span className="text-sky-400">⚡</span>
                        </div>
                        <div className="text-2xl font-black text-sky-400">{stats.active_projects}</div>
                        <div className="text-[11px] text-slate-400">Active sprints</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                            <span>Critical Priority</span>
                            <span className="text-rose-400">🔥</span>
                        </div>
                        <div className="text-2xl font-black text-rose-400">{stats.critical_projects}</div>
                        <div className="text-[11px] text-slate-400">High priority nodes</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm space-y-1 col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                            <span>Secured Secrets</span>
                            <span className="text-amber-400">🔑</span>
                        </div>
                        <div className="text-2xl font-black text-amber-400">{stats.total_credentials}</div>
                        <div className="text-[11px] text-slate-400">AES-256 Vault keys</div>
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
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                    className="text-xs text-indigo-400 hover:underline px-2"
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
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                    selectedType === type.id
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
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
                        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                            <button
                                onClick={() => setScopeFilter('all')}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    scopeFilter === 'all'
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
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
                                onClick={() => setScopeFilter('assigned')}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    scopeFilter === 'assigned'
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <span>✓ Assigned to Me</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                    scopeFilter === 'assigned' ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400 font-bold'
                                }`}>
                                    {stats.my_assigned_projects}
                                </span>
                            </button>
                        </div>

                        <div className="text-xs text-slate-400 font-medium">
                            Showing <strong className="text-white">{filteredProjects.length}</strong> {scopeFilter === 'assigned' ? 'assigned' : 'total'} {filteredProjects.length === 1 ? 'project' : 'projects'}
                        </div>
                    </div>

                    {filteredProjects.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
                            <div className="text-3xl">🔍</div>
                            <h3 className="text-base font-bold text-slate-300">No matching projects found</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                No projects match your active search and filter criteria. Try clearing filters or switching to "All Projects".
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className={`rounded-2xl bg-slate-900 border transition-all duration-300 shadow-lg flex flex-col justify-between group overflow-hidden ${
                                        project.is_assigned
                                            ? 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/10'
                                            : 'border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10'
                                    }`}
                                >
                                    <div className="p-6 space-y-4">
                                        {/* Top Badges */}
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                    {project.code}
                                                </span>
                                                {project.is_assigned ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                                                        ✓ Assigned
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                                                        Company
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                    project.status === 'in_progress' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    project.status === 'planning' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                    {project.status.replace('_', ' ')}
                                                </span>

                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                    project.priority === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                    project.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {project.priority}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Title & Description */}
                                        <div className="space-y-1.5">
                                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
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
                                                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50"
                                                    >
                                                        {tech.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Vault Resource Counters */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                                            <div className="flex items-center gap-1.5" title="Credentials">
                                                <span>🔑</span>
                                                <span>{project.credentials?.length || 0} Secrets</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Client Access Credentials">
                                                <span>👤</span>
                                                <span>{(project.client_access_credentials || project.clientAccessCredentials)?.length || 0} Clients</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Servers">
                                                <span>🖥️</span>
                                                <span>{project.server_environments?.length || 0} Servers</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Git Links">
                                                <span>🔗</span>
                                                <span>{project.links?.length || 0} Repos</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Background Workers">
                                                <span>⚙️</span>
                                                <span>{project.background_services?.length || 0} Daemons</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="IoT Configs">
                                                <span>📡</span>
                                                <span>{project.iot_configurations?.length || 0} IoT</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Documents">
                                                <span>📄</span>
                                                <span>{project.documents?.length || 0} Docs</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                                                <span>🛡️</span>
                                                <span>SOC2 Audited</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {project.lead_developer ? (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <div className="h-6 w-6 rounded-full bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center">
                                                        {project.lead_developer.name.charAt(0)}
                                                    </div>
                                                    <span className="truncate max-w-[110px]">{project.lead_developer.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500">Unassigned Lead</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setSelectedProject(project)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 group-hover:scale-105"
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
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-amber-400">🛡️</span>
                                <h3 className="text-sm font-bold text-white">Your Recent Vault Audit Activity</h3>
                            </div>
                            <span className="text-xs text-slate-500">Tracked for SOC2 / ISO-27001 compliance</span>
                        </div>

                        <div className="divide-y divide-slate-800">
                            {recentAuditActivity.map((log) => (
                                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                            log.action_type === 'VIEWED_SECRET' ? 'bg-amber-500/10 text-amber-400' :
                                            log.action_type === 'COPIED_KEY' ? 'bg-rose-500/10 text-rose-400' :
                                            'bg-indigo-500/10 text-indigo-400'
                                        }`}>
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
                onClose={() => setSelectedProject(null)}
            />
        </AuthenticatedLayout>
    );
}
