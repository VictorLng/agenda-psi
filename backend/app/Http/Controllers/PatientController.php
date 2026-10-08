<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Support\Realtime;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    private function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'description' => 'nullable|string|max:5000',
            'phone' => 'nullable|string|max:30',
            'whatsapp_message' => 'nullable|string|max:2000',
        ];
    }

    public function index()
    {
        return Patient::orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $patient = Patient::create($request->validate($this->rules()));
        Realtime::emit('patients');

        return response()->json($patient, 201);
    }

    public function update(Request $request, Patient $patient)
    {
        $patient->update($request->validate($this->rules()));
        AppointmentController::forgetWeeks();
        Realtime::emit('patients');

        return $patient;
    }

    public function destroy(Patient $patient)
    {
        $patient->delete();
        AppointmentController::forgetWeeks();
        Realtime::emit('patients');

        return response()->noContent();
    }
}
