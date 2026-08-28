"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAppointment, updateAppointment } from "@/app/actions";
import {
  APPOINTMENT_STATUSES,
  GENDERS,
  type Appointment,
  type FormState,
} from "@/lib/types";
import { TabPanel } from "./tabs";
import { DICTS, type Lang } from "@/lib/i18n";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900";
const label = "mb-1 block text-sm font-medium text-slate-700";

/**
 * Formulari i terminit — njësia e vetme e sistemit.
 *
 * Të dhënat e personit rrinë mbi vetë terminin: nuk ka kartelë klienti veç,
 * sepse çdo termin regjistrohet si ngjarje më vete.
 *
 * Përdoret në dy mënyra:
 *  - pa `appointment`: cakton një termin të ri
 *  - me `appointment`: ndryshon një termin ekzistues
 */
export default function AppointmentForm({
  appointment,
  scheduledDefault,
  lang,
}: {
  appointment?: Appointment;
  scheduledDefault: string;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const formRef = useRef<HTMLFormElement>(null);
  const duke = Boolean(appointment);

  const [state, action, pending] = useActionState<FormState, FormData>(
    duke ? updateAppointment : createAppointment,
    {}
  );

  // Pas krijimit e zbrazim formularin, që të caktohet termini tjetër.
  const trajtuar = useRef<FormState | null>(null);
  useEffect(() => {
    if (state.ok && !duke && trajtuar.current !== state) {
      trajtuar.current = state;
      formRef.current?.reset();
    }
  }, [state, duke]);

  return (
    // `key` ndryshon sa herë ruhet termini: fushat rimbushen me vlerat e
    // sapo ruajtura, ndërsa mesazhi i suksesit mbetet.
    <form
      key={appointment?.updated_at ?? "i-ri"}
      ref={formRef}
      action={action}
      className="space-y-6"
    >
      {duke && (
        <input type="hidden" name="appointmentId" value={appointment!.id} />
      )}

      {/* ---------- Personalia ---------- */}
      <TabPanel id="personalia">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          {t.tabPersonalia}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className={label}>
              {t.fName} <span className="text-red-600">*</span>
            </span>
            <input
              name="name"
              required
              defaultValue={appointment?.name ?? ""}
              placeholder="Arben Krasniqi"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fCustomerNumber}</span>
            <input
              name="customerNumber"
              defaultValue={appointment?.customer_number ?? ""}
              className={input}
            />
          </label>

          <label className="block">
            <span className={label}>{t.fGender}</span>
            <select
              name="gender"
              defaultValue={appointment?.gender ?? ""}
              className={`${input} bg-white`}
            >
              <option value="">—</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {t[g.key]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>{t.fNationality}</span>
            <input
              name="nationality"
              defaultValue={appointment?.nationality ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fBirthDate}</span>
            <input
              name="birthDate"
              type="date"
              defaultValue={appointment?.birth_date ?? ""}
              className={input}
            />
          </label>

          <label className="block">
            <span className={label}>{t.fPhone}</span>
            <input
              name="phone"
              type="tel"
              defaultValue={appointment?.phone ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fMobile}</span>
            <input
              name="mobile"
              type="tel"
              defaultValue={appointment?.mobile ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fEmail}</span>
            <input
              name="email"
              type="email"
              defaultValue={appointment?.email ?? ""}
              className={input}
            />
          </label>

          <label className="block">
            <span className={label}>{t.fStreet}</span>
            <input
              name="street"
              defaultValue={appointment?.street ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fPostalCode}</span>
            <input
              name="postalCode"
              defaultValue={appointment?.postal_code ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fCity}</span>
            <input
              name="city"
              defaultValue={appointment?.city ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fCanton}</span>
            <input
              name="canton"
              defaultValue={appointment?.canton ?? ""}
              className={input}
            />
          </label>
        </div>
      </section>

      </TabPanel>

      {/* ---------- Të dhëna teknike ---------- */}
      <TabPanel id="teknike">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          {t.tabTechnical}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={label}>{t.fCallCenter}</span>
            <input
              name="callCenter"
              defaultValue={appointment?.call_center ?? ""}
              placeholder="I&M Call"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fCurrentInsurance}</span>
            <input
              name="currentInsurance"
              defaultValue={appointment?.current_insurance ?? ""}
              placeholder="Helsana"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fLanguage}</span>
            <input
              name="language"
              defaultValue={appointment?.language ?? ""}
              placeholder="Gjermanisht"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fCallDate}</span>
            <input
              name="callDate"
              type="date"
              defaultValue={appointment?.call_date ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>
              {t.fScheduledAt} <span className="text-red-600">*</span>
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
            <span className={label}>{t.fPersonsCount}</span>
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

      </TabPanel>

      {/* ---------- Rezultati ---------- */}
      <TabPanel id="rezultati">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          {t.tabResult}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>{t.fStatus}</span>
            <select
              name="status"
              defaultValue={appointment?.status ?? "open"}
              className={`${input} bg-white`}
            >
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {t[s.key]}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              {t.statusHint}
            </span>
          </label>
          <label className="block">
            <span className={label}>{t.fContractsClosed}</span>
            <input
              name="contractsClosed"
              type="number"
              min={0}
              defaultValue={appointment?.contracts_closed ?? 0}
              className={input}
            />
            <span className="mt-1 block text-xs text-slate-500">
              {t.contractsHint}
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
            {t.fMultiYear}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="treatment"
              defaultChecked={appointment?.treatment ?? false}
              className="h-4 w-4"
            />
            {t.fTreatment}
          </label>
        </div>
      </section>

      </TabPanel>

      {/* ---------- Detaje të këshillimit ---------- */}
      <TabPanel id="detaje">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          {t.tabDetails}
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          {t.detailsHint}
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className={label}>{t.fFamilyDetails}</span>
            <input
              name="familyDetails"
              defaultValue={appointment?.family_details ?? ""}
              placeholder="Burri: 1986, fëmijët: 2020, 2023"
              className={input}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>{t.fCurrentTreatment}</span>
              <select
                name="currentTreatment"
                defaultValue={appointment?.current_treatment ?? ""}
                className={`${input} bg-white`}
              >
                <option value="">—</option>
                <option value="jo">{t.no}</option>
                <option value="po">{t.yes}</option>
              </select>
            </label>
            <label className="block">
              <span className={label}>{t.fTreatmentType}</span>
              <input
                name="treatmentType"
                defaultValue={appointment?.treatment_type ?? ""}
                className={input}
              />
            </label>
          </div>
          <label className="block">
            <span className={label}>{t.fMedications}</span>
            <input
              name="medications"
              defaultValue={appointment?.medications ?? ""}
              className={input}
            />
          </label>
        </div>
      </section>
      </TabPanel>

      {/* Butoni i ruajtjes duket te çdo skedë e formularit, jo te Feedback-u:
          ai bllok nuk i përket formularit. */}
      <TabPanel id={["personalia", "teknike", "rezultati", "detaje"]}>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? t.saving : duke ? t.saveChanges : t.createAppointment}
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
      </TabPanel>
    </form>
  );
}
