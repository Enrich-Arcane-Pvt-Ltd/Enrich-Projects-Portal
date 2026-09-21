<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServerEnvironment extends Model
{
    protected $fillable = [
        'project_id',
        'environment_type',
        'hosting_provider',
        'ip_address',
        'hostname',
        'ssh_port',
        'ssh_user',
        'ssh_credential',
        'runtime_stack',
        'deploy_path',
        'env_backup',
    ];

    /**
     * Automatic encryption and decryption
     */
    protected $casts = [
        'ssh_credential' => 'encrypted',
        'env_backup' => 'encrypted',
        'ssh_port' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
