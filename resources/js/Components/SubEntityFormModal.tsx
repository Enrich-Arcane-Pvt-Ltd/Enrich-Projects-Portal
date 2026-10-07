import { useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { PageProps } from '@/types';

export type SubEntityType = 'credentials' | 'client_credentials' | 'links' | 'servers' | 'accounts' | 'services' | 'iot' | 'documents';

interface SubEntityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    type: SubEntityType;
    itemToEdit?: any;
}

export default function SubEntityFormModal({
    isOpen,
    onClose,
    projectId,
    type,
    itemToEdit,
}: SubEntityFormModalProps) {
    if (!isOpen) return null;

    const isEditing = Boolean(itemToEdit);
    const [docMode, setDocMode] = useState<'file' | 'link'>('file');
    const [localDocError, setLocalDocError] = useState<string | null>(null);

    const { system_limits } = usePage<PageProps>().props;

    // Use dynamic PHP server limit if provided, or conservative default
    const MAX_DOC_FILE_SIZE_BYTES = system_limits?.max_upload_bytes || (7.5 * 1024 * 1024);
    const maxDocMBFormatted = system_limits?.max_upload_mb ? `${system_limits.max_upload_mb} MB` : `${(MAX_DOC_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(1)} MB`;

    // Initial state based on entity type
    const getInitialData = () => {
        switch (type) {
            case 'credentials':
                return {
                    category: itemToEdit?.category || 'api_key',
                    key_name: itemToEdit?.key_name || '',
                    environment: itemToEdit?.environment || 'production',
                    key_value: '',
                };
            case 'client_credentials':
                return {
                    username: itemToEdit?.username || '',
                    email: itemToEdit?.email || '',
                    password: '',
                    role: itemToEdit?.role || '',
                    login_url: itemToEdit?.login_url || '',
                    environment: itemToEdit?.environment || 'production',
                    notes: itemToEdit?.notes || '',
                };
            case 'links':
                return {
                    category: itemToEdit?.category || 'github',
                    title: itemToEdit?.title || '',
                    url: itemToEdit?.url || '',
                    branch_strategy: itemToEdit?.branch_strategy || '',
                };
            case 'servers':
                return {
                    environment_type: itemToEdit?.environment_type || 'production',
                    hosting_provider: itemToEdit?.hosting_provider || '',
                    ip_address: itemToEdit?.ip_address || '',
                    hostname: itemToEdit?.hostname || '',
                    ssh_port: itemToEdit?.ssh_port || 22,
                    ssh_user: itemToEdit?.ssh_user || 'ubuntu',
                    ssh_credential: '',
                    runtime_stack: itemToEdit?.runtime_stack || '',
                    deploy_path: itemToEdit?.deploy_path || '',
                    env_backup: '',
                };
            case 'accounts':
                return {
                    service_provider: itemToEdit?.service_provider || '',
                    account_identifier: itemToEdit?.account_identifier || '',
                    login_password: '',
                    console_url: itemToEdit?.console_url || '',
                    project_or_app_id: itemToEdit?.project_or_app_id || '',
                    environment: itemToEdit?.environment || 'production',
                    notes: itemToEdit?.notes || '',
                };
            case 'services':
                return {
                    service_type: itemToEdit?.service_type || 'cron_schedule',
                    command: itemToEdit?.command || '',
                    frequency_or_config: itemToEdit?.frequency_or_config || '',
                    monitoring_notes: itemToEdit?.monitoring_notes || '',
                };
            case 'iot':
                return {
                    hardware_model: itemToEdit?.hardware_model || '',
                    firmware_version: itemToEdit?.firmware_version || '',
                    communication_protocol: itemToEdit?.communication_protocol || 'MQTT',
                    broker_url: itemToEdit?.broker_url || '',
                    port: itemToEdit?.port || '8883',
                    topic_structure: itemToEdit?.topic_structure || '',
                    auth_token_or_certs: '',
                };
            case 'documents':
                return {
                    title: itemToEdit?.title || '',
                    file_url: (itemToEdit?.file_type === 'external' || (itemToEdit?.file_path && itemToEdit.file_path.startsWith('http'))) ? (itemToEdit?.file_path || '') : '',
                    file: null as File | null,
                };
            default:
                return {};
        }
    };

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(getInitialData());

    useEffect(() => {
        setData(getInitialData());
        clearErrors();
        setLocalDocError(null);
        if (type === 'documents') {
            if (itemToEdit?.file_type === 'external' || (itemToEdit?.file_path && itemToEdit.file_path.startsWith('http'))) {
                setDocMode('link');
            } else {
                setDocMode('file');
            }
        }
    }, [itemToEdit, type, isOpen]);

    const getEndpoint = () => {
        switch (type) {
            case 'credentials': return 'credentials';
            case 'client_credentials': return 'client-credentials';
            case 'links': return 'links';
            case 'servers': return 'servers';
            case 'accounts': return 'accounts';
            case 'services': return 'services';
            case 'iot': return 'iot';
            case 'documents': return 'documents';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalDocError(null);

        if (type === 'documents') {
            if (docMode === 'file' && !isEditing && !(data as any).file) {
                setLocalDocError('Please select a file to upload (.zip, code files, .docx, .pdf, etc.).');
                return;
            }
            if (docMode === 'file' && (data as any).file && (data as any).file.size > MAX_DOC_FILE_SIZE_BYTES) {
                setLocalDocError(
                    `The selected file is ${((data as any).file.size / (1024 * 1024)).toFixed(1)} MB, which exceeds the direct upload limit of ${maxDocMBFormatted}. Server limits (post_max_size / upload_max_filesize) reject larger uploads with HTTP 413. Please switch to the "External Link" tab to link via Google Drive, OneDrive, or Dropbox.`
                );
                return;
            }
            if (docMode === 'link' && !(data as any).file_url?.trim()) {
                setLocalDocError('Please provide an external link URL (e.g. Google Drive link).');
                return;
            }
        }

        const endpoint = getEndpoint();

        if (isEditing) {
            if (type === 'documents') {
                post(`/developer/projects/${projectId}/documents/${itemToEdit.id}`, {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        reset();
                        onClose();
                    },
                    onError: (errs) => {
                        const msg = errs?.file || errs?.file_url || errs?.title || 'Failed to update document. Please verify the file size or link.';
                        setLocalDocError(String(msg));
                    },
                });
            } else {
                put(`/developer/projects/${projectId}/${endpoint}/${itemToEdit.id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        reset();
                        onClose();
                    },
                });
            }
        } else {
            post(`/developer/projects/${projectId}/${endpoint}`, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
                onError: (errs) => {
                    if (type === 'documents') {
                        const msg = errs?.file || errs?.file_url || errs?.title || 'Upload rejected. If the file is large, please link via Google Drive instead.';
                        setLocalDocError(String(msg));
                    }
                },
            });
        }
    };

    const getTitle = () => {
        const action = isEditing ? 'Edit' : 'Add';
        switch (type) {
            case 'credentials': return `${action} Secret / API Key`;
            case 'client_credentials': return `${action} Client Access Credential`;
            case 'links': return `${action} Repository / Tool Link`;
            case 'servers': return `${action} Server Infrastructure Node`;
            case 'accounts': return `${action} Third-Party Platform Account`;
            case 'services': return `${action} Background Daemon / Worker`;
            case 'iot': return `${action} IoT Hardware & Telemetry Device`;
            case 'documents': return `${action} Document, Code File, or .zip Archive`;
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80">
                    <div className="space-y-0.5 min-w-0 pr-2">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                            Vault Configuration
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                            {getTitle()}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors shrink-0"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                    {/* CREDENTIALS FORM */}
                    {type === 'credentials' && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Category *</label>
                                    <select
                                        value={(data as any).category}
                                        onChange={(e) => setData('category' as any, e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="api_key">API Key</option>
                                        <option value="webhook_secret">Webhook Secret</option>
                                        <option value="oauth_token">OAuth Token</option>
                                        <option value="ssh_key">SSH Key</option>
                                        <option value="db_password">Database Password</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Environment *</label>
                                    <select
                                        value={(data as any).environment}
                                        onChange={(e) => setData('environment' as any, e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="local">Local / Dev</option>
                                        <option value="staging">Staging / QA</option>
                                        <option value="production">Production</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Key Identifier *</label>
                                <input
                                    type="text"
                                    value={(data as any).key_name}
                                    onChange={(e) => setData('key_name' as any, e.target.value)}
                                    placeholder="e.g. STRIPE_SECRET_KEY"
                                    required
                                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                                {errors.key_name && <p className="text-rose-400">{errors.key_name}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">
                                    Secret Value {isEditing ? '(leave blank to keep unchanged)' : '*'}
                                </label>
                                <textarea
                                    rows={3}
                                    value={(data as any).key_value}
                                    onChange={(e) => setData('key_value' as any, e.target.value)}
                                    placeholder={isEditing ? 'Enter new secret to overwrite...' : 'Enter sensitive secret value...'}
                                    required={!isEditing}
                                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-amber-300 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </>
                    )}

                    {/* CLIENT ACCESS CREDENTIALS FORM */}
                    {type === 'client_credentials' && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">UserName / ID *</label>
                                    <input
                                        type="text"
                                        value={(data as any).username}
                                        onChange={(e) => setData('username' as any, e.target.value)}
                                        placeholder="e.g. client_admin"
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                                    />
                                    {errors.username && <p className="text-rose-400">{errors.username}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Client Email</label>
                                    <input
                                        type="email"
                                        value={(data as any).email}
                                        onChange={(e) => setData('email' as any, e.target.value)}
                                        placeholder="e.g. client@company.com"
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">
                                        Password {isEditing ? '(leave blank to keep)' : '*'}
                                    </label>
                                    <input
                                        type="text"
                                        value={(data as any).password}
                                        onChange={(e) => setData('password' as any, e.target.value)}
                                        placeholder={isEditing ? 'Unchanged' : 'Enter client password'}
                                        required={!isEditing}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Account Role</label>
                                        <span className={`text-[10px] font-mono ${((data as any).role || '').length >= 45 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).role || '').length}/50
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={50}
                                        list="client-role-suggestions"
                                        value={(data as any).role}
                                        onChange={(e) => {
                                            const sanitized = e.target.value
                                                .replace(/[^a-zA-Z0-9\s\-_/&.,()]/g, '')
                                                .slice(0, 50);
                                            setData('role' as any, sanitized);
                                        }}
                                        placeholder="e.g. Primary Admin, Manager"
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <datalist id="client-role-suggestions">
                                        <option value="Primary Admin" />
                                        <option value="Store Manager" />
                                        <option value="Staff / Operator" />
                                        <option value="Billing Admin" />
                                        <option value="Viewer / Read-Only" />
                                        <option value="QA Test Client" />
                                        <option value="Support Agent" />
                                    </datalist>
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] text-slate-500">Quick:</span>
                                        {['Primary Admin', 'Store Manager', 'Staff / Operator', 'Viewer / Read-Only'].map((suggestedRole) => (
                                            <button
                                                key={suggestedRole}
                                                type="button"
                                                onClick={() => setData('role' as any, suggestedRole)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                    (data as any).role === suggestedRole
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                {suggestedRole}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500">Max 50 characters (letters, numbers, spaces, and standard symbols).</p>
                                    {errors.role && <p className="text-xs text-rose-400">{errors.role}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Login Portal URL</label>
                                    <input
                                        type="url"
                                        value={(data as any).login_url}
                                        onChange={(e) => setData('login_url' as any, e.target.value)}
                                        placeholder="https://app.client.com/login"
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Environment *</label>
                                    <select
                                        value={(data as any).environment}
                                        onChange={(e) => setData('environment' as any, e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="local">Local</option>
                                        <option value="staging">Staging</option>
                                        <option value="production">Production</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Notes / 2FA Details</label>
                                <textarea
                                    rows={2}
                                    value={(data as any).notes}
                                    onChange={(e) => setData('notes' as any, e.target.value)}
                                    placeholder="2FA recovery codes, pin, or client-specific access rules..."
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </>
                    )}

                    {/* REPOSITORIES & LINKS FORM */}
                    {type === 'links' && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Platform Category *</label>
                                    <select
                                        value={(data as any).category}
                                        onChange={(e) => setData('category' as any, e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="github">GitHub</option>
                                        <option value="gitlab">GitLab</option>
                                        <option value="bitbucket">Bitbucket</option>
                                        <option value="figma">Figma Specs</option>
                                        <option value="postman">Postman Collection</option>
                                        <option value="jira">Jira Workspace</option>
                                    </select>
                                    {errors.category && <p className="text-xs text-rose-400">{errors.category}</p>}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Repository Title *</label>
                                        <span className={`text-[10px] font-mono ${((data as any).title || '').length >= 90 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).title || '').length}/100
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={100}
                                        value={(data as any).title}
                                        onChange={(e) => setData('title' as any, e.target.value.slice(0, 100))}
                                        placeholder="e.g. Backend API Microservice"
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-[10px] text-slate-500">Max 100 characters. Descriptive name for the repository or tool.</p>
                                    {errors.title && <p className="text-xs text-rose-400">{errors.title}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">URL *</label>
                                <input
                                    type="url"
                                    maxLength={500}
                                    value={(data as any).url}
                                    onChange={(e) => setData('url' as any, e.target.value)}
                                    placeholder="https://github.com/org/repo"
                                    required
                                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 focus:ring-2 focus:ring-indigo-500"
                                />
                                {errors.url && <p className="text-xs text-rose-400">{errors.url}</p>}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="font-bold text-slate-300">Branch Strategy / Notes</label>
                                    <span className={`text-[10px] font-mono ${((data as any).branch_strategy || '').length >= 135 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                        {((data as any).branch_strategy || '').length}/150
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    maxLength={150}
                                    list="branch-strategy-suggestions"
                                    value={(data as any).branch_strategy}
                                    onChange={(e) => setData('branch_strategy' as any, e.target.value.slice(0, 150))}
                                    placeholder="e.g. main -> Prod, develop -> Staging"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                                <datalist id="branch-strategy-suggestions">
                                    <option value="main -> Production, develop -> Staging" />
                                    <option value="GitFlow (main / develop / feature/*)" />
                                    <option value="Trunk-Based (main with feature flags)" />
                                    <option value="release/* -> Production, staging -> QA" />
                                </datalist>
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                    <span className="text-[10px] text-slate-500">Quick:</span>
                                    {['main -> Prod, develop -> Staging', 'GitFlow', 'Trunk-Based'].map((strat) => (
                                        <button
                                            key={strat}
                                            type="button"
                                            onClick={() => setData('branch_strategy' as any, strat)}
                                            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                (data as any).branch_strategy === strat
                                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                            }`}
                                        >
                                            {strat}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500">Max 150 characters. Branching workflow convention.</p>
                                {errors.branch_strategy && <p className="text-xs text-rose-400">{errors.branch_strategy}</p>}
                            </div>
                        </>
                    )}

                    {/* SERVERS FORM */}
                    {type === 'servers' && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Hosting Provider *</label>
                                        <span className={`text-[10px] font-mono ${((data as any).hosting_provider || '').length >= 70 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).hosting_provider || '').length}/80
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={80}
                                        list="hosting-provider-suggestions"
                                        value={(data as any).hosting_provider}
                                        onChange={(e) => setData('hosting_provider' as any, e.target.value.slice(0, 80))}
                                        placeholder="e.g. AWS EC2, DigitalOcean, Hetzner"
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <datalist id="hosting-provider-suggestions">
                                        <option value="AWS EC2" />
                                        <option value="DigitalOcean Droplet" />
                                        <option value="Hetzner Cloud" />
                                        <option value="Google Cloud Compute Engine" />
                                        <option value="Azure Virtual Machine" />
                                        <option value="Linode / Akamai" />
                                        <option value="Contabo VPS" />
                                        <option value="On-Premise Bare Metal" />
                                    </datalist>
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] text-slate-500">Quick:</span>
                                        {['AWS EC2', 'DigitalOcean', 'Hetzner', 'Google Cloud'].map((provider) => (
                                            <button
                                                key={provider}
                                                type="button"
                                                onClick={() => setData('hosting_provider' as any, provider)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                    (data as any).hosting_provider === provider
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                {provider}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500">Max 80 characters. Cloud provider or host infrastructure.</p>
                                    {errors.hosting_provider && <p className="text-xs text-rose-400">{errors.hosting_provider}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Environment Type *</label>
                                    <select
                                        value={(data as any).environment_type}
                                        onChange={(e) => setData('environment_type' as any, e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="development">Development</option>
                                        <option value="staging">Staging</option>
                                        <option value="production">Production</option>
                                    </select>
                                    {errors.environment_type && <p className="text-xs text-rose-400">{errors.environment_type}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">IP Address</label>
                                    <input
                                        type="text"
                                        maxLength={100}
                                        value={(data as any).ip_address}
                                        onChange={(e) => setData('ip_address' as any, e.target.value)}
                                        placeholder="123.45.67.89"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.ip_address && <p className="text-xs text-rose-400">{errors.ip_address}</p>}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">SSH User *</label>
                                        <span className={`text-[10px] font-mono ${((data as any).ssh_user || '').length >= 28 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).ssh_user || '').length}/32
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={32}
                                        list="ssh-user-suggestions"
                                        value={(data as any).ssh_user}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 32);
                                            setData('ssh_user' as any, sanitized);
                                        }}
                                        placeholder="ubuntu"
                                        required
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <datalist id="ssh-user-suggestions">
                                        <option value="ubuntu" />
                                        <option value="root" />
                                        <option value="ec2-user" />
                                        <option value="debian" />
                                        <option value="centos" />
                                        <option value="deployer" />
                                    </datalist>
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] text-slate-500">Quick:</span>
                                        {['ubuntu', 'root', 'ec2-user', 'deployer'].map((usr) => (
                                            <button
                                                key={usr}
                                                type="button"
                                                onClick={() => setData('ssh_user' as any, usr)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                    (data as any).ssh_user === usr
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                {usr}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500">Max 32 chars. Standard Linux system user.</p>
                                    {errors.ssh_user && <p className="text-xs text-rose-400">{errors.ssh_user}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">SSH Port *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={65535}
                                        value={(data as any).ssh_port}
                                        onChange={(e) => setData('ssh_port' as any, Number(e.target.value))}
                                        required
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.ssh_port && <p className="text-xs text-rose-400">{errors.ssh_port}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Runtime Stack</label>
                                        <span className={`text-[10px] font-mono ${((data as any).runtime_stack || '').length >= 105 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).runtime_stack || '').length}/120
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={120}
                                        list="runtime-stack-suggestions"
                                        value={(data as any).runtime_stack}
                                        onChange={(e) => setData('runtime_stack' as any, e.target.value.slice(0, 120))}
                                        placeholder="PHP 8.3, Nginx, MySQL"
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <datalist id="runtime-stack-suggestions">
                                        <option value="PHP 8.3, Nginx, MySQL 8.0" />
                                        <option value="Node.js 20, PM2, Nginx" />
                                        <option value="Python 3.12, FastAPI, Uvicorn" />
                                        <option value="Docker, Docker Compose" />
                                        <option value="Java 21, Spring Boot, PostgreSQL" />
                                        <option value="Go 1.22, Caddy" />
                                    </datalist>
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] text-slate-500">Quick:</span>
                                        {['PHP 8.3 / Nginx', 'Node.js 20 / PM2', 'Python 3.12', 'Docker'].map((stack) => (
                                            <button
                                                key={stack}
                                                type="button"
                                                onClick={() => setData('runtime_stack' as any, stack)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                    (data as any).runtime_stack === stack
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                {stack}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500">Max 120 characters. Technologies, PHP/Node versions, web server.</p>
                                    {errors.runtime_stack && <p className="text-xs text-rose-400">{errors.runtime_stack}</p>}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Deploy Path</label>
                                        <span className={`text-[10px] font-mono ${((data as any).deploy_path || '').length >= 180 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).deploy_path || '').length}/200
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={200}
                                        list="deploy-path-suggestions"
                                        value={(data as any).deploy_path}
                                        onChange={(e) => setData('deploy_path' as any, e.target.value.slice(0, 200))}
                                        placeholder="/var/www/app"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <datalist id="deploy-path-suggestions">
                                        <option value="/var/www/html" />
                                        <option value="/var/www/app" />
                                        <option value="/home/ubuntu/app" />
                                        <option value="/opt/project" />
                                    </datalist>
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] text-slate-500">Quick:</span>
                                        {['/var/www/html', '/var/www/app', '/home/ubuntu/app'].map((path) => (
                                            <button
                                                key={path}
                                                type="button"
                                                onClick={() => setData('deploy_path' as any, path)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                    (data as any).deploy_path === path
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                {path}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500">Max 200 characters. Absolute Linux server deployment directory.</p>
                                    {errors.deploy_path && <p className="text-xs text-rose-400">{errors.deploy_path}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">SSH Private Key / Password</label>
                                <textarea
                                    rows={2}
                                    value={(data as any).ssh_credential}
                                    onChange={(e) => setData('ssh_credential' as any, e.target.value)}
                                    placeholder={isEditing ? 'Leave blank to keep existing SSH credential' : 'Paste private key or password'}
                                    className="w-full px-3 py-2 font-mono text-[11px] rounded-xl bg-slate-950 border border-slate-800 text-amber-300 focus:ring-2 focus:ring-indigo-500"
                                />
                                {errors.ssh_credential && <p className="text-xs text-rose-400">{errors.ssh_credential}</p>}
                            </div>
                        </>
                    )}

                    {/* THIRD-PARTY ACCOUNTS FORM */}
                    {type === 'accounts' && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Service Provider *</label>
                                        <span className={`text-[10px] font-mono ${((data as any).service_provider || '').length >= 70 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).service_provider || '').length}/80
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={80}
                                        list="account-provider-suggestions"
                                        value={(data as any).service_provider}
                                        onChange={(e) => setData('service_provider' as any, e.target.value.slice(0, 80))}
                                        placeholder="e.g. AWS, Twilio, Firebase"
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <datalist id="account-provider-suggestions">
                                        <option value="AWS (Amazon Web Services)" />
                                        <option value="Google Cloud Platform (GCP)" />
                                        <option value="Firebase" />
                                        <option value="Cloudflare" />
                                        <option value="Twilio" />
                                        <option value="Stripe" />
                                        <option value="OpenAI" />
                                        <option value="SendGrid" />
                                        <option value="Resend" />
                                        <option value="Sentry.io" />
                                    </datalist>
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] text-slate-500">Quick:</span>
                                        {['AWS', 'Firebase', 'Cloudflare', 'Stripe', 'Twilio'].map((prov) => (
                                            <button
                                                key={prov}
                                                type="button"
                                                onClick={() => setData('service_provider' as any, prov)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                    (data as any).service_provider === prov
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                {prov}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500">Max 80 characters. Third-party vendor or cloud platform name.</p>
                                    {errors.service_provider && <p className="text-xs text-rose-400">{errors.service_provider}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Environment *</label>
                                    <select
                                        value={(data as any).environment}
                                        onChange={(e) => setData('environment' as any, e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="development">Development</option>
                                        <option value="testing">Testing / QA</option>
                                        <option value="production">Production</option>
                                    </select>
                                    {errors.environment && <p className="text-xs text-rose-400">{errors.environment}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Login Account / Email *</label>
                                    <input
                                        type="text"
                                        maxLength={255}
                                        value={(data as any).account_identifier}
                                        onChange={(e) => setData('account_identifier' as any, e.target.value)}
                                        placeholder="devops@enrich.com"
                                        required
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.account_identifier && <p className="text-xs text-rose-400">{errors.account_identifier}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Password</label>
                                    <input
                                        type="text"
                                        value={(data as any).login_password}
                                        onChange={(e) => setData('login_password' as any, e.target.value)}
                                        placeholder={isEditing ? 'Unchanged' : 'Password / secret'}
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-amber-300 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.login_password && <p className="text-xs text-rose-400">{errors.login_password}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Console URL</label>
                                    <input
                                        type="url"
                                        maxLength={500}
                                        value={(data as any).console_url}
                                        onChange={(e) => setData('console_url' as any, e.target.value)}
                                        placeholder="https://console.aws.amazon.com"
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.console_url && <p className="text-xs text-rose-400">{errors.console_url}</p>}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Project / App ID</label>
                                        <span className={`text-[10px] font-mono ${((data as any).project_or_app_id || '').length >= 90 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).project_or_app_id || '').length}/100
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={100}
                                        value={(data as any).project_or_app_id}
                                        onChange={(e) => setData('project_or_app_id' as any, e.target.value.slice(0, 100))}
                                        placeholder="e.g. enrich-taxi-prod"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-[10px] text-slate-500">Max 100 characters. Project slug, account identifier, or tenant ID.</p>
                                    {errors.project_or_app_id && <p className="text-xs text-rose-400">{errors.project_or_app_id}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Notes / 2FA</label>
                                <textarea
                                    rows={2}
                                    value={(data as any).notes}
                                    onChange={(e) => setData('notes' as any, e.target.value)}
                                    placeholder="2FA device, backup codes, access notes..."
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                                {errors.notes && <p className="text-xs text-rose-400">{errors.notes}</p>}
                            </div>
                        </>
                    )}

                    {/* BACKGROUND SERVICES FORM */}
                    {type === 'services' && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Service Type *</label>
                                    <select
                                        value={(data as any).service_type}
                                        onChange={(e) => setData('service_type' as any, e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="cron_schedule">Cron Schedule</option>
                                        <option value="queue_worker">Queue Worker</option>
                                        <option value="supervisor_daemon">Supervisor Daemon</option>
                                        <option value="websocket">WebSocket Server</option>
                                    </select>
                                    {errors.service_type && <p className="text-xs text-rose-400">{errors.service_type}</p>}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Frequency / Process Config</label>
                                        <span className={`text-[10px] font-mono ${((data as any).frequency_or_config || '').length >= 90 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).frequency_or_config || '').length}/100
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={100}
                                        list="frequency-suggestions"
                                        value={(data as any).frequency_or_config}
                                        onChange={(e) => setData('frequency_or_config' as any, e.target.value.slice(0, 100))}
                                        placeholder="e.g. * * * * * or numprocs=4"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <datalist id="frequency-suggestions">
                                        <option value="* * * * * (Every minute)" />
                                        <option value="*/5 * * * * (Every 5 minutes)" />
                                        <option value="0 * * * * (Hourly at minute 0)" />
                                        <option value="0 0 * * * (Daily at midnight)" />
                                        <option value="0 2 * * * (Daily at 2:00 AM)" />
                                        <option value="numprocs=2, autostart=true" />
                                        <option value="--tries=3 --timeout=90" />
                                        <option value="--sleep=3 --rest=0" />
                                    </datalist>
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] text-slate-500">Quick:</span>
                                        {(data as any).service_type === 'cron_schedule' ? (
                                            ['* * * * *', '*/5 * * * *', '0 * * * *', '0 0 * * *'].map((cron) => (
                                                <button
                                                    key={cron}
                                                    type="button"
                                                    onClick={() => setData('frequency_or_config' as any, cron)}
                                                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                        (data as any).frequency_or_config === cron
                                                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                            : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                                    }`}
                                                >
                                                    {cron}
                                                </button>
                                            ))
                                        ) : (
                                            ['numprocs=2, autostart=true', '--tries=3 --timeout=90', '--sleep=3'].map((opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setData('frequency_or_config' as any, opt)}
                                                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                        (data as any).frequency_or_config === opt
                                                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                            : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                                    }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500">Max 100 characters. Cron schedule syntax or daemon process flags.</p>
                                    {errors.frequency_or_config && <p className="text-xs text-rose-400">{errors.frequency_or_config}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="font-bold text-slate-300">Executable Command *</label>
                                    <span className={`text-[10px] font-mono ${((data as any).command || '').length >= 950 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                        {((data as any).command || '').length}/1000
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    maxLength={1000}
                                    list="command-suggestions"
                                    value={(data as any).command}
                                    onChange={(e) => setData('command' as any, e.target.value.slice(0, 1000))}
                                    placeholder="php artisan schedule:run"
                                    required
                                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                                <datalist id="command-suggestions">
                                    <option value="php artisan schedule:run" />
                                    <option value="php artisan queue:work --tries=3 --timeout=90" />
                                    <option value="php artisan websockets:serve" />
                                    <option value="npm run start" />
                                    <option value="node server.js" />
                                    <option value="python3 worker.py" />
                                </datalist>
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                    <span className="text-[10px] text-slate-500">Quick:</span>
                                    {['php artisan schedule:run', 'php artisan queue:work --tries=3', 'npm run start'].map((cmd) => (
                                        <button
                                            key={cmd}
                                            type="button"
                                            onClick={() => setData('command' as any, cmd)}
                                            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                (data as any).command === cmd
                                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                            }`}
                                        >
                                            {cmd}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500">Max 1000 characters. Full binary or artisan/CLI command to execute.</p>
                                {errors.command && <p className="text-xs text-rose-400">{errors.command}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Monitoring & Log Notes</label>
                                <textarea
                                    rows={2}
                                    value={(data as any).monitoring_notes}
                                    onChange={(e) => setData('monitoring_notes' as any, e.target.value)}
                                    placeholder="Logs piped to /var/log/supervisor/..."
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                                {errors.monitoring_notes && <p className="text-xs text-rose-400">{errors.monitoring_notes}</p>}
                            </div>
                        </>
                    )}

                    {/* IOT CONFIGURATION FORM */}
                    {type === 'iot' && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Hardware Model *</label>
                                        <span className={`text-[10px] font-mono ${((data as any).hardware_model || '').length >= 90 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).hardware_model || '').length}/100
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={100}
                                        list="iot-hardware-suggestions"
                                        value={(data as any).hardware_model}
                                        onChange={(e) => setData('hardware_model' as any, e.target.value.slice(0, 100))}
                                        placeholder="ESP32 WROOM-32U"
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <datalist id="iot-hardware-suggestions">
                                        <option value="ESP32-WROOM-32D" />
                                        <option value="ESP8266 NodeMCU" />
                                        <option value="Raspberry Pi 4 Model B" />
                                        <option value="STM32F401 Black Pill" />
                                        <option value="Arduino Nano 33 IoT" />
                                        <option value="Quectel EC200U 4G LTE" />
                                    </datalist>
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] text-slate-500">Quick:</span>
                                        {['ESP32-WROOM-32D', 'ESP8266', 'Raspberry Pi 4', 'Quectel EC200U'].map((model) => (
                                            <button
                                                key={model}
                                                type="button"
                                                onClick={() => setData('hardware_model' as any, model)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                    (data as any).hardware_model === model
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                {model}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500">Max 100 characters. Microcontroller, board, or hardware model.</p>
                                    {errors.hardware_model && <p className="text-xs text-rose-400">{errors.hardware_model}</p>}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Firmware Version</label>
                                        <span className={`text-[10px] font-mono ${((data as any).firmware_version || '').length >= 45 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).firmware_version || '').length}/50
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={50}
                                        list="firmware-suggestions"
                                        value={(data as any).firmware_version}
                                        onChange={(e) => setData('firmware_version' as any, e.target.value.slice(0, 50))}
                                        placeholder="v1.4.2-prod"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <datalist id="firmware-suggestions">
                                        <option value="v1.0.0-prod" />
                                        <option value="v1.2.0-rc1" />
                                        <option value="v2.0.0-beta" />
                                        <option value="build-202410-01" />
                                    </datalist>
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] text-slate-500">Quick:</span>
                                        {['v1.0.0', 'v1.2.0-prod', 'v2.0.0-beta'].map((ver) => (
                                            <button
                                                key={ver}
                                                type="button"
                                                onClick={() => setData('firmware_version' as any, ver)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                    (data as any).firmware_version === ver
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                {ver}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500">Max 50 characters. Semantic version or firmware release tag.</p>
                                    {errors.firmware_version && <p className="text-xs text-rose-400">{errors.firmware_version}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Protocol *</label>
                                    <select
                                        value={(data as any).communication_protocol}
                                        onChange={(e) => setData('communication_protocol' as any, e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="MQTT">MQTT</option>
                                        <option value="HTTP_REST">HTTP REST</option>
                                        <option value="WebSockets">WebSockets</option>
                                    </select>
                                    {errors.communication_protocol && <p className="text-xs text-rose-400">{errors.communication_protocol}</p>}
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-300">Broker / Host URL</label>
                                        <span className={`text-[10px] font-mono ${((data as any).broker_url || '').length >= 180 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                            {((data as any).broker_url || '').length}/200
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={200}
                                        value={(data as any).broker_url}
                                        onChange={(e) => setData('broker_url' as any, e.target.value.slice(0, 200))}
                                        placeholder="mqtt.project.com"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-[10px] text-slate-500">Max 200 characters. Broker domain or IP (e.g. mqtt.enrich.com).</p>
                                    {errors.broker_url && <p className="text-xs text-rose-400">{errors.broker_url}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="font-bold text-slate-300">Topic Structure</label>
                                    <span className={`text-[10px] font-mono ${((data as any).topic_structure || '').length >= 180 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                        {((data as any).topic_structure || '').length}/200
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    maxLength={200}
                                    list="topic-suggestions"
                                    value={(data as any).topic_structure}
                                    onChange={(e) => setData('topic_structure' as any, e.target.value.slice(0, 200))}
                                    placeholder="devices/{device_id}/telemetry"
                                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 focus:ring-2 focus:ring-indigo-500"
                                />
                                <datalist id="topic-suggestions">
                                    <option value="devices/{device_id}/telemetry" />
                                    <option value="devices/{device_id}/commands" />
                                    <option value="sensors/{location_id}/{sensor_id}/data" />
                                    <option value="telemetry/v1/{client_id}" />
                                </datalist>
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                    <span className="text-[10px] text-slate-500">Quick:</span>
                                    {['devices/{id}/telemetry', 'devices/{id}/commands', 'sensors/{id}/data'].map((top) => (
                                        <button
                                            key={top}
                                            type="button"
                                            onClick={() => setData('topic_structure' as any, top)}
                                            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                                (data as any).topic_structure === top
                                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                                                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                            }`}
                                        >
                                            {top}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500">Max 200 characters. MQTT topic format (e.g. devices/&#123;id&#125;/telemetry).</p>
                                {errors.topic_structure && <p className="text-xs text-rose-400">{errors.topic_structure}</p>}
                            </div>
                        </>
                    )}

                    {/* DOCUMENTS FORM */}
                    {type === 'documents' && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                                        Document / Resource Title <span className="text-rose-400">*</span>
                                    </label>
                                    <span className={`text-[10px] font-mono ${((data as any).title || '').length >= 135 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                        {((data as any).title || '').length}/150
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    maxLength={150}
                                    value={(data as any).title}
                                    onChange={(e) => setData('title' as any, e.target.value.slice(0, 150))}
                                    placeholder="e.g. System Architecture SRS, main_firmware.zip, or Drive Asset Folder"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                                />
                                <p className="text-[10px] text-slate-500">Max 150 characters.</p>
                                {errors.title && (
                                    <p className="text-xs text-rose-400 mt-1">{errors.title}</p>
                                )}
                            </div>

                            {/* Mode Toggle: File Upload vs External Link */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                                    Resource Upload Type
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => { setDocMode('file'); setLocalDocError(null); }}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                            docMode === 'file'
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                        </svg>
                                        <span>Upload File (.zip, code, pdf)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setDocMode('link'); setLocalDocError(null); }}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                            docMode === 'link'
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        <span>External Link (Google Drive)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Mode: FILE UPLOAD */}
                            {docMode === 'file' && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                                        Select File to Upload {isEditing ? '(Optional: Leave blank to keep current file)' : ''}
                                    </label>
                                    <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 transition-colors bg-slate-950/60 text-center group cursor-pointer">
                                        <input
                                            type="file"
                                            id="document_file_input"
                                            accept=".zip,.tar,.gz,.tar.gz,.rar,.7z,.pdf,.doc,.docx,.txt,.md,.json,.csv,.xlsx,.xls,.ppt,.pptx,.js,.jsx,.ts,.tsx,.py,.php,.java,.c,.cpp,.h,.ino,.sql,.sh,image/*"
                                            onChange={(e) => {
                                                const file = e.target.files ? e.target.files[0] : null;
                                                if (file) {
                                                    if (file.size > MAX_DOC_FILE_SIZE_BYTES) {
                                                        setLocalDocError(
                                                            `The selected file "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB, which exceeds the direct upload limit of ${maxDocMBFormatted}. Server payload limits reject large uploads (HTTP 413). Please switch to the "External Link" tab and link via Google Drive, OneDrive, or Dropbox.`
                                                        );
                                                        setData('file' as any, null);
                                                        e.target.value = '';
                                                        return;
                                                    }
                                                    setData('file' as any, file);
                                                    if (!(data as any).title) {
                                                        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                                                        setData('title' as any, cleanName || file.name);
                                                    }
                                                    setLocalDocError(null);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                                </svg>
                                            </div>
                                            {(data as any).file ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                                                        <span>Selected:</span> {((data as any).file as File).name}
                                                    </p>
                                                    <p className={`text-[11px] font-mono ${((data as any).file as File).size > (MAX_DOC_FILE_SIZE_BYTES * 0.75) ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                                                        {(((data as any).file as File).size / (1024 * 1024)).toFixed(2)} MB / {maxDocMBFormatted} limit
                                                    </p>
                                                    {((data as any).file as File).size > (MAX_DOC_FILE_SIZE_BYTES * 0.75) && (
                                                        <p className="text-[10px] text-amber-300">
                                                            Tip: Large file detected. For very fast access, consider using External Link (Google Drive).
                                                        </p>
                                                    )}
                                                    <span className="text-[10px] text-indigo-400 underline">
                                                        Click or drop another file to replace
                                                    </span>
                                                </div>
                                            ) : isEditing && itemToEdit?.file_path ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-slate-300">
                                                        Current File: <span className="font-mono text-indigo-300">{itemToEdit.file_path}</span>
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        Click or drag a new file here to replace it
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-200">
                                                        Click to browse or drag & drop file here
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        Supports <strong>.zip archives</strong>, <strong>code files (.py, .js, .cpp, .ino, etc.)</strong>, <strong>.docx</strong>, <strong>.pdf</strong> up to {maxDocMBFormatted} (use External Link for larger files)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Formats:</span>
                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">.zip</span>
                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">.pdf</span>
                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">.docx</span>
                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">code (.py,.js,.ino,...)</span>
                                    </div>
                                </div>
                            )}

                            {/* Mode: EXTERNAL LINK */}
                            {docMode === 'link' && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                                        External Resource / Cloud Storage Link <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            maxLength={500}
                                            value={(data as any).file_url}
                                            onChange={(e) => {
                                                setData('file_url' as any, e.target.value);
                                                setLocalDocError(null);
                                            }}
                                            placeholder="https://drive.google.com/drive/folders/... or https://..."
                                            className="w-full pl-9 pr-3.5 py-2.5 font-mono text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
                                        <span className="text-amber-400 font-bold">Note:</span>
                                        <span>
                                            Paste your <strong>Google Drive</strong> share link, OneDrive file, Figma diagram, or Notion specification URL. Ideal for large files and backups.
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* Error Alert with Quick Switch */}
                            {(localDocError || errors.file || errors.file_url) && (
                                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        <svg className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div className="space-y-0.5 min-w-0">
                                            <p className="font-semibold text-rose-200">Upload Issue</p>
                                            <p className="text-slate-300 leading-relaxed text-[11px]">
                                                {localDocError || errors.file || errors.file_url}
                                            </p>
                                        </div>
                                    </div>
                                    {docMode === 'file' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDocMode('link');
                                                setLocalDocError(null);
                                            }}
                                            className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm whitespace-nowrap"
                                        >
                                            Switch to External Link
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-center"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors disabled:opacity-50 text-center"
                        >
                            {processing ? 'Saving...' : isEditing ? 'Update Entry' : 'Add to Vault'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
