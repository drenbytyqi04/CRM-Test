"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAppointment, updateAppointment } from "@/app/actions";
import {
  APPOINTMENT_STATUSES,
  type Appointment,
  type FormState,
} from "@/lib/types";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900";
const label = "mb-1 block text-sm font-medium text-slate-700";

/**
 * Formulari i takimit.
 *
 * Përdoret në dy mënyra:
 *  - pa `appointment`: krijon një takim të ri për klientin e dhënë
 *  - me `appointment`: ndryshon një takim ekzistues
 *
 * `scheduledDefault` vjen i gatshëm nga serveri, i llogaritur me orën e
 * Tiranës — që teksti të jetë i njëjtë në server dhe në shfletues.
 */
export default function AppointmentForm({
  clientId,
  appointment,
  scheduledDefault,
}: {
  clientId: string;
  appointment?: Appointment;
  scheduledDefault: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const duke = Boolean(appointment);

  const [state, action, pending] = useActionState<FormState, FormData>(
    duke ? updateAppointment : createAppointment,
    {}
  );

  // Pas krijimit e zbrazim formularin, që të caktohet takimi tjetër.
  const trajtuar = useRef<FormState | null>(null);
  useEffect(() => {
    if (state.ok && !duke && trajtuar.current !== state) {
      trajtuar.current = state;
      formRef.current?.reset();
    }
  }, [state, duke]);

  return (
    // `key` ndryshon sa herë ruhet takimi: kështu fushat rimbushen me vlerat e
    // sapo ruajtura (p.sh. statusi), ndërsa mesazhi i suksesit mbetet.
    <form
      key={appointment?.updated_at ?? "i-ri"}
      ref={formRef}
      action={action}
      className="space-y-6"
    >
      {duke ? (
        <input type="hidden" name="appointmentId" value={appointment!.id} />
      ) : (
        <input type="hidden" name="clientId" value={clientId} />
      )}

      {/* ---------- Të dhëna teknike ---------- */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Të dhëna teknike
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={label}>Call center</span>
            <input
              name="callCenter"
              defaultValue={appointment?.call_center ?? ""}
              placeholder="I&M Call"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>Sigurimi aktual</span>
            <input
              name="currentInsurance"
              defaultValue={appointment?.current_insurance ?? ""}
              placeholder="Helsana"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>Gjuha</span>
            <input
              name="language"
              defaultValue={appointment?.language ?? ""}
              placeholder="Gjermanisht"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>Data e telefonatës</span>
            <input
              name="callDate"
              type="date"
              defaultValue={appointment?.call_date ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>
              Data dhe ora e takimit <span className="text-red-600">*</span>
            </span>
            <input
              name="scheduledAt"
              type="datetime-local"
              required
              defaultValue={scheduledDefault}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>Numri i personave</span>
            <input
              name="personsCount"
              type="number"
              min={1}
              defaultValue={appointment?.persons_count ?? 1}
              className={input}
            />
          </label>
        </div>
      </section>

      {/* ---------- Rezultati ---------- */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Rezultati
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Statusi</span>
            <select
              name="status"
              defaultValue={appointment?.status ?? "open"}
              className={`${input} bg-white`}
            >
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              Vetëm një status njëherësh — kështu raportet nuk bien në kundërshtim.
            </span>
          </label>
          <label className="block">
            <span className={label}>Kontrata të mbyllura</span>
            <input
              name="contractsClosed"
              type="number"
              min={0}
              defaultValue={appointment?.contracts_closed ?? 0}
              className={input}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Nuk lejohet më shumë se numri i personave.
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="multiYearContract"
              defaultChecked={appointment?.multi_year_contract ?? false}
              className="h-4 w-4"
            />
            Kontratë shumëvjeçare
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="treatment"
              defaultChecked={appointment?.treatment ?? false}
              className="h-4 w-4"
            />
            Trajtim
          </label>
        </div>
      </section>

      {/* ---------- Detaje të këshillimit ---------- */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          Detaje të këshillimit
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Të dhënat shëndetësore janë të ndjeshme. Plotësoji vetëm nëse i duhen
          këshillimit dhe klienti është i informuar.
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className={label}>Detaje familjare</span>
            <input
              name="familyDetails"
              defaultValue={appointment?.family_details ?? ""}
              placeholder="Burri: 1986, fëmijët: 2020, 2023"
              className={input}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Trajtim aktual</span>
              <select
                name="currentTreatment"
                defaultValue={appointment?.current_treatment ?? ""}
                className={`${input} bg-white`}
              >
                <option value="">—</option>
                <option value="jo">Jo</option>
                <option value="po">Po</option>
              </select>
            </label>
            <label className="block">
              <span className={label}>Lloji i trajtimit</span>
              <input
                name="treatmentType"
                defaultValue={appointment?.treatment_type ?? ""}
                className={input}
              />
            </label>
          </div>
          <label className="block">
            <span className={label}>Medikamente të rregullta</span>
            <input
              name="medications"
              defaultValue={appointment?.medications ?? ""}
              className={input}
            />
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {pending
            ? "Duke ruajtur..."
            : duke
              ? "Ruaj ndryshimet"
              : "Cakto takimin"}
        </button>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        {state.message && !pending && (
          <p className="text-sm text-emerald-700">{state.message}</p>
        )}
      </div>
    </form>
  );
}
