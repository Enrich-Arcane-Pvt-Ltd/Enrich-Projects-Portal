<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    // audit_logs has created_at, but typically not updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'project_id',
        'action_type',
        'target_field',
        'ip_address',
        'created_at',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
