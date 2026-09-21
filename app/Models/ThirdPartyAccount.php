<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThirdPartyAccount extends Model
{
    protected $fillable = [
        'project_id',
        'service_provider',
        'account_identifier',
        'login_password',
        'console_url',
        'project_or_app_id',
        'environment',
        'notes',
    ];

    /**
     * Automatic encryption and decryption
     */
    protected $casts = [
        'login_password' => 'encrypted',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
