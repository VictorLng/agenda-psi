<?php

namespace App\Http\Controllers;

use App\Models\KeyBackup;
use Illuminate\Http\Request;

class KeyBackupController extends Controller
{
    /** Usuário único por enquanto: existe no máximo um backup. */
    public function show()
    {
        $b = KeyBackup::first();

        return $b ? ['exists' => true, 'wrapped_key' => $b->wrapped_key, 'iv' => $b->iv] : ['exists' => false];
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'wrapped_key' => ['required', 'string', 'max:512', 'regex:/^[A-Za-z0-9+\/=]+$/'],
            'iv' => ['required', 'string', 'max:64', 'regex:/^[A-Za-z0-9+\/=]+$/'],
        ]);

        KeyBackup::updateOrCreate(['id' => KeyBackup::value('id') ?? 1], $data);

        return ['exists' => true] + $data;
    }
}
