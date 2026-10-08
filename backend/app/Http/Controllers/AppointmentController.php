<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Recurrence;
use App\Support\Realtime;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    private const VERSION_KEY = 'appts:version';

    /** Invalida todas as semanas em cache incrementando a versão da chave. */
    public static function forgetWeeks(): void
    {
        Cache::increment(self::VERSION_KEY) ?: Cache::forever(self::VERSION_KEY, 2);
        // Depois de invalidar o cache: quem rebuscar já recebe dados novos.
        Realtime::emit('appointments');
    }

    public function index(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date_format:Y-m-d',
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from', function ($a, $v, $fail) use ($request) {
                if (Carbon::parse($request->input('from'))->diffInDays(Carbon::parse($v)) > 100) {
                    $fail('Intervalo grande demais.');
                }
            }],
        ]);

        $version = Cache::get(self::VERSION_KEY, 1);

        return Cache::remember(
            "appts:v{$version}:{$data['from']}:{$data['to']}",
            now()->addHours(6),
            function () use ($data) {
                Recurrence::materialize($data['from'], $data['to']);

                return Appointment::with(['patient', 'type'])
                    ->whereBetween('date', [$data['from'], $data['to']])
                    ->orderBy('date')->orderBy('hour')
                    ->get()
                    ->toArray(); // array puro: o cache não desserializa modelos Eloquent
            }
        );
    }

    private function slotRules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d', function ($attr, $value, $fail) {
                if (Carbon::parse($value)->isSunday()) {
                    $fail('Não há atendimento aos domingos.');
                }
            }],
            'hour' => 'required|integer|between:0,23',
        ];
    }

    private function rules(): array
    {
        return $this->slotRules() + [
            'patient_id' => 'required|exists:patients,id',
            'type_id' => 'nullable|exists:appointment_types,id',
            'notes' => 'nullable|string|max:5000',
        ];
    }

    private function occupant(string $date, int $hour, ?Appointment $except = null): ?Appointment
    {
        return Appointment::whereDate('date', $date)
            ->where('hour', $hour)
            ->when($except, fn ($q) => $q->where('id', '!=', $except->id))
            ->first();
    }

    private function load(Appointment $a): Appointment
    {
        return $a->fresh(['patient', 'type']);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules() + ['repeat' => 'sometimes|boolean']);
        abort_if($this->occupant($data['date'], $data['hour']), 422, 'Este horário já está ocupado.');

        $appointment = DB::transaction(function () use ($data) {
            if (! ($data['repeat'] ?? false)) {
                return Appointment::create(collect($data)->except('repeat')->all());
            }

            $rec = Recurrence::create([
                'patient_id' => $data['patient_id'],
                'type_id' => $data['type_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'weekday' => Carbon::parse($data['date'])->dayOfWeekIso,
                'hour' => $data['hour'],
                'start_date' => $data['date'],
            ]);
            $rec->generate($data['date'], $data['date']);

            return Appointment::where('recurrence_id', $rec->id)->firstOrFail();
        });
        self::forgetWeeks();

        return response()->json($this->load($appointment), 201);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $data = $request->validate($this->rules() + ['apply_future' => 'sometimes|boolean']);
        abort_if($this->occupant($data['date'], $data['hour'], $appointment), 422, 'Este horário já está ocupado.');

        $fields = collect($data)->only(['patient_id', 'type_id', 'notes', 'date', 'hour'])->all();
        $fields['type_id'] ??= null;

        DB::transaction(function () use ($appointment, $fields, $data) {
            $appointment->update($fields);

            if (($data['apply_future'] ?? false) && $appointment->recurrence_id) {
                $shared = collect($fields)->only(['patient_id', 'type_id', 'notes'])->all();
                $appointment->recurrence->update($shared);
                Appointment::where('recurrence_id', $appointment->recurrence_id)
                    ->where('original_date', '>', $appointment->original_date)
                    ->update($shared);
            }
        });
        self::forgetWeeks();

        return $this->load($appointment);
    }

    /** scope=one remove só esta semana; scope=future remove esta e as próximas da série. */
    public function destroy(Request $request, Appointment $appointment)
    {
        $scope = $request->query('scope', 'one');
        $rec = $appointment->recurrence;

        DB::transaction(function () use ($appointment, $rec, $scope) {
            if (! $rec) {
                $appointment->delete();
            } elseif ($scope === 'future') {
                $this->endSeriesAt($rec, $appointment->original_date->toDateString());
            } else {
                $rec->update(['skipped_dates' => array_values(array_unique(
                    [...($rec->skipped_dates ?? []), $appointment->original_date->toDateString()]
                ))]);
                $appointment->delete();
            }
        });
        self::forgetWeeks();

        return response()->noContent();
    }

    /** Encerra a série antes de $from e apaga as ocorrências de $from em diante. */
    private function endSeriesAt(Recurrence $rec, string $from): void
    {
        Appointment::where('recurrence_id', $rec->id)->where('original_date', '>=', $from)->delete();

        if ($from <= $rec->start_date->toDateString()) {
            $rec->delete();
        } else {
            $rec->update(['end_date' => Carbon::parse($from)->subDay()->toDateString()]);
        }
    }

    /**
     * Drag and drop. Se o destino estiver ocupado, os dois trocam de lugar.
     * scope=one: troca pontual (a série segue igual nas outras semanas).
     * scope=series: a série inteira (desta semana em diante) passa a cair no novo dia/horário.
     */
    public function move(Request $request, Appointment $appointment)
    {
        $data = $request->validate($this->slotRules() + ['scope' => 'sometimes|in:one,series']);
        $date = $data['date'];
        $hour = (int) $data['hour'];
        $oldDate = $appointment->date->toDateString();
        $oldHour = $appointment->hour;

        if ($date === $oldDate && $hour === $oldHour) {
            return $this->load($appointment);
        }

        $series = ($data['scope'] ?? 'one') === 'series' && $appointment->recurrence_id;

        $result = DB::transaction(function () use ($appointment, $date, $hour, $oldDate, $oldHour, $series) {
            if (! $series) {
                $other = $this->occupant($date, $hour, $appointment);
                if ($other) {
                    $appointment->update(['date' => '1900-01-01', 'hour' => 0]); // libera o slot (índice único)
                    $other->update(['date' => $oldDate, 'hour' => $oldHour]);
                }
                $appointment->update(['date' => $date, 'hour' => $hour]);

                return $appointment;
            }

            $rec = $appointment->recurrence;
            $this->endSeriesAt($rec, $appointment->original_date->toDateString());

            $this->occupant($date, $hour)?->update(['date' => $oldDate, 'hour' => $oldHour]);

            $new = Recurrence::create([
                'patient_id' => $rec->patient_id,
                'type_id' => $rec->type_id,
                'notes' => $rec->notes,
                'weekday' => Carbon::parse($date)->dayOfWeekIso,
                'hour' => $hour,
                'start_date' => $date,
            ]);
            $new->generate($date, $date);

            return Appointment::where('recurrence_id', $new->id)->firstOrFail();
        });
        self::forgetWeeks();

        return $this->load($result);
    }
}
