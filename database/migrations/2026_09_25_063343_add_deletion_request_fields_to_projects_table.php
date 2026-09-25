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
        Schema::table('projects', function (Blueprint $table) {
            $table->string('deletion_status')->nullable()->after('priority'); // pending, approved, rejected
            $table->foreignId('deletion_admin_id')->nullable()->after('deletion_status')->constrained('users')->nullOnDelete();
            $table->text('deletion_reason')->nullable()->after('deletion_admin_id');
            $table->timestamp('deletion_requested_at')->nullable()->after('deletion_reason');
            $table->timestamp('deletion_approved_at')->nullable()->after('deletion_requested_at');
            $table->foreignId('deletion_approved_by_id')->nullable()->after('deletion_approved_at')->constrained('users')->nullOnDelete();
            $table->timestamp('deletion_rejected_at')->nullable()->after('deletion_approved_by_id');
            $table->text('deletion_rejection_reason')->nullable()->after('deletion_rejected_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['deletion_admin_id']);
            $table->dropForeign(['deletion_approved_by_id']);
            $table->dropColumn([
                'deletion_status',
                'deletion_admin_id',
                'deletion_reason',
                'deletion_requested_at',
                'deletion_approved_at',
                'deletion_approved_by_id',
                'deletion_rejected_at',
                'deletion_rejection_reason',
            ]);
        });
    }
};
