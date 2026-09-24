import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProjectVaultModal from '@/Components/ProjectVaultModal';
import { PageProps, Project, User } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface ProjectShowProps extends PageProps {
    project: Project;
    availableDevelopers?: User[];
}

export default function ProjectShow({ auth, project, availableDevelopers = [] }: ProjectShowProps) {
    return (
        <AuthenticatedLayout>
            <Head title={`${project.name} - Project Vault`} />

            <div className="py-5 sm:py-8 px-3.5 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto space-y-4 sm:space-y-6 min-w-0">
                {/* Breadcrumbs Navigation */}
                <nav className="flex items-center gap-2 text-xs text-slate-400 overflow-hidden">
                    <Link
                        href={route('dashboard')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-200 transition-colors shrink-0"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Dashboard
                    </Link>
                    <span>/</span>
                    <span className="text-slate-300 font-medium truncate">{project.name}</span>
                </nav>

                {/* Main Vault Dedicated Page View */}
                <ProjectVaultModal
                    project={project}
                    isOpen={true}
                    isPage={true}
                    availableDevelopers={availableDevelopers}
                />
            </div>
        </AuthenticatedLayout>
    );
}
