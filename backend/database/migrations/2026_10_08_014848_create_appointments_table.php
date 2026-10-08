<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedSmallInteger('hour');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['date', 'hour']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
