<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuditService
{
    /**
     * Log a sensitive action to the audit vault
     */
    public static function log(?int $projectId, string $action, string $target): AuditLog
    {
        $userId = Auth::guard('admin')->id() ?? Auth::guard('web')->id() ?? Auth::id();

        try {
            return AuditLog::create([
                'user_id' => $userId,
                'project_id' => $projectId,
                'action_type' => $action,
                'target_field' => Str::limit($target, 65000, '...'),
                'ip_address' => request()->ip(),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Defensive fallback for environments where target_field column is still varchar(255)
            try {
                return AuditLog::create([
                    'user_id' => $userId,
                    'project_id' => $projectId,
                    'action_type' => $action,
                    'target_field' => Str::limit($target, 250, '...'),
                    'ip_address' => request()->ip(),
                    'created_at' => now(),
                ]);
            } catch (\Throwable $fallbackException) {
                Log::error('AuditService::log failed: ' . $fallbackException->getMessage());

                return new AuditLog([
                    'user_id' => $userId,
                    'project_id' => $projectId,
                    'action_type' => $action,
                    'target_field' => Str::limit($target, 250, '...'),
                ]);
            }
        }
    }
}
