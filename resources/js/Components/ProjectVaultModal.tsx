import { AuditLog, Project, ProjectCredential, ServerEnvironment, ThirdPartyAccount } from '@/types';
import axios from 'axios';
import { useState } from 'react';

interface ProjectVaultModalProps {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'overview' | 'credentials' | 'links' | 'servers' | 'accounts' | 'services' | 'iot' | 'documents';

export default function ProjectVaultModal({ project, isOpen, onClose }: ProjectVaultModalProps) {
    if (!isOpen || !project) return null;

    const [activeTab, setActiveTab] = useState<TabType>('credentials');
    const [revealedSecrets, setRevealedSecrets] = useState<Record<number, string>>({});
    const [revealedAccounts, setRevealedAccounts] = useState<Record<number, string>>({});
    const [revealedServers, setRevealedServers] = useState<Record<string, string>>({});
    const [revealedIot, setRevealedIot] = useState<Record<number, string>>({});
    const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

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
        { id: 'credentials', label: 'Credentials Vault', count: project.credentials?.length || 0, icon: '🔑' },
        { id: 'links', label: 'Repositories & Git', count: project.links?.length || 0, icon: '🔗' },
        { id: 'servers', label: 'Servers & Environments', count: project.server_environments?.length || 0, icon: '🖥️' },
        { id: 'accounts', label: 'Third-Party Accounts', count: project.third_party_accounts?.length || 0, icon: '☁️' },
        { id: 'services', label: 'Background Daemons', count: project.background_services?.length || 0, icon: '⚙️' },
        { id: 'iot', label: 'IoT & Telemetry', count: project.iot_configurations?.length || 0, icon: '📡' },
        { id: 'documents', label: 'Documents Vault', count: project.documents?.length || 0, icon: '📄' },
        { id: 'overview', label: 'Architecture & Scope', icon: '📋' },
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-800/80 bg-slate-900/60">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {project.code}
                            </span>
                            <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {project.type.replace('_', ' ')}
                            </span>
                            <span className={`text-xs uppercase font-semibold px-2 py-0.5 rounded ${
                                project.status === 'in_progress' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                project.status === 'planning' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                                {project.status.replace('_', ' ')}
                            </span>
                            <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
                                project.priority === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                project.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-800 text-slate-400'
                            }`}>
                                {project.priority} priority
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {project.name}
                        </h2>
                        {project.tech_stack && (
                            <p className="text-xs font-mono text-slate-400">
                                <span className="text-slate-500">Stack:</span> {project.tech_stack}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        title="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Audit notification banner */}
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between text-xs text-amber-300">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span>
                            <strong>Security Protocol Active:</strong> Decrypted secret revelations and clipboard copies are recorded in immutable audit logs.
                        </span>
                    </div>
                    {copyFeedback && (
                        <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-fade-in">
                            ✓ {copyFeedback}
                        </span>
                    )}
                </div>

                {/* Tabs Header */}
                <div className="flex items-center gap-1 overflow-x-auto px-6 pt-3 border-b border-slate-800 bg-slate-900/30 scrollbar-none">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-400 bg-slate-800/60'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    activeTab === tab.id
                                        ? 'bg-indigo-500/20 text-indigo-300'
                                        : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Contents */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* TAB: CREDENTIALS VAULT */}
                    {activeTab === 'credentials' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-200">
                                    Project API Keys & Secrets Vault ({project.credentials?.length || 0})
                                </h3>
                                <span className="text-xs text-slate-400">
                                    Click <strong>Reveal</strong> to decrypt with automated audit stamp.
                                </span>
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
                                                className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                            >
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-sm text-slate-100 truncate">
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
                                                            <div className="font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-lg select-all break-all">
                                                                {val}
                                                            </div>
                                                        ) : (
                                                            <div className="font-mono text-xs text-slate-500 tracking-widest bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                                                                ••••••••••••••••••••••••••••••••
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
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
                                                </div>
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
                            <h3 className="text-sm font-semibold text-slate-200">
                                Source Code Repositories & External Workspaces ({project.links?.length || 0})
                            </h3>

                            {(!project.links || project.links.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No repositories linked yet.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {project.links.map((link) => (
                                        <div
                                            key={link.id}
                                            className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-4"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-100 text-sm">{link.title}</span>
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                                        {link.category}
                                                    </span>
                                                </div>
                                                {link.branch_strategy && (
                                                    <p className="text-xs text-slate-400 font-mono">
                                                        <span className="text-slate-500">Branching:</span> {link.branch_strategy}
                                                    </p>
                                                )}
                                                <p className="text-xs text-indigo-400 font-mono truncate max-w-md">
                                                    {link.url}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
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
                            <h3 className="text-sm font-semibold text-slate-200">
                                Server Infrastructure & Runtime Environments ({project.server_environments?.length || 0})
                            </h3>

                            {(!project.server_environments || project.server_environments.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No server environments configured.
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {project.server_environments.map((server) => {
                                        const sshRevealed = Boolean(revealedServers[`${server.id}_ssh`]);
                                        const envRevealed = Boolean(revealedServers[`${server.id}_env`]);

                                        return (
                                            <div
                                                key={server.id}
                                                className="p-5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-slate-100">{server.hosting_provider}</span>
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                                                server.environment_type === 'production' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                                server.environment_type === 'staging' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                'bg-slate-700 text-slate-300'
                                                            }`}>
                                                                {server.environment_type}
                                                            </span>
                                                        </div>
                                                        <div className="font-mono text-xs text-slate-400 flex items-center gap-4">
                                                            {server.ip_address && (
                                                                <span>IP: <strong className="text-slate-200">{server.ip_address}</strong></span>
                                                            )}
                                                            {server.hostname && (
                                                                <span>Host: <strong className="text-slate-200">{server.hostname}</strong></span>
                                                            )}
                                                            <span>SSH: <strong className="text-slate-200">{server.ssh_user}@{server.ip_address || server.hostname}:{server.ssh_port}</strong></span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
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
                                                    </div>
                                                </div>

                                                <div className="grid sm:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                                                    <div>
                                                        <span className="text-slate-500">Runtime Stack:</span>{' '}
                                                        <span className="text-slate-300 font-medium">{server.runtime_stack || 'Standard'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Deploy Path:</span>{' '}
                                                        <span className="text-slate-300 font-mono">{server.deploy_path || '-'}</span>
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
                                                        <pre className="p-3 bg-black/60 rounded-lg border border-amber-500/30 text-xs font-mono text-amber-200/90 overflow-x-auto max-h-36">
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
                                                        <pre className="p-3 bg-black/60 rounded-lg border border-indigo-500/30 text-xs font-mono text-indigo-200/90 overflow-x-auto max-h-48">
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
                            <h3 className="text-sm font-semibold text-slate-200">
                                Third-Party Cloud Providers & Platform Accounts ({project.third_party_accounts?.length || 0})
                            </h3>

                            {(!project.third_party_accounts || project.third_party_accounts.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No third-party accounts configured.
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {project.third_party_accounts.map((acc) => {
                                        const isRevealed = Boolean(revealedAccounts[acc.id]);

                                        return (
                                            <div
                                                key={acc.id}
                                                className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-100 text-sm">{acc.service_provider}</span>
                                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                                                {acc.environment}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-0.5">
                                                            Account ID / Login: <strong className="text-slate-200">{acc.account_identifier}</strong>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
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
                                                    </div>
                                                </div>

                                                {isRevealed && (
                                                    <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs">
                                                        <span className="font-mono text-amber-200">{revealedAccounts[acc.id]}</span>
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
                            <h3 className="text-sm font-semibold text-slate-200">
                                Background Workers, Cron Schedules & Daemons ({project.background_services?.length || 0})
                            </h3>

                            {(!project.background_services || project.background_services.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No background daemons or queues configured.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {project.background_services.map((svc) => (
                                        <div
                                            key={svc.id}
                                            className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                        {svc.service_type.replace('_', ' ')}
                                                    </span>
                                                    {svc.frequency_or_config && (
                                                        <span className="font-mono text-xs text-slate-400">
                                                            {svc.frequency_or_config}
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => handleCopyText(svc.command, `Service command: ${svc.command}`)}
                                                    className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                                >
                                                    Copy Command
                                                </button>
                                            </div>

                                            <div className="font-mono text-xs text-emerald-400 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                                                $ {svc.command}
                                            </div>

                                            {svc.monitoring_notes && (
                                                <p className="text-xs text-slate-400">
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
                            <h3 className="text-sm font-semibold text-slate-200">
                                IoT Hardware, Edge Controllers & Protocols ({project.iot_configurations?.length || 0})
                            </h3>

                            {(!project.iot_configurations || project.iot_configurations.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No IoT configurations on record.
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {project.iot_configurations.map((iot) => (
                                        <div
                                            key={iot.id}
                                            className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
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
                                                        <div className="font-mono text-xs text-slate-400 mt-1">
                                                            Broker: <strong className="text-slate-200">{iot.broker_url}:{iot.port || '8883'}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {iot.topic_structure && (
                                                <div className="text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
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
                            <h3 className="text-sm font-semibold text-slate-200">
                                Architecture Blueprints & Documents Vault ({project.documents?.length || 0})
                            </h3>

                            {(!project.documents || project.documents.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                                    No project documents uploaded yet.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {project.documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs uppercase">
                                                    {doc.file_type || 'DOC'}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-100 text-sm">{doc.title}</h4>
                                                    <p className="text-xs text-slate-400 font-mono">{doc.file_path}</p>
                                                </div>
                                            </div>

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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                                <h3 className="text-sm font-semibold text-slate-200">Architecture Scope & Specifications</h3>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {project.description || 'No detailed architecture description provided.'}
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Developer</h4>
                                    {project.lead_developer ? (
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                                                {project.lead_developer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-200">{project.lead_developer.name}</div>
                                                <div className="text-xs text-slate-400">{project.lead_developer.email}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-500">Unassigned</span>
                                    )}
                                </div>

                                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Manager / Lead</h4>
                                    {project.manager ? (
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                                                {project.manager.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-200">{project.manager.name}</div>
                                                <div className="text-xs text-slate-400">{project.manager.email}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-500">Unassigned</span>
                                    )}
                                </div>
                            </div>

                            {project.developers && project.developers.length > 0 && (
                                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Assigned Developers Team ({project.developers.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {project.developers.map((dev) => (
                                            <div
                                                key={dev.id}
                                                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs"
                                            >
                                                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                                                <span className="text-slate-200 font-medium">{dev.name}</span>
                                                <span className="text-slate-500">({dev.email})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
                    <div>
                        Project ID: <span className="font-mono text-slate-200">#{project.id}</span> • Registered in Vault
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                        Close Vault
                    </button>
                </div>
            </div>
        </div>
    );
}
