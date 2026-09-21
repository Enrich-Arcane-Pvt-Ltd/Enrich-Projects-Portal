<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectLink extends Model
{
    protected $fillable = [
        'project_id',
        'category',
        'title',
        'url',
        'branch_strategy',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
