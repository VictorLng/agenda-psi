<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    protected $fillable = ['patient_id', 'type_id', 'recurrence_id', 'date', 'original_date', 'hour', 'notes'];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'original_date' => 'date:Y-m-d',
        'hour' => 'integer',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(AppointmentType::class, 'type_id');
    }

    public function recurrence(): BelongsTo
    {
        return $this->belongsTo(Recurrence::class);
    }
}
