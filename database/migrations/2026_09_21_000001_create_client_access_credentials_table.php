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
        Schema::create('client_access_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('username');
            $table->string('email')->nullable();
            $table->text('password'); // Encrypted via AES-256
            $table->string('role')->nullable(); // e.g. Primary Admin, Staff, Client User
            $table->string('login_url')->nullable();
            $table->enum('environment', ['local', 'staging', 'production'])->default('production');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_access_credentials');
    }
};
