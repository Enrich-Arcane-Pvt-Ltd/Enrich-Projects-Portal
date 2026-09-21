<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BackgroundService extends Model
{
    protected $fillable = [
        'project_id',
        'service_type',
        'command',
        'frequency_or_config',
        'monitoring_notes',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
