import { useForm } from '@inertiajs/react';
import React, { useEffect } from 'react';

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
                    file_url: itemToEdit?.file_path || '',
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
        const endpoint = getEndpoint();

        if (isEditing) {
            put(`/developer/projects/${projectId}/${endpoint}/${itemToEdit.id}`, {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post(`/developer/projects/${projectId}/${endpoint}`, {
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
                        <>
                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Document / File Title *</label>
                                <input
                                    type="text"
                                    value={(data as any).title}
                                    onChange={(e) => setData('title' as any, e.target.value)}
                                    placeholder="e.g. System Architecture SRS.pdf, main.py, or Source_Code.zip"
                                    required
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Upload File (Documents, Code Files, or .zip Archive)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('file' as any, e.target.files ? e.target.files[0] : null)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                                />
                                <p className="text-xs text-indigo-400/90 flex items-start gap-1.5 pt-0.5">
                                    <span className="text-sm">💡</span>
                                    <span>
                                        You can upload documentation (.pdf, .docx), source code files (.js, .py, .php, .cpp, .ino, etc.), or <strong>.zip / .tar.gz</strong> archives (up to 50MB).
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Or External Documentation URL</label>
                                <input
                                    type="text"
                                    value={(data as any).file_url}
                                    onChange={(e) => setData('file_url' as any, e.target.value)}
                                    placeholder="https://docs.google.com/... or /documents/..."
                                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </>
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
