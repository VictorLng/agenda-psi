<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurrences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('type_id')->nullable()->constrained('appointment_types')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('weekday'); // 1 = segunda ... 6 = sábado
            $table->unsignedSmallInteger('hour');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->json('skipped_dates')->nullable(); // ocorrências removidas só naquela semana
            $table->timestamps();
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('type_id')->nullable()->constrained('appointment_types')->nullOnDelete();
            $table->foreignId('recurrence_id')->nullable()->constrained('recurrences')->cascadeOnDelete();
            $table->date('original_date')->nullable(); // data "de fábrica" da ocorrência na série
            $table->unique(['recurrence_id', 'original_date']);
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropUnique(['recurrence_id', 'original_date']);
            $table->dropConstrainedForeignId('recurrence_id');
            $table->dropConstrainedForeignId('type_id');
            $table->dropColumn('original_date');
        });
        Schema::dropIfExists('recurrences');
    }
};
