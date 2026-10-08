<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Sinal leve de "algo mudou". O canal é público (sem login), então o payload
 * leva só os escopos afetados; o cliente rebusca os dados pela API.
 */
class DataChanged implements ShouldBroadcastNow
{
    use Dispatchable;

    /** @param  string[]  $scopes  appointments | patients | types | settings */
    public function __construct(public array $scopes) {}

    public function broadcastOn(): array
    {
        return [new Channel('agenda')];
    }

    public function broadcastAs(): string
    {
        return 'changed';
    }
}
