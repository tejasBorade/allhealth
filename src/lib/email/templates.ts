import { REMINDER_TIMEZONE } from "@/lib/reminders/constants";

interface AppointmentReminderParams {
  patientName: string;
  doctorName: string;
  appointmentAt: Date;
  reminderKind: "24h" | "1h";
}

interface MedicationDoseReminderParams {
  patientName: string;
  medicationName: string;
  dosage: string;
  doseAt: Date;
}

function formatInReminderTimezone(date: Date): string {
  return date.toLocaleString("en-IN", {
    timeZone: REMINDER_TIMEZONE,
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function appointmentReminderEmail({
  patientName,
  doctorName,
  appointmentAt,
  reminderKind,
}: AppointmentReminderParams): { subject: string; html: string } {
  const when = formatInReminderTimezone(appointmentAt);
  const relative = reminderKind === "24h" ? "tomorrow" : "in about an hour";
  const subject =
    reminderKind === "24h"
      ? `Reminder: your appointment with Dr. ${doctorName} is tomorrow`
      : `Reminder: your appointment with Dr. ${doctorName} is in about an hour`;

  const html = `
    <div style="font-family: sans-serif; font-size: 15px; color: #1a1a1a;">
      <p>Hi ${patientName},</p>
      <p>This is a reminder that your appointment with <strong>Dr. ${doctorName}</strong> is ${relative}.</p>
      <p><strong>When:</strong> ${when}</p>
      <p>If you need to reschedule, please contact the clinic as soon as possible.</p>
      <p>— FriendlyHealthy</p>
    </div>
  `;

  return { subject, html };
}

interface VisitReportEmailParams {
  patientName: string;
  doctorName: string;
  clinicName: string | null;
  appointmentAt: Date;
  chiefComplaint: string | null;
  diagnosis: string | null;
  medicines: { medication_name: string; dosage: string; frequency_code: string }[];
  followUpDate: string | null;
  reportUrl: string;
}

export function visitReportEmail({
  patientName,
  doctorName,
  clinicName,
  appointmentAt,
  chiefComplaint,
  diagnosis,
  medicines,
  followUpDate,
  reportUrl,
}: VisitReportEmailParams): { subject: string; html: string } {
  const when = formatInReminderTimezone(appointmentAt);
  const subject = `Your visit summary from Dr. ${doctorName}`;

  const medsList =
    medicines.length > 0
      ? `<ul>${medicines
          .map((m) => `<li>${m.medication_name} — ${m.dosage} (${m.frequency_code})</li>`)
          .join("")}</ul>`
      : "<p>No new medicines prescribed at this visit.</p>";

  const html = `
    <div style="font-family: sans-serif; font-size: 15px; color: #1a1a1a;">
      <p>Hi ${patientName},</p>
      <p>Your visit with <strong>Dr. ${doctorName}</strong>${clinicName ? ` at ${clinicName}` : ""} on ${when} is now complete. Here's a summary:</p>
      ${chiefComplaint ? `<p><strong>Reason for visit:</strong> ${chiefComplaint}</p>` : ""}
      ${diagnosis ? `<p><strong>Diagnosis:</strong> ${diagnosis}</p>` : ""}
      <p><strong>Medicines:</strong></p>
      ${medsList}
      ${followUpDate ? `<p><strong>Follow-up:</strong> ${new Date(followUpDate).toLocaleDateString()}</p>` : ""}
      <p><a href="${reportUrl}" style="color:#0891B2;">View &amp; download your full visit report →</a></p>
      <p>— FriendlyHealthy</p>
    </div>
  `;

  return { subject, html };
}

export function medicationDoseReminderEmail({
  patientName,
  medicationName,
  dosage,
  doseAt,
}: MedicationDoseReminderParams): { subject: string; html: string } {
  const when = formatInReminderTimezone(doseAt);
  const subject = `Time for your dose: ${medicationName}`;

  const html = `
    <div style="font-family: sans-serif; font-size: 15px; color: #1a1a1a;">
      <p>Hi ${patientName},</p>
      <p>It's time for your dose of <strong>${medicationName}</strong> (${dosage}).</p>
      <p><strong>Scheduled for:</strong> ${when}</p>
      <p>— FriendlyHealthy</p>
    </div>
  `;

  return { subject, html };
}
