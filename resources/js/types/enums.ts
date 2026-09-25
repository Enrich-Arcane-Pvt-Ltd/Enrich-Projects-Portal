/**
 * Centralized Project Enums & Configuration
 * Provides single source of truth for Project Archetypes, Lifecycle Statuses, and Priorities.
 */

export enum ProjectType {
    WEB_APP = 'web_app',
    MOBILE_APP = 'mobile_app',
    IOT_EMBEDDED = 'iot_embedded',
    API_SERVICE = 'api_service',
    HYBRID = 'hybrid',
}

export enum ProjectStatus {
    IN_PROGRESS = 'in_progress',
    PLANNING = 'planning',
    MAINTENANCE = 'maintenance',
    COMPLETED = 'completed',
    ARCHIVED = 'archived',
}

export enum ProjectPriority {
    CRITICAL = 'critical',
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
}

export interface EnumOption<T extends string = string> {
    id: T;
    value: T;
    label: string;
}

// -------------------------------------------------------------------------
// Project Type Options & Labels
// -------------------------------------------------------------------------
export const PROJECT_TYPE_OPTIONS: readonly EnumOption<ProjectType>[] = [
    { id: ProjectType.WEB_APP, value: ProjectType.WEB_APP, label: 'Web apps' },
    { id: ProjectType.MOBILE_APP, value: ProjectType.MOBILE_APP, label: 'Mobile apps' },
    { id: ProjectType.IOT_EMBEDDED, value: ProjectType.IOT_EMBEDDED, label: 'IoT & hardware' },
    { id: ProjectType.API_SERVICE, value: ProjectType.API_SERVICE, label: 'API services' },
    { id: ProjectType.HYBRID, value: ProjectType.HYBRID, label: 'Hybrid' },
] as const;

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
    [ProjectType.WEB_APP]: 'Web apps',
    [ProjectType.MOBILE_APP]: 'Mobile apps',
    [ProjectType.IOT_EMBEDDED]: 'IoT & hardware',
    [ProjectType.API_SERVICE]: 'API services',
    [ProjectType.HYBRID]: 'Hybrid',
};

// -------------------------------------------------------------------------
// Project Status Options & Labels
// -------------------------------------------------------------------------
export const PROJECT_STATUS_OPTIONS: readonly EnumOption<ProjectStatus>[] = [
    { id: ProjectStatus.IN_PROGRESS, value: ProjectStatus.IN_PROGRESS, label: 'In progress' },
    { id: ProjectStatus.PLANNING, value: ProjectStatus.PLANNING, label: 'Planning' },
    { id: ProjectStatus.MAINTENANCE, value: ProjectStatus.MAINTENANCE, label: 'Maintenance' },
    { id: ProjectStatus.COMPLETED, value: ProjectStatus.COMPLETED, label: 'Completed' },
    { id: ProjectStatus.ARCHIVED, value: ProjectStatus.ARCHIVED, label: 'Archived' },
] as const;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    [ProjectStatus.IN_PROGRESS]: 'In progress',
    [ProjectStatus.PLANNING]: 'Planning',
    [ProjectStatus.MAINTENANCE]: 'Maintenance',
    [ProjectStatus.COMPLETED]: 'Completed',
    [ProjectStatus.ARCHIVED]: 'Archived',
};

// -------------------------------------------------------------------------
// Project Priority Options & Labels
// -------------------------------------------------------------------------
export const PROJECT_PRIORITY_OPTIONS: readonly EnumOption<ProjectPriority>[] = [
    { id: ProjectPriority.CRITICAL, value: ProjectPriority.CRITICAL, label: 'Critical' },
    { id: ProjectPriority.HIGH, value: ProjectPriority.HIGH, label: 'High' },
    { id: ProjectPriority.MEDIUM, value: ProjectPriority.MEDIUM, label: 'Medium' },
    { id: ProjectPriority.LOW, value: ProjectPriority.LOW, label: 'Low' },
] as const;

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
    [ProjectPriority.CRITICAL]: 'Critical',
    [ProjectPriority.HIGH]: 'High',
    [ProjectPriority.MEDIUM]: 'Medium',
    [ProjectPriority.LOW]: 'Low',
};
