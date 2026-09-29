import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;
    const canEditEmail = ['admin', 'superadmin'].includes(user.role);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name || '',
            email: user.email || '',
            avatar: null as File | null,
            birth_date: user.birth_date ? user.birth_date.split('T')[0] : '',
            contact_no: user.contact_no || '',
            bio: user.bio || '',
            remove_avatar: false,
            _method: 'patch',
        });

    const userInitials = (user.name || 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData((prev) => ({
                ...prev,
                avatar: file,
                remove_avatar: false,
            }));
            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatarPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        setData((prev) => ({
            ...prev,
            avatar: null,
            remove_avatar: true,
        }));
        setAvatarPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-white">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                    Update your account's profile details, engineering avatar, and personal information.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* 1. Profile Image - User Avatar (before Name) */}
                <div>
                    <InputLabel value="Profile Image" />

                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="relative group shrink-0">
                            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-slate-950/80 border-2 border-slate-700/80 overflow-hidden shadow-inner flex items-center justify-center text-slate-300 font-bold text-xl sm:text-2xl">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt={user.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="tracking-wider text-slate-300">{userInitials}</span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Change</span>
                            </button>
                        </div>

                        <div className="space-y-2 flex-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                                >
                                    Upload new picture
                                </button>

                                {avatarPreview && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveAvatar}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <p className="text-[11px] text-slate-500">
                                Recommended square image (PNG, JPG or WEBP, up to 4MB).
                            </p>

                            <InputError message={errors.avatar} />
                        </div>
                    </div>
                </div>

                {/* 2. Name */}
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                {/* 3. Email (Non-editable for developer & qa) */}
                <div>
                    <div className="flex items-center justify-between">
                        <InputLabel htmlFor="email" value="Email" />
                        {!canEditEmail && (
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Locked (Admin Only)
                            </span>
                        )}
                    </div>

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        disabled={!canEditEmail}
                        readOnly={!canEditEmail}
                        required={canEditEmail}
                        autoComplete="username"
                    />

                    {!canEditEmail ? (
                        <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Email cannot be edited directly. Only administrators can update developer and QA email addresses.</span>
                        </p>
                    ) : (
                        <InputError className="mt-2" message={errors.email} />
                    )}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                {/* 4. Birth Date (after Email section) */}
                <div>
                    <InputLabel htmlFor="birth_date" value="Birth Date" />

                    <TextInput
                        id="birth_date"
                        type="date"
                        className="mt-1 block w-full"
                        value={data.birth_date}
                        onChange={(e) => setData('birth_date', e.target.value)}
                    />

                    <InputError className="mt-2" message={errors.birth_date} />
                </div>

                {/* 5. Contact No */}
                <div>
                    <InputLabel htmlFor="contact_no" value="Contact No" />

                    <TextInput
                        id="contact_no"
                        type="tel"
                        className="mt-1 block w-full"
                        value={data.contact_no}
                        onChange={(e) => setData('contact_no', e.target.value)}
                        placeholder="+94 7X XXX XXXX"
                        autoComplete="tel"
                    />

                    <InputError className="mt-2" message={errors.contact_no} />
                </div>

                {/* 6. Bio */}
                <div>
                    <InputLabel htmlFor="bio" value="Bio" />

                    <textarea
                        id="bio"
                        rows={4}
                        className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        value={data.bio}
                        onChange={(e) => setData('bio', e.target.value)}
                        placeholder="Tell us a bit about yourself, your engineering focus, or interests..."
                    />

                    <InputError className="mt-2" message={errors.bio} />
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-emerald-400 font-medium flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
