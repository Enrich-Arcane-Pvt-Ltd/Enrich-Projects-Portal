<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasAvatar;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements FilamentUser, HasAvatar
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar_url',
        'birth_date',
        'contact_no',
        'bio',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Filament Panel access control
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return in_array($this->role, ['admin', 'superadmin']);
    }

    public function getFilamentAvatarUrl(): ?string
    {
        return $this->avatar_url;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'superadmin']);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isDeveloper(): bool
    {
        return $this->role === 'developer';
    }

    public function isQa(): bool
    {
        return $this->role === 'qa';
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user')->withTimestamps();
    }

    public function ledProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'lead_developer_id');
    }

    public function managedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'manager_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function projectAccessRequests(): HasMany
    {
        return $this->hasMany(ProjectAccessRequest::class, 'user_id');
    }

    /**
     * Get array of IDs for users who were active in the last 5 minutes.
     *
     * @return array<int>
     */
    public static function getOnlineUserIds(): array
    {
        $onlineIds = [];

        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('sessions')) {
                // Active within last 5 minutes
                $threshold = now()->subMinutes(5)->timestamp;
                $sessionUserIds = \Illuminate\Support\Facades\DB::table('sessions')
                    ->whereNotNull('user_id')
                    ->where('last_activity', '>=', $threshold)
                    ->pluck('user_id')
                    ->map(fn ($id) => (int) $id)
                    ->all();

                $onlineIds = array_merge($onlineIds, $sessionUserIds);
            }
        } catch (\Throwable $e) {
            // fallback gracefully
        }

        // Current user is always considered online in their own active request
        if ($currentUserId = auth()->id()) {
            $onlineIds[] = (int) $currentUserId;
        }

        return array_values(array_unique(array_filter($onlineIds)));
    }

    /**
     * Check if this user instance is currently online.
     */
    public function isOnline(): bool
    {
        if (array_key_exists('is_online', $this->attributes)) {
            return (bool) $this->attributes['is_online'];
        }

        if (auth()->id() === $this->id) {
            return true;
        }

        return in_array($this->id, static::getOnlineUserIds(), true);
    }
}

