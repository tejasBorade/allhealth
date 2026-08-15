import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseFrequencyCode } from "@/lib/reminders/frequency";
import ReportToolbar from "./ReportToolbar";
import styles from "./report.module.css";

const FREQUENCY_KEY: Record<string, string> = {
  OD: "Once daily",
  BD: "Twice daily",
  BID: "Twice daily",
  TDS: "Three times daily",
  TID: "Three times daily",
  QID: "Four times daily",
  HS: "At bedtime",
  SOS: "As needed",
  PRN: "As needed",
  STAT: "Immediately, once",
};

function computeAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function VisitReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS (appointments_select_own) already scopes this to the appointment's own
  // patient/doctor or staff/admin — an unauthorized id simply returns no row.
  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, doctor_id, appointment_at, status, chief_complaint, bp_systolic, bp_diastolic, pulse_bpm, weight_kg, advice"
    )
    .eq("id", id)
    .single();

  if (!appointment) {
    return (
      <div className={styles.page} style={{ textAlign: "center", padding: "48px 16mm" }}>
        Appointment not found, or you don&apos;t have access to it.
      </div>
    );
  }

  if (appointment.status !== "completed") {
    return (
      <div className={styles.page} style={{ textAlign: "center", padding: "48px 16mm" }}>
        This visit report isn&apos;t available yet — it will be ready once your doctor marks the
        appointment as completed.
      </div>
    );
  }

  const [{ data: doctorProfile }, { data: doctor }, { data: patientProfile }, { data: patient }, { data: prescription }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", appointment.doctor_id).single(),
      supabase
        .from("doctors")
        .select("specialization, clinic_name, registration_number, qualifications, clinic_address, clinic_phone")
        .eq("profile_id", appointment.doctor_id)
        .single(),
      supabase.from("profiles").select("full_name, phone").eq("id", appointment.patient_id).single(),
      supabase
        .from("patients")
        .select("date_of_birth, gender, address, allergies, blood_group, abha_number")
        .eq("profile_id", appointment.patient_id)
        .single(),
      supabase
        .from("prescriptions")
        .select(
          "diagnosis, follow_up_date, notes, prescription_medicines(id, medication_name, dosage, frequency_code, duration_days)"
        )
        .eq("appointment_id", id)
        .maybeSingle(),
    ]);

  const age = computeAge(patient?.date_of_birth ?? null);
  const uhid = `UHID-${appointment.patient_id.slice(0, 8).toUpperCase()}`;
  const refCode = `RPT-${appointment.id.slice(0, 8).toUpperCase()}`;
  const medicines = prescription?.prescription_medicines ?? [];
  const frequenciesUsed = Array.from(
    new Set(medicines.map((m) => m.frequency_code.trim().toUpperCase()).filter((c) => c in FREQUENCY_KEY))
  );

  const vitalsParts: string[] = [];
  if (appointment.bp_systolic && appointment.bp_diastolic) {
    vitalsParts.push(`BP ${appointment.bp_systolic}/${appointment.bp_diastolic} mmHg`);
  }
  if (appointment.pulse_bpm) vitalsParts.push(`Pulse ${appointment.pulse_bpm} bpm`);
  if (appointment.weight_kg) vitalsParts.push(`Weight ${appointment.weight_kg} kg`);

  return (
    <>
      <ReportToolbar />
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.clinicName}>{doctor?.clinic_name || `Dr. ${doctorProfile?.full_name ?? ""}`}</div>
          {doctor?.clinic_address && <div className={styles.clinicMeta}>{doctor.clinic_address}</div>}
          {doctor?.clinic_phone && <div className={styles.clinicMeta}>Phone: {doctor.clinic_phone}</div>}
          <div className={styles.doctorRow}>
            <div>
              <div className={styles.doctorName}>Dr. {doctorProfile?.full_name ?? "—"}</div>
              <div className={styles.muted}>
                {doctor?.qualifications || "Qualifications not on file"}
                {doctor?.specialization ? ` · ${doctor.specialization}` : ""}
              </div>
            </div>
            <div className={styles.muted}>Reg. No: {doctor?.registration_number || "not on file"}</div>
          </div>
        </div>

        <div className={styles.sectionLabel}>Patient Details</div>
        <div className={styles.metaGrid}>
          <div>
            <strong>Name:</strong> {patientProfile?.full_name ?? "—"}
            {age !== null && `, ${age} yrs`}
            {patient?.gender && `, ${patient.gender}`}
          </div>
          <div>
            <strong>Date of Visit:</strong> {formatDate(appointment.appointment_at)}
          </div>
          <div>
            <strong>UHID:</strong> {uhid}
          </div>
          {patientProfile?.phone && (
            <div>
              <strong>Phone:</strong> {patientProfile.phone}
            </div>
          )}
          {patient?.address && (
            <div>
              <strong>Address:</strong> {patient.address}
            </div>
          )}
          {patient?.abha_number && (
            <div>
              <strong>ABHA:</strong> {patient.abha_number}
            </div>
          )}
          {vitalsParts.length > 0 && (
            <div>
              <strong>Vitals:</strong> {vitalsParts.join(" · ")}
            </div>
          )}
          <div>
            <strong>Allergy Status:</strong>{" "}
            {patient?.allergies && patient.allergies.trim() !== "" ? patient.allergies : "No known allergies"}
          </div>
        </div>

        {patient?.allergies && patient.allergies.trim() !== "" && (
          <div className={styles.allergyBanner}>⚠ Known allergy: {patient.allergies}</div>
        )}

        {appointment.chief_complaint && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Chief Complaints</div>
            <div>{appointment.chief_complaint}</div>
          </div>
        )}

        {prescription?.diagnosis && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Provisional Diagnosis</div>
            <div>{prescription.diagnosis}</div>
          </div>
        )}

        {medicines.length > 0 && (
          <>
            <div className={styles.rxRow}>
              <div className={styles.rxSymbol}>Rx</div>
            </div>
            <table className={styles.medsTable}>
              <thead>
                <tr>
                  <th style={{ width: 24 }}>#</th>
                  <th>Medication (Generic)</th>
                  <th>Strength &amp; Form</th>
                  <th>Route</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Total Qty</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med, i) => {
                  const times = parseFrequencyCode(med.frequency_code);
                  const dosesPerDay = Math.max(times.length, 1);
                  const totalQty = dosesPerDay * med.duration_days;
                  return (
                    <tr key={med.id}>
                      <td>{i + 1}</td>
                      <td>{med.medication_name.toUpperCase()}</td>
                      <td>{med.dosage}</td>
                      <td>Oral</td>
                      <td>
                        {med.frequency_code}
                        {times.length > 0 && <div className={styles.doseTimes}>{times.join(", ")}</div>}
                      </td>
                      <td>{med.duration_days} days</td>
                      <td>{totalQty}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {frequenciesUsed.length > 0 && (
              <div className={styles.freqKey}>
                <strong>Frequency Key:</strong>{" "}
                {frequenciesUsed.map((code) => `${code} = ${FREQUENCY_KEY[code]}`).join("  ·  ")}
              </div>
            )}
          </>
        )}

        {(prescription?.notes || appointment.advice) && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Advice &amp; Investigations</div>
            {prescription?.notes && <div>{prescription.notes}</div>}
            {appointment.advice && <div>{appointment.advice}</div>}
          </div>
        )}

        {prescription?.follow_up_date && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Follow-Up Date</div>
            <div>{formatDate(prescription.follow_up_date)}</div>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.muted}>Ref: {refCode}</div>
          <div className={styles.signature}>
            <div className={styles.signatureLine} />
            <div>
              <strong>Dr. {doctorProfile?.full_name ?? "—"}</strong>
            </div>
            <div className={styles.muted}>{doctor?.registration_number || "Reg. No. not on file"}</div>
          </div>
        </div>

        <div className={styles.legal}>
          This is a computer-generated visit report issued via FriendlyHealthy on{" "}
          {new Date().toLocaleString("en-IN")}. Reference {refCode}. It is not cryptographically
          signed — please verify authenticity with the issuing doctor or clinic if in doubt.
        </div>
      </div>
    </>
  );
}
