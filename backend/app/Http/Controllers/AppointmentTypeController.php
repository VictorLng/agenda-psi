<?php

namespace App\Http\Controllers;

use App\Models\AppointmentType;
use App\Support\Realtime;
use Illuminate\Http\Request;

class AppointmentTypeController extends Controller
{
    private function rules(): array
    {
        return [
            'name' => 'required|string|max:60',
            'color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ];
    }

    public function index()
    {
        return AppointmentType::orderBy('id')->get();
    }

    public function store(Request $request)
    {
        $type = AppointmentType::create($request->validate($this->rules()));
        Realtime::emit('types');

        return response()->json($type, 201);
    }

    public function update(Request $request, AppointmentType $appointmentType)
    {
        $appointmentType->update($request->validate($this->rules()));
        AppointmentController::forgetWeeks();
        Realtime::emit('types');

        return $appointmentType;
    }

    public function destroy(AppointmentType $appointmentType)
    {
        $appointmentType->delete();
        AppointmentController::forgetWeeks();
        Realtime::emit('types');

        return response()->noContent();
    }
}
