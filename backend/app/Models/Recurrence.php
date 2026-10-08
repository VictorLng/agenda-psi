<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recurrence extends Model
{
    protected $fillable = [
        'patient_id', 'type_id', 'notes', 'weekday', 'hour', 'start_date', 'end_date', 'skipped_dates',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'skipped_dates' => 'array',
    ];

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /** Cria as ocorrências que faltam de todas as séries no intervalo (idempotente). */
    public static function materialize(string $from, string $to): void
    {
        static::where('start_date', '<=', $to)
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $from))
            ->get()
            ->each->generate($from, $to);
    }

    /**
     * Gera uma linha por semana. insertOrIgnore descarta, sem erro, as datas que já
     * existem (inclusive as movidas pontualmente) e os horários ocupados por outro paciente.
     */
    public function generate(string $from, string $to): void
    {
        $start = max($from, $this->start_date->toDateString());
        $end = $this->end_date ? min($to, $this->end_date->toDateString()) : $to;

        $d = Carbon::parse($start);
        $d->addDays(($this->weekday - $d->dayOfWeekIso + 7) % 7);

        $skipped = $this->skipped_dates ?? [];
        $now = now();
        $rows = [];

        for (; $d->toDateString() <= $end; $d->addWeek()) {
            $iso = $d->toDateString();
            if (in_array($iso, $skipped, true)) {
                continue;
            }
            $rows[] = [
                'patient_id' => $this->patient_id,
                'type_id' => $this->type_id,
                'recurrence_id' => $this->id,
                'date' => $iso,
                'original_date' => $iso,
                'hour' => $this->hour,
                'notes' => $this->notes,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($rows) {
            Appointment::insertOrIgnore($rows);
        }
    }
}
