<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KeyBackup extends Model
{
    protected $fillable = ['wrapped_key', 'iv'];
}
