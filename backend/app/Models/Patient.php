<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    protected $fillable = ['name', 'color', 'description', 'phone', 'whatsapp_message'];

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
