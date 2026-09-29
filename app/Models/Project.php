<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'status',
        'priority',
        'created_by_id',
        'lead_developer_id',
        'manager_id',
        'tech_stack',
        'description',
        'deletion_status',
        'deletion_admin_id',
        'deletion_reason',
        'deletion_requested_at',
        'deletion_approved_at',
        'deletion_approved_by_id',
        'deletion_rejected_at',
        'deletion_rejection_reason',
        'edit_permission_status',
        'edit_permission_admin_id',
        'edit_permission_reason',
        'edit_permission_requested_at',
        'edit_permission_approved_at',
        'edit_permission_approved_by_id',
        'edit_permission_rejected_at',
        'edit_permission_rejection_reason',
    ];

    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            if (empty($project->code)) {
                $project->code = self::generateNextCode();
            }
        });
    }

    /**
     * Generate the next automated project code according to the format:
     * EA[last 2 digits of year][current month 2 digits]-[continuous 4-digit sequence starting from 1000]
     * Examples: EA2609-1001, EA2609-1002, EA2610-1003, EA2610-1004
     */
    public static function generateNextCode(): string
    {
        $yearMonth = date('ym'); // e.g. 2609
        $prefix = 'EA' . $yearMonth . '-';

        $maxSeq = 1000;

        $codes = self::pluck('code');
        foreach ($codes as $c) {
            if ($c && preg_match('/^EA\d{4}-(\d+)$/i', $c, $matches)) {
                $seq = (int) $matches[1];
                if ($seq > $maxSeq) {
                    $maxSeq = $seq;
                }
            }
        }

        $nextSeq = $maxSeq + 1;

        do {
            $formattedSeq = str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
            $candidateCode = $prefix . $formattedSeq;
            $nextSeq++;
        } while (self::where('code', $candidateCode)->exists());

        return $candidateCode;
    }

    protected function casts(): array
    {
        return [
            'deletion_requested_at' => 'datetime',
            'deletion_approved_at' => 'datetime',
            'deletion_rejected_at' => 'datetime',
            'edit_permission_requested_at' => 'datetime',
            'edit_permission_approved_at' => 'datetime',
            'edit_permission_rejected_at' => 'datetime',
        ];
    }

    public function deletionAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deletion_admin_id');
    }

    public function deletionApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deletion_approved_by_id');
    }

    public function editPermissionAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'edit_permission_admin_id');
    }

    public function editPermissionApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'edit_permission_approved_by_id');
    }

    public function isDeletionPending(): bool
    {
        return $this->deletion_status === 'pending';
    }

    public function isDeletionApproved(): bool
    {
        return $this->deletion_status === 'approved';
    }

    public function isEditPermissionPending(): bool
    {
        return $this->edit_permission_status === 'pending';
    }

    public function isEditPermissionApproved(): bool
    {
        return $this->edit_permission_status === 'approved';
    }

    public function isCompleted(): bool
    {
        return $this->status === \App\Enums\ProjectStatus::COMPLETED->value;
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function leadDeveloper(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lead_developer_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function developers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')->withTimestamps();
    }

    public function links(): HasMany
    {
        return $this->hasMany(ProjectLink::class);
    }

    public function thirdPartyAccounts(): HasMany
    {
        return $this->hasMany(ThirdPartyAccount::class);
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(ProjectCredential::class);
    }

    public function serverEnvironments(): HasMany
    {
        return $this->hasMany(ServerEnvironment::class);
    }

    public function backgroundServices(): HasMany
    {
        return $this->hasMany(BackgroundService::class);
    }

    public function iotConfigurations(): HasMany
    {
        return $this->hasMany(IotConfiguration::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProjectDocument::class);
    }

    public function clientAccessCredentials(): HasMany
    {
        return $this->hasMany(ClientAccessCredential::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function accessRequests(): HasMany
    {
        return $this->hasMany(ProjectAccessRequest::class);
    }
}
