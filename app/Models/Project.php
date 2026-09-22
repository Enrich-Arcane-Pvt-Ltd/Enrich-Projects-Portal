<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'status',
        'priority',
        'created_by_id',
        'lead_developer_id',
        'manager_id',
        'tech_stack',
        'description',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function leadDeveloper(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lead_developer_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function developers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')->withTimestamps();
    }

    public function links(): HasMany
    {
        return $this->hasMany(ProjectLink::class);
    }

    public function thirdPartyAccounts(): HasMany
    {
        return $this->hasMany(ThirdPartyAccount::class);
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(ProjectCredential::class);
    }

    public function serverEnvironments(): HasMany
    {
        return $this->hasMany(ServerEnvironment::class);
    }

    public function backgroundServices(): HasMany
    {
        return $this->hasMany(BackgroundService::class);
    }

    public function iotConfigurations(): HasMany
    {
        return $this->hasMany(IotConfiguration::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProjectDocument::class);
    }

    public function clientAccessCredentials(): HasMany
    {
        return $this->hasMany(ClientAccessCredential::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
