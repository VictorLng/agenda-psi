<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AppointmentTypeController;
use App\Http\Controllers\KeyBackupController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\SessionNoteController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('/settings', [SettingController::class, 'show']);
Route::put('/settings', [SettingController::class, 'update']);

Route::apiResource('patients', PatientController::class)->except('show');
Route::apiResource('appointment-types', AppointmentTypeController::class)->except('show');
Route::apiResource('appointments', AppointmentController::class)->except('show');
Route::post('/appointments/{appointment}/move', [AppointmentController::class, 'move']);

Route::get('/session-notes', [SessionNoteController::class, 'index']);
Route::post('/session-notes', [SessionNoteController::class, 'store']);
Route::delete('/session-notes/{sessionNote}', [SessionNoteController::class, 'destroy']);

Route::get('/key-backup', [KeyBackupController::class, 'show']);
Route::put('/key-backup', [KeyBackupController::class, 'update']);
