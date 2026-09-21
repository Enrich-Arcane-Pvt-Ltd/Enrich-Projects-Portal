<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 3.2 Repositories & External Links: project_links
        Schema::create('project_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->enum('category', ['github', 'gitlab', 'bitbucket', 'figma', 'postman', 'jira']);
            $table->string('title');
            $table->string('url');
            $table->string('branch_strategy')->nullable();
            $table->timestamps();
        });

        // 3.3 Third-Party Accounts: third_party_accounts
        Schema::create('third_party_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('service_provider');
            $table->string('account_identifier');
            $table->text('login_password')->nullable(); // Encrypted via AES-256
            $table->string('console_url')->nullable();
            $table->string('project_or_app_id')->nullable();
            $table->enum('environment', ['development', 'testing', 'production'])->default('production');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3.4 Credentials Vault: project_credentials
        Schema::create('project_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->enum('category', ['api_key', 'webhook_secret', 'oauth_token', 'ssh_key', 'db_password'])->default('api_key');
            $table->string('key_name');
            $table->text('key_value'); // Encrypted via Crypt / AES-256
            $table->enum('environment', ['local', 'staging', 'production'])->default('production');
            $table->timestamps();
        });

        // 3.5 Server Infrastructure: server_environments
        Schema::create('server_environments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->enum('environment_type', ['development', 'staging', 'production'])->default('production');
            $table->string('hosting_provider');
            $table->string('ip_address')->nullable();
            $table->string('hostname')->nullable();
            $table->unsignedInteger('ssh_port')->default(22);
            $table->string('ssh_user')->default('ubuntu');
            $table->text('ssh_credential')->nullable(); // Encrypted private key/password
            $table->string('runtime_stack')->nullable();
            $table->string('deploy_path')->nullable();
            $table->longText('env_backup')->nullable(); // Encrypted .env string
            $table->timestamps();
        });

        // 3.6 Background Services & Daemons: background_services
        Schema::create('background_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->enum('service_type', ['cron_schedule', 'queue_worker', 'supervisor_daemon', 'websocket'])->default('cron_schedule');
            $table->string('command');
            $table->string('frequency_or_config')->nullable();
            $table->text('monitoring_notes')->nullable();
            $table->timestamps();
        });

        // 3.7 IoT & Hardware Integration: iot_configurations
        Schema::create('iot_configurations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('hardware_model');
            $table->string('firmware_version')->nullable();
            $table->enum('communication_protocol', ['MQTT', 'HTTP_REST', 'WebSockets'])->default('MQTT');
            $table->string('broker_url')->nullable();
            $table->string('port')->nullable();
            $table->text('topic_structure')->nullable();
            $table->text('auth_token_or_certs')->nullable(); // Encrypted device token / SSL certs
            $table->timestamps();
        });

        // Project Documents (SRS Phase 5)
        Schema::create('project_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('title');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();
        });

        // 3.8 Audit Logs: audit_logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->string('action_type'); // VIEWED_SECRET, COPIED_KEY, EXPORTED_ENV, DOWNLOADED_DOC
            $table->string('target_field');
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('project_documents');
        Schema::dropIfExists('iot_configurations');
        Schema::dropIfExists('background_services');
        Schema::dropIfExists('server_environments');
        Schema::dropIfExists('project_credentials');
        Schema::dropIfExists('third_party_accounts');
        Schema::dropIfExists('project_links');
    }
};
