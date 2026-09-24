import { useForm } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

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
                                    <label className="font-bold text-slate-300">Account Role</label>
                                    <input
                                        type="text"
                                        value={(data as any).role}
                                        onChange={(e) => setData('role' as any, e.target.value)}
                                        placeholder="e.g. Primary Admin, Manager"
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
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
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Repository Title *</label>
                                    <input
                                        type="text"
                                        value={(data as any).title}
                                        onChange={(e) => setData('title' as any, e.target.value)}
                                        placeholder="e.g. Backend API Microservice"
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">URL *</label>
                                <input
                                    type="url"
                                    value={(data as any).url}
                                    onChange={(e) => setData('url' as any, e.target.value)}
                                    placeholder="https://github.com/org/repo"
                                    required
                                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Branch Strategy / Notes</label>
                                <input
                                    type="text"
                                    value={(data as any).branch_strategy}
                                    onChange={(e) => setData('branch_strategy' as any, e.target.value)}
                                    placeholder="e.g. main -> Prod, develop -> Staging"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </>
                    )}

                    {/* SERVERS FORM */}
                    {type === 'servers' && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Hosting Provider *</label>
                                    <input
                                        type="text"
                                        value={(data as any).hosting_provider}
                                        onChange={(e) => setData('hosting_provider' as any, e.target.value)}
                                        placeholder="e.g. AWS EC2, DigitalOcean, Hetzner"
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
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
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">IP Address</label>
                                    <input
                                        type="text"
                                        value={(data as any).ip_address}
                                        onChange={(e) => setData('ip_address' as any, e.target.value)}
                                        placeholder="123.45.67.89"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">SSH User *</label>
                                    <input
                                        type="text"
                                        value={(data as any).ssh_user}
                                        onChange={(e) => setData('ssh_user' as any, e.target.value)}
                                        placeholder="ubuntu"
                                        required
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">SSH Port *</label>
                                    <input
                                        type="number"
                                        value={(data as any).ssh_port}
                                        onChange={(e) => setData('ssh_port' as any, Number(e.target.value))}
                                        required
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Runtime Stack</label>
                                    <input
                                        type="text"
                                        value={(data as any).runtime_stack}
                                        onChange={(e) => setData('runtime_stack' as any, e.target.value)}
                                        placeholder="PHP 8.3, Nginx, Docker"
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Deploy Path</label>
                                    <input
                                        type="text"
                                        value={(data as any).deploy_path}
                                        onChange={(e) => setData('deploy_path' as any, e.target.value)}
                                        placeholder="/var/www/app"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
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
                            </div>
                        </>
                    )}

                    {/* THIRD-PARTY ACCOUNTS FORM */}
                    {type === 'accounts' && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Service Provider *</label>
                                    <input
                                        type="text"
                                        value={(data as any).service_provider}
                                        onChange={(e) => setData('service_provider' as any, e.target.value)}
                                        placeholder="e.g. AWS, Twilio, Firebase"
                                        required
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
                                        <option value="development">Development</option>
                                        <option value="testing">Testing / QA</option>
                                        <option value="production">Production</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Login Account / Email *</label>
                                    <input
                                        type="text"
                                        value={(data as any).account_identifier}
                                        onChange={(e) => setData('account_identifier' as any, e.target.value)}
                                        placeholder="devops@enrich.com"
                                        required
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
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
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Console URL</label>
                                    <input
                                        type="url"
                                        value={(data as any).console_url}
                                        onChange={(e) => setData('console_url' as any, e.target.value)}
                                        placeholder="https://console.aws.amazon.com"
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Project / App ID</label>
                                    <input
                                        type="text"
                                        value={(data as any).project_or_app_id}
                                        onChange={(e) => setData('project_or_app_id' as any, e.target.value)}
                                        placeholder="e.g. enrich-taxi-prod"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
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
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Frequency / Process Config</label>
                                    <input
                                        type="text"
                                        value={(data as any).frequency_or_config}
                                        onChange={(e) => setData('frequency_or_config' as any, e.target.value)}
                                        placeholder="e.g. * * * * * or numprocs=4"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Executable Command *</label>
                                <input
                                    type="text"
                                    value={(data as any).command}
                                    onChange={(e) => setData('command' as any, e.target.value)}
                                    placeholder="php artisan schedule:run"
                                    required
                                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                />
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
                            </div>
                        </>
                    )}

                    {/* IOT CONFIGURATION FORM */}
                    {type === 'iot' && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Hardware Model *</label>
                                    <input
                                        type="text"
                                        value={(data as any).hardware_model}
                                        onChange={(e) => setData('hardware_model' as any, e.target.value)}
                                        placeholder="ESP32 WROOM-32U"
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Firmware Version</label>
                                    <input
                                        type="text"
                                        value={(data as any).firmware_version}
                                        onChange={(e) => setData('firmware_version' as any, e.target.value)}
                                        placeholder="v1.4.2-prod"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
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
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="font-bold text-slate-300">Broker / Host URL</label>
                                    <input
                                        type="text"
                                        value={(data as any).broker_url}
                                        onChange={(e) => setData('broker_url' as any, e.target.value)}
                                        placeholder="mqtt.project.com"
                                        className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Topic Structure</label>
                                <input
                                    type="text"
                                    value={(data as any).topic_structure}
                                    onChange={(e) => setData('topic_structure' as any, e.target.value)}
                                    placeholder="devices/{device_id}/telemetry"
                                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </>
                    )}

                    {/* DOCUMENTS FORM */}
                    {type === 'documents' && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                                    Document / Resource Title <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={(data as any).title}
                                    onChange={(e) => setData('title' as any, e.target.value)}
                                    placeholder="e.g. System Architecture SRS, main_firmware.zip, or Drive Asset Folder"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                                />
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
                                        <span>📁</span>
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
                                        <span>🔗</span>
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
                                                setData('file' as any, file);
                                                if (file && !(data as any).title) {
                                                    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                                                    setData('title' as any, cleanName || file.name);
                                                }
                                                setLocalDocError(null);
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                📁
                                            </div>
                                            {(data as any).file ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                                                        <span>✓ Selected:</span> {((data as any).file as File).name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 font-mono">
                                                        {(((data as any).file as File).size / (1024 * 1024)).toFixed(2)} MB
                                                    </p>
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
                                                        Supports <strong>.zip archives</strong>, <strong>code files (.py, .js, .cpp, .ino, etc.)</strong>, <strong>.docx</strong>, <strong>.pdf</strong> up to 50MB
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
                                            🔗
                                        </div>
                                        <input
                                            type="text"
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
                                        <span className="text-amber-400 font-bold">💡</span>
                                        <span>
                                            Paste your <strong>Google Drive</strong> share link, OneDrive file, Figma diagram, or Notion specification URL.
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* Error Alert */}
                            {(localDocError || errors.file || errors.file_url) && (
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                                    <span>⚠️</span>
                                    <span>{localDocError || errors.file || errors.file_url}</span>
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
