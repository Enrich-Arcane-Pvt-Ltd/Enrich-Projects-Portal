import type { ProjectType, ProjectStatus, ProjectPriority } from './enums';
export type { ProjectType, ProjectStatus, ProjectPriority };

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'developer' | 'superadmin' | 'qa';
    avatar_url?: string;
    email_verified_at?: string;
}

export interface ProjectLink {
    id: number;
    project_id: number;
    category: 'github' | 'gitlab' | 'bitbucket' | 'figma' | 'postman' | 'jira';
    title: string;
    url: string;
    branch_strategy?: string;
}

export interface ThirdPartyAccount {
    id: number;
    project_id: number;
    service_provider: string;
    account_identifier: string;
    console_url?: string;
    project_or_app_id?: string;
    environment: 'development' | 'testing' | 'production';
    notes?: string;
    login_password?: string;
}

export interface ProjectCredential {
    id: number;
    project_id: number;
    category: 'api_key' | 'webhook_secret' | 'oauth_token' | 'ssh_key' | 'db_password';
    key_name: string;
    key_value?: string;
    environment: 'local' | 'staging' | 'production';
    created_at?: string;
    updated_at?: string;
}

export interface ServerEnvironment {
    id: number;
    project_id: number;
    environment_type: 'development' | 'staging' | 'production';
    hosting_provider: string;
    ip_address?: string;
    hostname?: string;
    ssh_port: number;
    ssh_user: string;
    runtime_stack?: string;
    deploy_path?: string;
    ssh_credential?: string;
    env_backup?: string;
}

export interface BackgroundService {
    id: number;
    project_id: number;
    service_type: 'cron_schedule' | 'queue_worker' | 'supervisor_daemon' | 'websocket';
    command: string;
    frequency_or_config?: string;
    monitoring_notes?: string;
}

export interface IotConfiguration {
    id: number;
    project_id: number;
    hardware_model: string;
    firmware_version?: string;
    communication_protocol: 'MQTT' | 'HTTP_REST' | 'WebSockets';
    broker_url?: string;
    port?: string;
    topic_structure?: string;
    auth_token_or_certs?: string;
}

export interface ProjectDocument {
    id: number;
    project_id: number;
    title: string;
    file_path: string;
    file_type?: string;
    file_size?: number;
    created_at?: string;
}

export interface AuditLog {
    id: number;
    user_id?: number;
    project_id?: number;
    action_type: string;
    target_field: string;
    ip_address?: string;
    created_at: string;
}

export interface ClientAccessCredential {
    id: number;
    project_id: number;
    username: string;
    email?: string;
    password?: string;
    role?: string;
    login_url?: string;
    environment?: 'local' | 'staging' | 'production';
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Project {
    id: number;
    name: string;
    code: string;
    type: ProjectType | 'web_app' | 'mobile_app' | 'iot_embedded' | 'api_service' | 'hybrid';
    status: ProjectStatus | 'planning' | 'in_progress' | 'maintenance' | 'completed' | 'archived';
    priority: ProjectPriority | 'low' | 'medium' | 'high' | 'critical';
    lead_developer_id?: number;
    manager_id?: number;
    created_by_id?: number;
    tech_stack?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    creator?: User;
    lead_developer?: User;
    manager?: User;
    developers?: User[];
    links?: ProjectLink[];
    third_party_accounts?: ThirdPartyAccount[];
    credentials?: ProjectCredential[];
    client_access_credentials?: ClientAccessCredential[];
    clientAccessCredentials?: ClientAccessCredential[];
    server_environments?: ServerEnvironment[];
    background_services?: BackgroundService[];
    iot_configurations?: IotConfiguration[];
    documents?: ProjectDocument[];
    is_assigned?: boolean;
    is_owner?: boolean;
    access_count?: number;
}

export interface DashboardStats {
    total_projects: number;
    my_created_projects: number;
    other_developers_projects: number;
    my_assigned_projects: number;
    active_projects: number;
    critical_projects: number;
    total_credentials: number;
    total_servers: number;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
