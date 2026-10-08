<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionNote extends Model
{
    protected $fillable = ['patient_id', 'session_date', 'hour', 'started_at', 'ended_at', 'ciphertext', 'iv'];

    protected $casts = ['session_date' => 'date:Y-m-d', 'hour' => 'integer'];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
