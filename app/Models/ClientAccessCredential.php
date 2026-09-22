<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientAccessCredential extends Model
{
    protected $fillable = [
        'project_id',
        'username',
        'email',
        'password',
        'role',
        'login_url',
        'environment',
        'notes',
    ];

    /**
     * Automatic AES-256 encryption and decryption for sensitive passwords
     */
    protected $casts = [
        'password' => 'encrypted',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
