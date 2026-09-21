<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IotConfiguration extends Model
{
    protected $fillable = [
        'project_id',
        'hardware_model',
        'firmware_version',
        'communication_protocol',
        'broker_url',
        'port',
        'topic_structure',
        'auth_token_or_certs',
    ];

    /**
     * Automatic encryption and decryption
     */
    protected $casts = [
        'auth_token_or_certs' => 'encrypted',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
