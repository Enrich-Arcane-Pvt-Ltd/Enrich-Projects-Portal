import { Project } from '@/types';
import { useForm } from '@inertiajs/react';
import React, { useEffect } from 'react';

interface ProjectFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectToEdit?: Project | null;
}

export default function ProjectFormModal({ isOpen, onClose, projectToEdit }: ProjectFormModalProps) {
    if (!isOpen) return null;

    const isEditing = Boolean(projectToEdit);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: projectToEdit?.name || '',
        code: projectToEdit?.code || '',
        type: projectToEdit?.type || 'web_app',
        priority: projectToEdit?.priority || 'medium',
        status: projectToEdit?.status || 'in_progress',
        tech_stack: projectToEdit?.tech_stack || '',
        description: projectToEdit?.description || '',
    });

    useEffect(() => {
        if (projectToEdit) {
            setData({
                name: projectToEdit.name,
                code: projectToEdit.code,
                type: projectToEdit.type,
                priority: projectToEdit.priority,
                status: projectToEdit.status,
                tech_stack: projectToEdit.tech_stack || '',
                description: projectToEdit.description || '',
            });
        } else {
            reset();
        }
        clearErrors();
    }, [projectToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && projectToEdit) {
            put(`/developer/projects/${projectToEdit.id}`, {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post('/developer/projects', {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-900/80">
                    <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-400">
                                {isEditing ? 'Project Management' : 'New Project Node'}
                            </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                            {isEditing ? `Edit: ${projectToEdit?.name}` : 'Create New Project'}
                        </h2>
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Project Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">
                            Project Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => {
                                const newName = e.target.value;
                                setData((prev) => ({
                                    ...prev,
                                    name: newName,
                                    // Auto-generate code if creating and code is empty or matches previous slug
                                    code: !isEditing && (!prev.code || prev.code === prev.name.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 15))
                                        ? newName.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 15)
                                        : prev.code,
                                }));
                            }}
                            placeholder="e.g. Real-Time Telemetry & Fleet Tracker"
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600"
                        />
                        {errors.name && <p className="text-xs text-rose-400">{errors.name}</p>}
                    </div>

                    {/* Project Code & Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300">
                                Project Code / Identifier <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                placeholder="e.g. FLEET-2026"
                                required
                                className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 uppercase"
                            />
                            {errors.code && <p className="text-xs text-rose-400">{errors.code}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300">
                                Project Architecture Type <span className="text-rose-400">*</span>
                            </label>
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value as any)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="web_app">Web Application</option>
                                <option value="mobile_app">Mobile App</option>
                                <option value="iot_embedded">IoT & Embedded Hardware</option>
                                <option value="api_service">Backend API Service</option>
                                <option value="hybrid">Hybrid Ecosystem</option>
                            </select>
                            {errors.type && <p className="text-xs text-rose-400">{errors.type}</p>}
                        </div>
                    </div>

                    {/* Priority & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300">Priority Level</label>
                            <select
                                value={data.priority}
                                onChange={(e) => setData('priority', e.target.value as any)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                                <option value="critical">Critical Priority 🔥</option>
                            </select>
                            {errors.priority && <p className="text-xs text-rose-400">{errors.priority}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300">Lifecycle Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as any)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="planning">Planning Phase</option>
                                <option value="in_progress">Active In-Progress ⚡</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="completed">Completed</option>
                                <option value="archived">Archived</option>
                            </select>
                            {errors.status && <p className="text-xs text-rose-400">{errors.status}</p>}
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">
                            Tech Stack Chips <span className="text-slate-500 text-[11px]">(comma separated)</span>
                        </label>
                        <input
                            type="text"
                            value={data.tech_stack}
                            onChange={(e) => setData('tech_stack', e.target.value)}
                            placeholder="e.g. Laravel 12, React 19, TailwindCSS, ESP32, MQTT, Redis"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 font-mono text-xs"
                        />
                        {errors.tech_stack && <p className="text-xs text-rose-400">{errors.tech_stack}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Project Description & Scope</label>
                        <textarea
                            rows={3}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Brief description of the project, features, business requirements, or client scope..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 leading-relaxed"
                        />
                        {errors.description && <p className="text-xs text-rose-400">{errors.description}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-center"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors disabled:opacity-50 text-center"
                        >
                            {processing ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
