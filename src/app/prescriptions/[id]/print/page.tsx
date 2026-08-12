import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseFrequencyCode } from "@/lib/reminders/frequency";
import PrintToolbar from "./PrintToolbar";
import styles from "./print.module.css";

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

export default async function PrescriptionPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS (prescriptions_select) already scopes this to the prescription's own
  // patient/doctor or staff/admin — an unauthorized id simply returns no row.
  const { data: prescription } = await supabase
    .from("prescriptions")
    .select(
      "id, patient_id, doctor_id, prescribed_at, follow_up_date, diagnosis, notes, prescription_medicines(id, medication_name, dosage, frequency_code, duration_days, start_date)"
    )
    .eq("id", id)
    .single();

  if (!prescription) {
    return (
      <div className={styles.page} style={{ textAlign: "center", padding: "48px 16mm" }}>
        Prescription not found, or you don&apos;t have access to it.
      </div>
    );
  }

  const [{ data: doctorProfile }, { data: doctor }, { data: patientProfile }, { data: patient }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", prescription.doctor_id).single(),
    supabase
      .from("doctors")
      .select("specialization, clinic_name, bio, registration_number, qualifications, clinic_address, clinic_phone")
      .eq("profile_id", prescription.doctor_id)
      .single(),
    supabase.from("profiles").select("full_name, phone").eq("id", prescription.patient_id).single(),
    supabase
      .from("patients")
      .select("date_of_birth, gender, address, allergies, blood_group, abha_number")
      .eq("profile_id", prescription.patient_id)
      .single(),
  ]);

  const age = computeAge(patient?.date_of_birth ?? null);
  const refCode = `RX-${prescription.id.slice(0, 8).toUpperCase()}`;

  return (
    <>
      <PrintToolbar />
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
            <div className={styles.muted}>
              Reg. No: {doctor?.registration_number || "not on file"}
            </div>
          </div>
        </div>

        <div className={styles.metaGrid}>
          <div>
            <strong>Patient:</strong> {patientProfile?.full_name ?? "—"}
            {age !== null && `, ${age} yrs`}
            {patient?.gender && `, ${patient.gender}`}
          </div>
          <div>
            <strong>Date:</strong> {formatDate(prescription.prescribed_at)}
          </div>
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
        </div>

        {patient?.allergies && patient.allergies.trim() !== "" && (
          <div className={styles.allergyBanner}>⚠ Known allergy: {patient.allergies}</div>
        )}

        <div className={styles.rxRow}>
          <div className={styles.rxSymbol}>Rx</div>
          {prescription.diagnosis && (
            <div>
              <div className={styles.diagnosisLabel}>Diagnosis</div>
              <div>{prescription.diagnosis}</div>
            </div>
          )}
        </div>

        <table className={styles.medsTable}>
          <thead>
            <tr>
              <th style={{ width: 28 }}>#</th>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {prescription.prescription_medicines.map((med, i) => {
              const times = parseFrequencyCode(med.frequency_code);
              return (
                <tr key={med.id}>
                  <td>{i + 1}</td>
                  <td>{med.medication_name}</td>
                  <td>{med.dosage}</td>
                  <td>
                    {med.frequency_code}
                    {times.length > 0 && <div className={styles.doseTimes}>{times.join(", ")}</div>}
                  </td>
                  <td>{med.duration_days} days</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {prescription.notes && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Instructions</div>
            <div>{prescription.notes}</div>
          </div>
        )}

        {prescription.follow_up_date && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Follow-up</div>
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
          This is a computer-generated prescription issued via FriendlyHealthy on{" "}
          {new Date().toLocaleString("en-IN")}. Reference {refCode}. It is not cryptographically
          signed — please verify authenticity with the issuing doctor or clinic if in doubt.
        </div>
      </div>
    </>
  );
}
