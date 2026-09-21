<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectCredential extends Model
{
    protected $fillable = [
        'project_id',
        'category',
        'key_name',
        'key_value',
        'environment',
    ];

    /**
     * Automatic AES-256 encryption and decryption
     */
    protected $casts = [
        'key_value' => 'encrypted',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
