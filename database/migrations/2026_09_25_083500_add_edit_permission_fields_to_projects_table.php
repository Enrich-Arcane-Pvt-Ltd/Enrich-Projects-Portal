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
            $table->string('edit_permission_status')->nullable()->after('deletion_rejection_reason'); // pending, approved, rejected
            $table->foreignId('edit_permission_admin_id')->nullable()->after('edit_permission_status')->constrained('users')->nullOnDelete();
            $table->text('edit_permission_reason')->nullable()->after('edit_permission_admin_id');
            $table->timestamp('edit_permission_requested_at')->nullable()->after('edit_permission_reason');
            $table->timestamp('edit_permission_approved_at')->nullable()->after('edit_permission_requested_at');
            $table->foreignId('edit_permission_approved_by_id')->nullable()->after('edit_permission_approved_at')->constrained('users')->nullOnDelete();
            $table->timestamp('edit_permission_rejected_at')->nullable()->after('edit_permission_approved_by_id');
            $table->text('edit_permission_rejection_reason')->nullable()->after('edit_permission_rejected_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['edit_permission_admin_id']);
            $table->dropForeign(['edit_permission_approved_by_id']);
            $table->dropColumn([
                'edit_permission_status',
                'edit_permission_admin_id',
                'edit_permission_reason',
                'edit_permission_requested_at',
                'edit_permission_approved_at',
                'edit_permission_approved_by_id',
                'edit_permission_rejected_at',
                'edit_permission_rejection_reason',
            ]);
        });
    }
};
