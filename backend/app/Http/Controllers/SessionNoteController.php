<?php

namespace App\Http\Controllers;

use App\Models\SessionNote;
use App\Support\Realtime;
use Illuminate\Http\Request;

class SessionNoteController extends Controller
{
    public function index()
    {
        return SessionNote::with('patient:id,name,color')
            ->orderByDesc('started_at')
            ->limit(500)
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'session_date' => 'required|date_format:Y-m-d',
            'hour' => 'required|integer|between:0,23',
            'started_at' => 'required|date',
            'ended_at' => 'required|date|after_or_equal:started_at',
            'ciphertext' => ['required', 'string', 'max:200000', 'regex:/^[A-Za-z0-9+\/=]+$/'],
            'iv' => ['required', 'string', 'max:64', 'regex:/^[A-Za-z0-9+\/=]+$/'],
        ]);

        $note = SessionNote::create($data);
        Realtime::emit('notes');

        return response()->json($note->load('patient:id,name,color'), 201);
    }

    public function destroy(SessionNote $sessionNote)
    {
        $sessionNote->delete();
        Realtime::emit('notes');

        return response()->noContent();
    }
}
