import { AuditLog, ClientAccessCredential, Project, ProjectCredential, ServerEnvironment, ThirdPartyAccount, User } from '@/types';
import axios from 'axios';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import SubEntityFormModal, { SubEntityType } from '@/Components/SubEntityFormModal';

interface ProjectVaultModalProps {
    project: Project | null;
    isOpen?: boolean;
    onClose?: () => void;
    availableDevelopers?: User[];
    isPage?: boolean;
}

type TabType = 'overview' | 'credentials' | 'client_credentials' | 'links' | 'servers' | 'accounts' | 'services' | 'iot' | 'documents';

export default function ProjectVaultModal({
    project,
    isOpen = true,
    onClose = () => {},
    availableDevelopers = [],
    isPage = false,
}: ProjectVaultModalProps) {
    if (!isOpen || !project) return null;

    const [activeTab, setActiveTab] = useState<TabType>('credentials');
    const [revealedSecrets, setRevealedSecrets] = useState<Record<number, string>>({});
    const [revealedClients, setRevealedClients] = useState<Record<number, string>>({});
    const [revealedAccounts, setRevealedAccounts] = useState<Record<number, string>>({});
    const [revealedServers, setRevealedServers] = useState<Record<string, string>>({});
    const [revealedIot, setRevealedIot] = useState<Record<number, string>>({});
    const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const [subEntityModal, setSubEntityModal] = useState<{ type: SubEntityType; item?: any } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Developer assignment & leadership state
    const [isAssignDevModalOpen, setIsAssignDevModalOpen] = useState(false);
    const [isEditLeadsModalOpen, setIsEditLeadsModalOpen] = useState(false);
    const [selectedDevId, setSelectedDevId] = useState<string>('');
    const [leadDevId, setLeadDevId] = useState<string>('');
    const [projectManagerId, setProjectManagerId] = useState<string>('');
    const [isSubmittingDev, setIsSubmittingDev] = useState(false);

    const assignedDevIds = useMemo(() => new Set((project.developers || []).map((d) => d.id)), [project.developers]);
    const unassignedDevelopers = useMemo(() => {
        return (availableDevelopers || []).filter((dev) => !assignedDevIds.has(dev.id));
    }, [availableDevelopers, assignedDevIds]);

    const handleAssignDeveloper = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDevId) return;
        setIsSubmittingDev(true);
        router.post(
            `/developer/projects/${project.id}/assign-developer`,
            { user_id: selectedDevId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAssignDevModalOpen(false);
                    setSelectedDevId('');
                    triggerCopyFeedback('Developer assigned to project team');
                },
                onFinish: () => setIsSubmittingDev(false),
            }
        );
    };

    const handleUnassignDeveloper = (userId: number, devName: string) => {
        if (!confirm(`Are you sure you want to remove ${devName} from this project?`)) return;
        setIsSubmittingDev(true);
        router.delete(`/developer/projects/${project.id}/unassign-developer/${userId}`, {
            preserveScroll: true,
            onSuccess: () => triggerCopyFeedback(`Removed ${devName} from team`),
            onFinish: () => setIsSubmittingDev(false),
        });
    };

    const handleUpdateLeads = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingDev(true);
        router.post(
            `/developer/projects/${project.id}/update-leads`,
            {
                lead_developer_id: leadDevId ? Number(leadDevId) : null,
                manager_id: projectManagerId ? Number(projectManagerId) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditLeadsModalOpen(false);
                    triggerCopyFeedback('Leadership updated successfully');
                },
                onFinish: () => setIsSubmittingDev(false),
            }
        );
    };

    const handleDeleteSubEntity = (type: SubEntityType, id: number, label: string) => {
        if (!confirm(`Are you sure you want to delete ${label}? This cannot be undone.`)) {
            return;
        }
        const routeMap: Record<string, string> = {
            credentials: `/developer/projects/${project.id}/credentials/${id}`,
            client_credentials: `/developer/projects/${project.id}/client-credentials/${id}`,
            links: `/developer/projects/${project.id}/links/${id}`,
            servers: `/developer/projects/${project.id}/servers/${id}`,
            accounts: `/developer/projects/${project.id}/accounts/${id}`,
            services: `/developer/projects/${project.id}/services/${id}`,
            iot: `/developer/projects/${project.id}/iot/${id}`,
            documents: `/developer/projects/${project.id}/documents/${id}`,
        };
        const endpoint = routeMap[type];
        if (!endpoint) return;

        setDeletingId(`${type}_${id}`);
        router.delete(endpoint, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = () => {
        const el = tabsContainerRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 6);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
    };

    useEffect(() => {
        // Run slightly after mount/render to ensure clientWidth and scrollWidth are calculated
        const timeout = setTimeout(updateScrollButtons, 50);
        window.addEventListener('resize', updateScrollButtons);
        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', updateScrollButtons);
        };
    }, [isOpen, project]);

    const scrollTabs = (direction: 'left' | 'right') => {
        const el = tabsContainerRef.current;
        if (!el) return;
        const scrollAmount = 260;
        el.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
        setTimeout(updateScrollButtons, 300);
    };

    const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
        const el = tabsContainerRef.current;
        if (!el) return;
        if (e.deltaY !== 0) {
            el.scrollLeft += e.deltaY;
            updateScrollButtons();
        }
    };

    const triggerCopyFeedback = (msg: string) => {
        setCopyFeedback(msg);
        setTimeout(() => setCopyFeedback(null), 2500);
    };

    const handleRevealSecret = async (credential: ProjectCredential) => {
        if (revealedSecrets[credential.id]) {
            // Already revealed, toggle hide
            const copy = { ...revealedSecrets };
            delete copy[credential.id];
            setRevealedSecrets(copy);
            return;
        }

        setLoadingIds(prev => ({ ...prev, [`cred_${credential.id}`]: true }));
        try {
            const response = await axios.post(`/developer/reveal-secret/${credential.id}`);
            setRevealedSecrets(prev => ({ ...prev, [credential.id]: response.data.key_value }));
            triggerCopyFeedback(`Audited: Revealed ${credential.key_name}`);
        } catch (error) {
            console.error('Failed to reveal secret', error);
        } finally {
            setLoadingIds(prev => ({ ...prev, [`cred_${credential.id}`]: false }));
        }
    };

    const handleCopySecret = async (credential: ProjectCredential, valueToCopy?: string) => {
        let value = valueToCopy || revealedSecrets[credential.id];

        if (!value) {
            // If not yet revealed, fetch it first
            try {
                const response = await axios.post(`/developer/reveal-secret/${credential.id}`);
                value = response.data.key_value;
                setRevealedSecrets(prev => ({ ...prev, [credential.id]: value! }));
            } catch (error) {
                console.error('Failed to fetch secret for copy', error);
                return;
            }
        }

        if (value) {
            navigator.clipboard.writeText(value);
            triggerCopyFeedback(`Copied to clipboard: ${credential.key_name}`);
            try {
                await axios.post('/developer/log-copy', {
                    project_id: project.id,
                    target_field: `${credential.key_name} [${credential.environment}]`,
                    action_type: 'COPIED_KEY',
                });
            } catch (err) {
                console.error('Failed to log copy event', err);
            }
        }
    };

    const handleRevealClientCredential = async (clientCred: ClientAccessCredential) => {
        if (revealedClients[clientCred.id]) {
            const copy = { ...revealedClients };
            delete copy[clientCred.id];
            setRevealedClients(copy);
            return;
        }

        setLoadingIds(prev => ({ ...prev, [`client_${clientCred.id}`]: true }));
        try {
            const res = await axios.post(`/developer/reveal-client-credential/${clientCred.id}`);
            setRevealedClients(prev => ({ ...prev, [clientCred.id]: res.data.password }));
            triggerCopyFeedback(`Audited: Revealed ${clientCred.username} password`);
        } catch (error) {
            console.error('Failed to reveal client credential', error);
        } finally {
            setLoadingIds(prev => ({ ...prev, [`client_${clientCred.id}`]: false }));
        }
    };

    const handleCopyClientPassword = async (clientCred: ClientAccessCredential) => {
        let password = revealedClients[clientCred.id];
        if (!password) {
            try {
                const res = await axios.post(`/developer/reveal-client-credential/${clientCred.id}`);
                password = res.data.password;
                setRevealedClients(prev => ({ ...prev, [clientCred.id]: password! }));
            } catch (err) {
                console.error('Failed to fetch client password for copy', err);
                return;
            }
        }

        if (password) {
            navigator.clipboard.writeText(password);
            triggerCopyFeedback(`Copied password for ${clientCred.username}`);
            try {
                await axios.post('/developer/log-copy', {
                    project_id: project.id,
                    target_field: `Client Password: ${clientCred.username}${clientCred.email ? ` (${clientCred.email})` : ''}`,
                    action_type: 'COPIED_KEY',
                });
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleRevealAccountPassword = async (account: ThirdPartyAccount) => {
        if (revealedAccounts[account.id]) {
            const copy = { ...revealedAccounts };
            delete copy[account.id];
            setRevealedAccounts(copy);
            return;
        }

        setLoadingIds(prev => ({ ...prev, [`acc_${account.id}`]: true }));
        try {
            const res = await axios.post(`/developer/reveal-account/${account.id}`);
            setRevealedAccounts(prev => ({ ...prev, [account.id]: res.data.login_password }));
            triggerCopyFeedback(`Audited: Revealed ${account.service_provider} login`);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingIds(prev => ({ ...prev, [`acc_${account.id}`]: false }));
        }
    };

    const handleRevealServerSecret = async (server: ServerEnvironment, type: 'ssh' | 'env') => {
        const key = `${server.id}_${type}`;
        if (revealedServers[key]) {
            const copy = { ...revealedServers };
            delete copy[key];
            setRevealedServers(copy);
            return;
        }

        setLoadingIds(prev => ({ ...prev, [`srv_${key}`]: true }));
        try {
            const res = await axios.post(`/developer/reveal-server/${server.id}?type=${type}`);
            setRevealedServers(prev => ({ ...prev, [key]: res.data.value }));
            triggerCopyFeedback(`Audited: Revealed ${type.toUpperCase()} credentials`);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingIds(prev => ({ ...prev, [`srv_${key}`]: false }));
        }
    };

    const handleCopyText = async (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        triggerCopyFeedback(`Copied: ${label}`);
        try {
            await axios.post('/developer/log-copy', {
                project_id: project.id,
                target_field: label,
                action_type: 'COPIED_KEY',
            });
        } catch (err) {
            console.error(err);
        }
    };

    const tabs: { id: TabType; label: string; count?: number; icon: string }[] = [
        { id: 'credentials', label: 'Credential Vault', count: project.credentials?.length || 0, icon: '🔑' },
        { id: 'client_credentials', label: 'Client Access Credentials', count: (project.client_access_credentials || project.clientAccessCredentials)?.length || 0, icon: '👤' },
        { id: 'links', label: 'Repositories & External Links', count: project.links?.length || 0, icon: '🔗' },
        { id: 'servers', label: 'Server & Hosting Environments', count: project.server_environments?.length || 0, icon: '🖥️' },
        { id: 'accounts', label: 'Third-Party & Cloud Accounts', count: project.third_party_accounts?.length || 0, icon: '☁️' },
        { id: 'services', label: 'Background Daemons & Workers', count: project.background_services?.length || 0, icon: '⚙️' },
        { id: 'iot', label: 'IOT Hardware & Telemetry', count: project.iot_configurations?.length || 0, icon: '📡' },
        { id: 'overview', label: 'Assigned Developers', count: project.developers?.length || 0, icon: '👥' },
    ];

    return (
        <div className={isPage ? "w-full min-w-0" : "fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"}>
            <div className={`relative w-full ${isPage ? 'rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-w-0' : 'max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] min-w-0'}`}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-slate-800/80 bg-slate-900/60 gap-3">
                    <div className="space-y-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight break-words">
                            {project.name}
                        </h2>
                        {project.tech_stack && (
                            <p className="text-xs font-mono text-slate-400 break-words">
                                <span className="text-slate-500">Stack:</span> {project.tech_stack}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end shrink-0">
                        {isPage ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Dashboard
                            </Link>
                        ) : (
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                                title="Close modal"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs Header with Horizontal Scroll Controls & Visual Indicators */}
                <div className="relative border-b border-slate-800 bg-slate-900/50 flex items-center">
                    {/* Left Scroll Button */}
                    {canScrollLeft && (
                        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-3 pl-1.5 bg-gradient-to-r from-slate-900 via-slate-900/95 to-transparent">
                            <button
                                onClick={() => scrollTabs('left')}
                                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-lg transition-all hover:scale-105 active:scale-95"
                                title="Scroll tabs left"
                                type="button"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Scrollable Tabs List */}
                    <div
                        ref={tabsContainerRef}
                        onScroll={updateScrollButtons}
                        onWheel={handleWheelScroll}
                        className="flex items-center gap-1.5 overflow-x-auto px-3 sm:px-4 pt-2.5 pb-1 w-full scroll-smooth select-none focus:outline-none [scrollbar-width:thin] [scrollbar-color:#334155_transparent]"
                    >
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={(e) => {
                                    setActiveTab(tab.id);
                                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                                }}
                                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap shrink-0 ${
                                    activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-400 bg-slate-800/80 shadow-sm'
                                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                        activeTab === tab.id
                                            ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30'
                                            : 'bg-slate-800 text-slate-400'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Right Scroll Button */}
                    {canScrollRight && (
                        <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-3 pr-1.5 bg-gradient-to-l from-slate-900 via-slate-900/95 to-transparent">
                            <button
                                onClick={() => scrollTabs('right')}
                                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-lg transition-all hover:scale-105 active:scale-95"
                                title="Scroll tabs right"
                                type="button"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Tab Contents */}
                <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
                    {/* TAB: CREDENTIALS VAULT */}
                    {activeTab === 'credentials' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-200">
                                        Credential Vault ({project.credentials?.length || 0})
                                    </h3>
                                    <span className="text-xs text-slate-400">
                                        Click <strong>Reveal</strong> to decrypt with automated audit stamp.
                                    </span>
                                </div>
                                {project.is_owner && (
                                    <button
                                        onClick={() => setSubEntityModal({ type: 'credentials' })}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto"
                                    >
                                        + Add Credential
                                    </button>
                                )}
                            </div>

                            {(!project.credentials || project.credentials.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No credentials registered for this project yet.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {project.credentials.map((cred) => {
                                        const isRevealed = Boolean(revealedSecrets[cred.id]);
                                        const val = revealedSecrets[cred.id];
                                        const isLoading = loadingIds[`cred_${cred.id}`];

                                        return (
                                            <div
                                                key={cred.id}
                                                className="p-3.5 sm:p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                                            >
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono font-bold text-sm text-slate-100 break-all">
                                                            {cred.key_name}
                                                        </span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                                            cred.environment === 'production' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                            cred.environment === 'staging' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                            'bg-slate-700 text-slate-300'
                                                        }`}>
                                                            {cred.environment}
                                                        </span>
                                                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                                            {cred.category.replace('_', ' ')}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {isRevealed ? (
                                                            <div className="font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1.5 rounded-lg select-all break-all max-w-full overflow-x-auto">
                                                                {val}
                                                            </div>
                                                        ) : (
                                                            <div className="font-mono text-xs text-slate-500 tracking-widest bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                                                                ••••••••••••••••••••••••••••••••
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-700/40 w-full sm:w-auto justify-end">
                                                    <button
                                                        onClick={() => handleRevealSecret(cred)}
                                                        disabled={isLoading}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                                            isRevealed
                                                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                                                        }`}
                                                    >
                                                        {isLoading ? (
                                                            <span>Decrypting...</span>
                                                        ) : isRevealed ? (
                                                            <>
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                                                </svg>
                                                                Hide
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                Reveal Secret
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => handleCopySecret(cred)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors flex items-center gap-1.5"
                                                        title="Copy secret and log audit record"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        Copy
                                                    </button>

                                                    {project.is_owner && (
                                                        <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-700">
                                                            <button
                                                                onClick={() => setSubEntityModal({ type: 'credentials', item: cred })}
                                                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                                title="Edit credential"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSubEntity('credentials', cred.id, cred.key_name)}
                                                                disabled={deletingId === `credentials_${cred.id}`}
                                                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                                                title="Delete credential"
                                                            >
                                                                {deletingId === `credentials_${cred.id}` ? '...' : 'Delete'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: CLIENT ACCESS CREDENTIALS */}
                    {activeTab === 'client_credentials' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-200">
                                        Client Access Credentials & App Logins ({((project.client_access_credentials || project.clientAccessCredentials)?.length || 0)})
                                    </h3>
                                    <span className="text-xs text-slate-400">
                                        Click <strong>Reveal Password</strong> to decrypt with automated audit logging.
                                    </span>
                                </div>
                                {project.is_owner && (
                                    <button
                                        onClick={() => setSubEntityModal({ type: 'client_credentials' })}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto"
                                    >
                                        + Add Client Access
                                    </button>
                                )}
                            </div>

                            {(!((project.client_access_credentials || project.clientAccessCredentials)?.length)) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No client access credentials configured for this application yet.
                                </div>
                            ) : (
                                <div className="grid gap-3.5 sm:gap-4">
                                    {(project.client_access_credentials || project.clientAccessCredentials)!.map((clientCred) => {
                                        const isRevealed = Boolean(revealedClients[clientCred.id]);
                                        const isLoading = Boolean(loadingIds[`client_${clientCred.id}`]);

                                        return (
                                            <div
                                                key={clientCred.id}
                                                className="p-3.5 sm:p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="space-y-1 min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-slate-100 text-sm break-all">{clientCred.username}</span>
                                                            {clientCred.role && (
                                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                                    {clientCred.role}
                                                                </span>
                                                            )}
                                                            {clientCred.environment && (
                                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                                                    clientCred.environment === 'production' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                                    clientCred.environment === 'staging' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                    'bg-slate-700 text-slate-300'
                                                                }`}>
                                                                    {clientCred.environment}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {clientCred.email && (
                                                            <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                                                                <span>Email: <strong className="text-slate-200 break-all">{clientCred.email}</strong></span>
                                                                <button
                                                                    onClick={() => handleCopyText(clientCred.email!, `Client Email: ${clientCred.username}`)}
                                                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline"
                                                                >
                                                                    Copy
                                                                </button>
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-700/40 w-full sm:w-auto justify-end">
                                                        {clientCred.login_url && (
                                                            <a
                                                                href={clientCred.login_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
                                                                title="Open Login Portal"
                                                            >
                                                                <span>Portal</span>
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </a>
                                                        )}

                                                        <button
                                                            onClick={() => handleRevealClientCredential(clientCred)}
                                                            disabled={isLoading}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                                                isRevealed
                                                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                                                            }`}
                                                        >
                                                            {isLoading ? (
                                                                <span>Decrypting...</span>
                                                            ) : isRevealed ? (
                                                                <>
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                                                    </svg>
                                                                    Hide
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                    Reveal Password
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => handleCopyClientPassword(clientCred)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors flex items-center gap-1.5"
                                                            title="Copy password and log audit record"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            Copy Password
                                                        </button>

                                                        {project.is_owner && (
                                                            <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-700">
                                                                <button
                                                                    onClick={() => setSubEntityModal({ type: 'client_credentials', item: clientCred })}
                                                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                                    title="Edit client access"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSubEntity('client_credentials', clientCred.id, clientCred.username)}
                                                                    disabled={deletingId === `client_credentials_${clientCred.id}`}
                                                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                                                    title="Delete client access"
                                                                >
                                                                    {deletingId === `client_credentials_${clientCred.id}` ? '...' : 'Delete'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Details Row: Username, Email, Password */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 break-words">
                                                    <div>
                                                        <span className="text-slate-500">UserName:</span>{' '}
                                                        <span className="text-slate-200 font-mono font-medium">{clientCred.username}</span>
                                                        <button
                                                            onClick={() => handleCopyText(clientCred.username, `Client Username: ${clientCred.username}`)}
                                                            className="ml-2 text-[10px] text-indigo-400 hover:underline"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Email:</span>{' '}
                                                        <span className="text-slate-200 font-mono break-all">{clientCred.email || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Password:</span>{' '}
                                                        <span className="font-mono text-amber-300 break-all">
                                                            {isRevealed ? (
                                                                <span className="font-bold">{revealedClients[clientCred.id]}</span>
                                                            ) : (
                                                                <span className="tracking-widest">••••••••••••</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Notes / 2FA */}
                                                {clientCred.notes && (
                                                    <div className="text-xs bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80 text-slate-300 break-words">
                                                        <span className="text-slate-500 font-medium">Notes / 2FA:</span> {clientCred.notes}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: REPOSITORIES & GIT */}
                    {activeTab === 'links' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-slate-200">
                                    Repositories & External Links ({project.links?.length || 0})
                                </h3>
                                {project.is_owner && (
                                    <button
                                        onClick={() => setSubEntityModal({ type: 'links' })}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto"
                                    >
                                        + Add Repository
                                    </button>
                                )}
                            </div>

                            {(!project.links || project.links.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No repositories linked yet.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {project.links.map((link) => (
                                        <div
                                            key={link.id}
                                            className="p-3.5 sm:p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                                        >
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-slate-100 text-sm break-all">{link.title}</span>
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                                        {link.category}
                                                    </span>
                                                </div>
                                                {link.branch_strategy && (
                                                    <p className="text-xs text-slate-400 font-mono break-all">
                                                        <span className="text-slate-500">Branching:</span> {link.branch_strategy}
                                                    </p>
                                                )}
                                                <p className="text-xs text-indigo-400 font-mono break-all max-w-full">
                                                    {link.url}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-700/40 w-full sm:w-auto justify-end">
                                                <button
                                                    onClick={() => handleCopyText(link.url, `Repo URL: ${link.title}`)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                                                >
                                                    Copy URL
                                                </button>
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                                                >
                                                    Open
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>

                                                {project.is_owner && (
                                                    <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-700">
                                                        <button
                                                            onClick={() => setSubEntityModal({ type: 'links', item: link })}
                                                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                            title="Edit repository"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSubEntity('links', link.id, link.title)}
                                                            disabled={deletingId === `links_${link.id}`}
                                                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                                            title="Delete repository"
                                                        >
                                                            {deletingId === `links_${link.id}` ? '...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: SERVERS */}
                    {activeTab === 'servers' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-slate-200">
                                    Server & Hosting Environments ({project.server_environments?.length || 0})
                                </h3>
                                {project.is_owner && (
                                    <button
                                        onClick={() => setSubEntityModal({ type: 'servers' })}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto"
                                    >
                                        + Add Server
                                    </button>
                                )}
                            </div>

                            {(!project.server_environments || project.server_environments.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No server environments configured.
                                </div>
                            ) : (
                                <div className="grid gap-3.5 sm:gap-4">
                                    {project.server_environments.map((server) => {
                                        const sshRevealed = Boolean(revealedServers[`${server.id}_ssh`]);
                                        const envRevealed = Boolean(revealedServers[`${server.id}_env`]);

                                        return (
                                            <div
                                                key={server.id}
                                                className="p-3.5 sm:p-5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3 sm:space-y-4"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                    <div className="space-y-1 min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-bold text-slate-100 break-all">{server.hosting_provider}</span>
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                                                server.environment_type === 'production' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                                server.environment_type === 'staging' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                'bg-slate-700 text-slate-300'
                                                            }`}>
                                                                {server.environment_type}
                                                            </span>
                                                        </div>
                                                        <div className="font-mono text-xs text-slate-400 flex items-center gap-x-4 gap-y-1 flex-wrap break-all">
                                                            {server.ip_address && (
                                                                <span>IP: <strong className="text-slate-200">{server.ip_address}</strong></span>
                                                            )}
                                                            {server.hostname && (
                                                                <span>Host: <strong className="text-slate-200">{server.hostname}</strong></span>
                                                            )}
                                                            <span>SSH: <strong className="text-slate-200">{server.ssh_user}@{server.ip_address || server.hostname}:{server.ssh_port}</strong></span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-700/40 w-full sm:w-auto justify-end">
                                                        <button
                                                            onClick={() => handleRevealServerSecret(server, 'ssh')}
                                                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                                                        >
                                                            {sshRevealed ? 'Hide SSH Key' : 'Reveal SSH Key'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRevealServerSecret(server, 'env')}
                                                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                                        >
                                                            {envRevealed ? 'Hide .env' : 'View .env Backup'}
                                                        </button>

                                                        {project.is_owner && (
                                                            <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-700">
                                                                <button
                                                                    onClick={() => setSubEntityModal({ type: 'servers', item: server })}
                                                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                                    title="Edit server"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSubEntity('servers', server.id, `${server.hosting_provider} (${server.environment_type})`)}
                                                                    disabled={deletingId === `servers_${server.id}`}
                                                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                                                    title="Delete server"
                                                                >
                                                                    {deletingId === `servers_${server.id}` ? '...' : 'Delete'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800 break-words">
                                                    <div>
                                                        <span className="text-slate-500">Runtime Stack:</span>{' '}
                                                        <span className="text-slate-300 font-medium">{server.runtime_stack || 'Standard'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Deploy Path:</span>{' '}
                                                        <span className="text-slate-300 font-mono break-all">{server.deploy_path || '-'}</span>
                                                    </div>
                                                </div>

                                                {/* SSH Key Display Box */}
                                                {sshRevealed && (
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                                            <span className="font-semibold text-amber-400">Decrypted SSH Credential (Audited)</span>
                                                            <button
                                                                onClick={() => handleCopyText(revealedServers[`${server.id}_ssh`], `SSH Key [${server.environment_type}]`)}
                                                                className="text-indigo-400 hover:underline"
                                                            >
                                                                Copy SSH Key
                                                            </button>
                                                        </div>
                                                        <pre className="p-3 bg-black/60 rounded-lg border border-amber-500/30 text-xs font-mono text-amber-200/90 overflow-x-auto max-h-36 break-all whitespace-pre-wrap">
                                                            {revealedServers[`${server.id}_ssh`]}
                                                        </pre>
                                                    </div>
                                                )}

                                                {/* .env Display Box */}
                                                {envRevealed && (
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                                            <span className="font-semibold text-indigo-400">Decrypted Active .env Configuration (Audited)</span>
                                                            <button
                                                                onClick={() => handleCopyText(revealedServers[`${server.id}_env`], `.env Backup [${server.environment_type}]`)}
                                                                className="text-indigo-400 hover:underline"
                                                            >
                                                                Copy .env
                                                            </button>
                                                        </div>
                                                        <pre className="p-3 bg-black/60 rounded-lg border border-indigo-500/30 text-xs font-mono text-indigo-200/90 overflow-x-auto max-h-48 break-all whitespace-pre-wrap">
                                                            {revealedServers[`${server.id}_env`]}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: THIRD-PARTY ACCOUNTS */}
                    {activeTab === 'accounts' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-slate-200">
                                    Third-Party & Cloud Accounts ({project.third_party_accounts?.length || 0})
                                </h3>
                                {project.is_owner && (
                                    <button
                                        onClick={() => setSubEntityModal({ type: 'accounts' })}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto"
                                    >
                                        + Add Cloud Account
                                    </button>
                                )}
                            </div>

                            {(!project.third_party_accounts || project.third_party_accounts.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No third-party accounts configured.
                                </div>
                            ) : (
                                <div className="grid gap-3.5 sm:gap-4">
                                    {project.third_party_accounts.map((acc) => {
                                        const isRevealed = Boolean(revealedAccounts[acc.id]);

                                        return (
                                            <div
                                                key={acc.id}
                                                className="p-3.5 sm:p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-slate-100 text-sm break-all">{acc.service_provider}</span>
                                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                                                {acc.environment}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-0.5 break-all">
                                                            Account ID / Login: <strong className="text-slate-200">{acc.account_identifier}</strong>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-700/40 w-full sm:w-auto justify-end">
                                                        <button
                                                            onClick={() => handleRevealAccountPassword(acc)}
                                                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                                                        >
                                                            {isRevealed ? 'Hide Password' : 'Reveal Password'}
                                                        </button>
                                                        {acc.console_url && (
                                                            <a
                                                                href={acc.console_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                                                            >
                                                                Console
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </a>
                                                        )}

                                                        {project.is_owner && (
                                                            <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-700">
                                                                <button
                                                                    onClick={() => setSubEntityModal({ type: 'accounts', item: acc })}
                                                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                                    title="Edit account"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSubEntity('accounts', acc.id, acc.service_provider)}
                                                                    disabled={deletingId === `accounts_${acc.id}`}
                                                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                                                    title="Delete account"
                                                                >
                                                                    {deletingId === `accounts_${acc.id}` ? '...' : 'Delete'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {isRevealed && (
                                                    <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                                                        <span className="font-mono text-amber-200 break-all">{revealedAccounts[acc.id]}</span>
                                                        <button
                                                            onClick={() => handleCopyText(revealedAccounts[acc.id], `Account Password: ${acc.service_provider}`)}
                                                            className="text-amber-400 hover:underline font-semibold"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                )}

                                                {acc.notes && (
                                                    <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                                        <span className="text-slate-500 font-semibold">2FA & Access Notes:</span> {acc.notes}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: BACKGROUND DAEMONS */}
                    {activeTab === 'services' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <h3 className="text-sm font-semibold text-slate-200">
                                    Background Daemons & Workers ({project.background_services?.length || 0})
                                </h3>
                                {project.is_owner && (
                                    <button
                                        onClick={() => setSubEntityModal({ type: 'services' })}
                                        className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        + Add Daemon
                                    </button>
                                )}
                            </div>

                            {(!project.background_services || project.background_services.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No background daemons or queues configured.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {project.background_services.map((svc) => (
                                        <div
                                            key={svc.id}
                                            className="p-3.5 sm:p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2.5"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                        {svc.service_type.replace('_', ' ')}
                                                    </span>
                                                    {svc.frequency_or_config && (
                                                        <span className="font-mono text-xs text-slate-400 break-all">
                                                            {svc.frequency_or_config}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => handleCopyText(svc.command, `Service command: ${svc.command}`)}
                                                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                                    >
                                                        Copy Command
                                                    </button>

                                                    {project.is_owner && (
                                                        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
                                                            <button
                                                                onClick={() => setSubEntityModal({ type: 'services', item: svc })}
                                                                className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                                title="Edit daemon"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSubEntity('services', svc.id, svc.service_type)}
                                                                disabled={deletingId === `services_${svc.id}`}
                                                                className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                                                title="Delete daemon"
                                                            >
                                                                {deletingId === `services_${svc.id}` ? '...' : 'Delete'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="font-mono text-xs text-emerald-400 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                                                $ {svc.command}
                                            </div>

                                            {svc.monitoring_notes && (
                                                <p className="text-xs text-slate-400 break-words">
                                                    {svc.monitoring_notes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: IOT & TELEMETRY */}
                    {activeTab === 'iot' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <h3 className="text-sm font-semibold text-slate-200">
                                    IOT Hardware & Telemetry ({project.iot_configurations?.length || 0})
                                </h3>
                                {project.is_owner && (
                                    <button
                                        onClick={() => setSubEntityModal({ type: 'iot' })}
                                        className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        + Add IoT Device
                                    </button>
                                )}
                            </div>

                            {(!project.iot_configurations || project.iot_configurations.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No IoT configurations on record.
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {project.iot_configurations.map((iot) => (
                                        <div
                                            key={iot.id}
                                            className="p-3.5 sm:p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-bold text-slate-100 text-sm">{iot.hardware_model}</span>
                                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            {iot.communication_protocol}
                                                        </span>
                                                        {iot.firmware_version && (
                                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                                                {iot.firmware_version}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {iot.broker_url && (
                                                        <div className="font-mono text-xs text-slate-400 mt-1 break-all">
                                                            Broker: <strong className="text-slate-200">{iot.broker_url}:{iot.port || '8883'}</strong>
                                                        </div>
                                                    )}
                                                </div>

                                                {project.is_owner && (
                                                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                                                        <button
                                                            onClick={() => setSubEntityModal({ type: 'iot', item: iot })}
                                                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                            title="Edit IoT device"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSubEntity('iot', iot.id, iot.hardware_model)}
                                                            disabled={deletingId === `iot_${iot.id}`}
                                                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                                            title="Delete IoT device"
                                                        >
                                                            {deletingId === `iot_${iot.id}` ? '...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {iot.topic_structure && (
                                                <div className="text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 break-all">
                                                    <span className="text-slate-500 font-semibold">Topic Structure:</span>{' '}
                                                    <code className="text-cyan-400 font-mono">{iot.topic_structure}</code>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: DOCUMENTS */}
                    {activeTab === 'documents' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <h3 className="text-sm font-semibold text-slate-200">
                                    Documentation & Diagrams Vault ({project.documents?.length || 0})
                                </h3>
                                {project.is_owner && (
                                    <button
                                        onClick={() => setSubEntityModal({ type: 'documents' })}
                                        className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        + Upload Document
                                    </button>
                                )}
                            </div>

                            {(!project.documents || project.documents.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No project documents uploaded yet.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {project.documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="p-3.5 sm:p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs uppercase">
                                                    {doc.file_type || 'DOC'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-semibold text-slate-100 text-sm truncate">{doc.title}</h4>
                                                    <p className="text-xs text-slate-400 font-mono truncate">{doc.file_path}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                <a
                                                    href={`/storage/${doc.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download
                                                </a>

                                                {project.is_owner && (
                                                    <button
                                                        onClick={() => handleDeleteSubEntity('documents', doc.id, doc.title)}
                                                        disabled={deletingId === `documents_${doc.id}`}
                                                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                                        title="Delete document"
                                                    >
                                                        {deletingId === `documents_${doc.id}` ? '...' : 'Delete'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: ASSIGNED DEVELOPERS */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-200">
                                        Assigned Developers ({project.developers?.length || 0})
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Team members assigned to contribute, develop, and inspect this project.
                                    </p>
                                </div>
                                {project.is_owner && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLeadDevId(project.lead_developer_id ? String(project.lead_developer_id) : '');
                                                setProjectManagerId(project.manager_id ? String(project.manager_id) : '');
                                                setIsEditLeadsModalOpen(true);
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                                        >
                                            <span>⚙️</span> Manage Roles / Leads
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedDevId('');
                                                setIsAssignDevModalOpen(true);
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                                        >
                                            <span>+</span> Assign Developer
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Assigned Developers Team */}
                            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Project Developers Team
                                    </h4>
                                    {project.is_owner && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedDevId('');
                                                setIsAssignDevModalOpen(true);
                                            }}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                                        >
                                            + Add Member
                                        </button>
                                    )}
                                </div>

                                {project.developers && project.developers.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {project.developers.map((dev) => {
                                            const isCreator = dev.id === project.created_by_id;
                                            const isLead = dev.id === project.lead_developer_id;

                                            return (
                                                <div
                                                    key={dev.id}
                                                    className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 text-xs group hover:border-slate-700 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="relative shrink-0">
                                                            <div className="h-7 w-7 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold flex items-center justify-center text-xs">
                                                                {dev.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-900"></span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-slate-200 font-medium truncate flex items-center gap-1.5">
                                                                <span className="truncate">{dev.name}</span>
                                                                {isCreator && (
                                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                                                        Creator
                                                                    </span>
                                                                )}
                                                                {isLead && (
                                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                                                        Lead
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-slate-500 truncate text-[11px]">{dev.email}</div>
                                                        </div>
                                                    </div>

                                                    {project.is_owner && !isCreator && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUnassignDeveloper(dev.id, dev.name)}
                                                            disabled={isSubmittingDev}
                                                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                                                            title={`Remove ${dev.name} from project`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500">No developers assigned yet.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Developer</h4>
                                        {project.is_owner && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLeadDevId(project.lead_developer_id ? String(project.lead_developer_id) : '');
                                                    setProjectManagerId(project.manager_id ? String(project.manager_id) : '');
                                                    setIsEditLeadsModalOpen(true);
                                                }}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                                            >
                                                Change
                                            </button>
                                        )}
                                    </div>
                                    {project.lead_developer ? (
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 shrink-0 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                                {project.lead_developer.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-slate-200 truncate">{project.lead_developer.name}</div>
                                                <div className="text-xs text-slate-400 truncate">{project.lead_developer.email}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-500">Unassigned</span>
                                    )}
                                </div>

                                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Manager / Lead</h4>
                                        {project.is_owner && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLeadDevId(project.lead_developer_id ? String(project.lead_developer_id) : '');
                                                    setProjectManagerId(project.manager_id ? String(project.manager_id) : '');
                                                    setIsEditLeadsModalOpen(true);
                                                }}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                                            >
                                                Change
                                            </button>
                                        )}
                                    </div>
                                    {project.manager ? (
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 shrink-0 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                                {project.manager.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-slate-200 truncate">{project.manager.name}</div>
                                                <div className="text-xs text-slate-400 truncate">{project.manager.email}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-500">Unassigned</span>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 sm:p-5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                                <h3 className="text-sm font-semibold text-slate-200">Architecture Scope & Specifications</h3>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                                    {project.description || 'No detailed architecture description provided.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3.5 sm:p-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="text-center sm:text-left">
                        Project ID: <span className="font-mono text-slate-200">#{project.id}</span> • Registered in Vault
                    </div>
                    {isPage ? (
                        <Link
                            href={route('dashboard')}
                            className="w-full sm:w-auto text-center px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </Link>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        >
                            Close Vault
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-Entity Modal for Adding / Editing Details */}
            {project.is_owner && subEntityModal && (
                <SubEntityFormModal
                    isOpen={Boolean(subEntityModal)}
                    onClose={() => setSubEntityModal(null)}
                    projectId={project.id}
                    type={subEntityModal.type}
                    itemToEdit={subEntityModal.item}
                />
            )}

            {/* Assign Developer Modal */}
            {project.is_owner && isAssignDevModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
                    <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-6 space-y-4 sm:space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Team Management</span>
                                <h3 className="text-base font-bold text-white">Assign Developer to Project</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAssignDevModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAssignDeveloper} className="space-y-4 text-xs">
                            {unassignedDevelopers.length > 0 ? (
                                <div className="space-y-1.5">
                                    <label className="font-bold text-slate-300">Select Developer to Assign *</label>
                                    <select
                                        value={selectedDevId}
                                        onChange={(e) => setSelectedDevId(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">-- Choose a developer --</option>
                                        {unassignedDevelopers.map((dev) => (
                                            <option key={dev.id} value={dev.id}>
                                                {dev.name} ({dev.email})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-slate-500">
                                        Assigned developers will be able to view project parameters and credentials.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 text-center text-slate-400">
                                    All registered developers are already assigned to this project team.
                                </div>
                            )}

                            <div className="pt-3 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignDevModalOpen(false)}
                                    className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:bg-slate-800 transition-colors text-center"
                                >
                                    Cancel
                                </button>
                                {unassignedDevelopers.length > 0 && (
                                    <button
                                        type="submit"
                                        disabled={!selectedDevId || isSubmittingDev}
                                        className="px-4 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50 text-center"
                                    >
                                        {isSubmittingDev ? 'Assigning...' : 'Assign to Team'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Leadership Roles Modal */}
            {project.is_owner && isEditLeadsModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
                    <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-6 space-y-4 sm:space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Project Roles</span>
                                <h3 className="text-base font-bold text-white">Manage Leadership Roles</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditLeadsModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateLeads} className="space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Lead Developer</label>
                                <select
                                    value={leadDevId}
                                    onChange={(e) => setLeadDevId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- None (Unassigned) --</option>
                                    {(availableDevelopers || []).map((dev) => (
                                        <option key={dev.id} value={dev.id}>
                                            {dev.name} ({dev.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Project Manager / Lead</label>
                                <select
                                    value={projectManagerId}
                                    onChange={(e) => setProjectManagerId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- None (Unassigned) --</option>
                                    {(availableDevelopers || []).map((dev) => (
                                        <option key={dev.id} value={dev.id}>
                                            {dev.name} ({dev.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-3 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditLeadsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:bg-slate-800 transition-colors text-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingDev}
                                    className="px-4 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50 text-center"
                                >
                                    {isSubmittingDev ? 'Saving...' : 'Save Roles'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
