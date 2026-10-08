<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Support\Realtime;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private const DEFAULTS = [
        'owner_name' => '',
        'bg_from' => '#6d83f2',
        'bg_via' => '#b36bd9',
        'bg_to' => '#f78fb3',
    ];

    public function show()
    {
        return array_merge(self::DEFAULTS, Setting::pluck('value', 'key')->all());
    }

    public function update(Request $request)
    {
        $color = ['sometimes', 'regex:/^#[0-9a-fA-F]{6}$/'];
        $data = $request->validate([
            'owner_name' => 'sometimes|string|max:100',
            'bg_from' => $color,
            'bg_via' => $color,
            'bg_to' => $color,
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        Realtime::emit('settings');

        return $this->show();
    }
}
