<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color', 9)->default('#0a84ff');
            $table->timestamps();
        });

        $now = now();
        DB::table('appointment_types')->insert([
            ['name' => 'Individual', 'color' => '#0a84ff', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Casal', 'color' => '#ff375f', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Avaliação', 'color' => '#ff9f0a', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Retorno', 'color' => '#30d158', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_types');
    }
};
