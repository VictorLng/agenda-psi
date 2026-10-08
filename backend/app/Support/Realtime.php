<?php

namespace App\Support;

use App\Events\DataChanged;

class Realtime
{
    /** Avisa os clientes conectados. Nunca derruba a requisição se o Reverb estiver fora. */
    public static function emit(string ...$scopes): void
    {
        rescue(fn () => DataChanged::dispatch($scopes), report: true);
    }
}
