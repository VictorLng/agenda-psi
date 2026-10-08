<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // O servidor só guarda texto cifrado no navegador (AES-GCM); nunca vê o resumo nem a chave.
        Schema::create('session_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->date('session_date');
            $table->unsignedSmallInteger('hour');
            $table->timestampTz('started_at');
            $table->timestampTz('ended_at');
            $table->text('ciphertext');
            $table->string('iv', 64);
            $table->timestamps();
        });

        // Chave de dados cifrada pela chave de recuperação (que o servidor não possui).
        Schema::create('key_backups', function (Blueprint $table) {
            $table->id();
            $table->text('wrapped_key');
            $table->string('iv', 64);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('key_backups');
        Schema::dropIfExists('session_notes');
    }
};
