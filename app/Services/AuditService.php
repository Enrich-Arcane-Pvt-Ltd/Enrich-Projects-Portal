<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    /**
     * Log a sensitive action to the audit vault
     */
    public static function log(?int $projectId, string $action, string $target): AuditLog
    {
        $userId = Auth::guard('admin')->id() ?? Auth::guard('web')->id() ?? Auth::id();

        return AuditLog::create([
            'user_id' => $userId,
            'project_id' => $projectId,
            'action_type' => $action,
            'target_field' => $target,
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);
    }
}
