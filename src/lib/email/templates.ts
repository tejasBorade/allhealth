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
