import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";
import type { Database } from "@/lib/supabase/types";
import { bookAppointment } from "@/app/patient/doctors/actions";
import { cancelAppointment } from "@/app/patient/appointments/actions";

export interface ChatLink {
  label: string;
  url: string;
}

export interface ToolContext {
  supabase: SupabaseClient<Database>;
  userId: string;
}

export interface ToolRunResult {
  result: unknown;
  links?: ChatLink[];
}

const NAV_SECTIONS: Record<string, { label: string; href: string }> = {
  doctors: { label: "Find a Doctor", href: "/patient/doctors" },
  appointments: { label: "Appointments", href: "/patient/appointments" },
  prescriptions: { label: "Prescriptions", href: "/patient/prescriptions" },
  "medical-records": { label: "Medical Records", href: "/patient/medical-records" },
  billing: { label: "Billing", href: "/patient/billing" },
  messages: { label: "Messages", href: "/patient/messages" },
};

// Every tool below reads/writes only through the calling patient's own
// session-scoped `supabase` client (never an admin client) and only ever
// scopes to `ctx.userId` taken from the verified session — the model can
// never pass in a different patient_id. RLS (already in place on every one
// of these tables/buckets) is the real enforcement boundary, not this code.

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_doctors",
    description: "Search approved doctors by specialization or name.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Specialization or doctor name to search for, e.g. 'cardiologist' or 'Sharma'.",
        },
      },
    },
  },
  {
    name: "list_my_appointments",
    description: "List the current patient's own appointments, optionally filtered by status.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["scheduled", "completed", "cancelled"] },
      },
    },
  },
  {
    name: "book_appointment",
    description: "Book a new appointment for the current patient with a given doctor at a given date/time.",
    input_schema: {
      type: "object",
      properties: {
        doctorId: { type: "string", description: "The doctor's id, from search_doctors results." },
        appointmentAtIso: {
          type: "string",
          description: "ISO 8601 date-time for the appointment, e.g. 2026-08-20T10:00:00+05:30.",
        },
      },
      required: ["doctorId", "appointmentAtIso"],
    },
  },
  {
    name: "cancel_appointment",
    description: "Cancel one of the current patient's own scheduled appointments.",
    input_schema: {
      type: "object",
      properties: {
        appointmentId: { type: "string", description: "The appointment id, from list_my_appointments results." },
      },
      required: ["appointmentId"],
    },
  },
  {
    name: "list_my_prescriptions",
    description: "List the current patient's own prescriptions, each with a printable link.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_my_reports",
    description:
      "List the current patient's own downloadable lab reports and completed-visit reports, each with a real link.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_my_billing",
    description:
      "List the current patient's own billing entries and their status. There is no downloadable invoice for " +
      "these — never claim a download link exists for a billing entry.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "navigate_to",
    description: "Get a direct link to a section of the app for the patient to open.",
    input_schema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["doctors", "appointments", "prescriptions", "medical-records", "billing", "messages"],
        },
      },
      required: ["section"],
    },
  },
];

interface DoctorRow {
  profile_id: string;
  specialization: string | null;
  clinic_name: string | null;
  profiles: { full_name: string | null } | { full_name: string | null }[];
}

function singular<T>(value: T | T[]): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function searchDoctors(supabase: SupabaseClient<Database>, query?: string): Promise<ToolRunResult> {
  const { data, error } = await supabase
    .from("doctors")
    .select("profile_id, specialization, clinic_name, profiles!inner(full_name)")
    .eq("profiles.approved", true);
  if (error) return { result: { doctors: [], error: error.message } };

  const q = (query ?? "").trim().toLowerCase();
  const doctors = (data as DoctorRow[])
    .map((d) => ({ row: d, profile: singular(d.profiles) }))
    .filter(
      ({ row, profile }) =>
        !q ||
        (profile?.full_name ?? "").toLowerCase().includes(q) ||
        (row.specialization ?? "").toLowerCase().includes(q)
    )
    .slice(0, 10)
    .map(({ row, profile }) => ({
      doctorId: row.profile_id,
      name: profile?.full_name ?? "Unnamed",
      specialization: row.specialization,
      clinicName: row.clinic_name,
    }));

  return { result: { doctors } };
}

async function listMyAppointments(
  supabase: SupabaseClient<Database>,
  userId: string,
  status?: string
): Promise<ToolRunResult> {
  let query = supabase
    .from("appointments")
    .select("id, appointment_at, status, doctors(profiles(full_name))")
    .eq("patient_id", userId)
    .order("appointment_at", { ascending: false })
    .limit(15);
  if (status === "scheduled" || status === "completed" || status === "cancelled") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return { result: { appointments: [], error: error.message } };

  const appointments = (data ?? []).map((a) => {
    const doctor = singular(a.doctors);
    const profile = doctor ? singular(doctor.profiles) : null;
    return {
      appointmentId: a.id,
      doctorName: profile?.full_name ?? "Unknown",
      appointmentAt: a.appointment_at,
      status: a.status,
    };
  });

  return { result: { appointments } };
}

async function bookAppointmentTool(doctorId: string, appointmentAtIso: string): Promise<ToolRunResult> {
  const formData = new FormData();
  formData.set("doctorId", doctorId);
  formData.set("appointmentAt", appointmentAtIso);
  const outcome = await bookAppointment(formData);
  return { result: outcome };
}

async function cancelAppointmentTool(appointmentId: string): Promise<ToolRunResult> {
  try {
    await cancelAppointment(appointmentId);
    return { result: { success: true } };
  } catch (err) {
    return { result: { error: err instanceof Error ? err.message : "Failed to cancel." } };
  }
}

async function listMyPrescriptions(supabase: SupabaseClient<Database>, userId: string): Promise<ToolRunResult> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("id, diagnosis, prescribed_at, doctors(profiles(full_name))")
    .eq("patient_id", userId)
    .order("prescribed_at", { ascending: false })
    .limit(10);
  if (error) return { result: { prescriptions: [], error: error.message } };

  const links: ChatLink[] = [];
  const prescriptions = data.map((p) => {
    const doctor = singular(p.doctors);
    const profile = doctor ? singular(doctor.profiles) : null;
    const doctorName = profile?.full_name ?? "Unknown";
    links.push({
      label: `Prescription — Dr. ${doctorName} (${new Date(p.prescribed_at).toLocaleDateString()})`,
      url: `/prescriptions/${p.id}/print`,
    });
    return { prescriptionId: p.id, doctorName, diagnosis: p.diagnosis, prescribedAt: p.prescribed_at };
  });

  return { result: { prescriptions }, links };
}

async function listMyReports(supabase: SupabaseClient<Database>, userId: string): Promise<ToolRunResult> {
  const [{ data: reports }, { data: appointments }] = await Promise.all([
    supabase
      .from("medical_reports")
      .select("id, report_type, status, storage_path, uploaded_at")
      .eq("patient_id", userId)
      .order("uploaded_at", { ascending: false })
      .limit(10),
    supabase
      .from("appointments")
      .select("id, appointment_at, doctors(profiles(full_name))")
      .eq("patient_id", userId)
      .eq("status", "completed")
      .order("appointment_at", { ascending: false })
      .limit(10),
  ]);

  const links: ChatLink[] = [];

  const labReports = await Promise.all(
    (reports ?? []).map(async (r) => {
      const { data: signed } = await supabase.storage.from("medical-reports").createSignedUrl(r.storage_path, 600);
      if (signed?.signedUrl) {
        links.push({
          label: `${r.report_type} (${new Date(r.uploaded_at).toLocaleDateString()})`,
          url: signed.signedUrl,
        });
      }
      return { reportId: r.id, type: r.report_type, status: r.status, uploadedAt: r.uploaded_at };
    })
  );

  const visitReports = (appointments ?? []).map((a) => {
    const doctor = singular(a.doctors);
    const profile = doctor ? singular(doctor.profiles) : null;
    const doctorName = profile?.full_name ?? "Unknown";
    links.push({
      label: `Visit report — Dr. ${doctorName} (${new Date(a.appointment_at).toLocaleDateString()})`,
      url: `/appointments/${a.id}/report`,
    });
    return { appointmentId: a.id, doctorName, appointmentAt: a.appointment_at };
  });

  return { result: { labReports, visitReports }, links };
}

async function listMyBilling(supabase: SupabaseClient<Database>, userId: string): Promise<ToolRunResult> {
  const { data, error } = await supabase
    .from("billing")
    .select("id, amount, status, created_at")
    .eq("patient_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return { result: { billing: [], error: error.message } };

  return {
    result: {
      billing: data,
      note: "No downloadable invoice/receipt exists for these entries yet.",
    },
  };
}

function navigateTo(section: string): ToolRunResult {
  const entry = NAV_SECTIONS[section];
  if (!entry) return { result: { error: "Unknown section." } };
  return { result: { section, url: entry.href }, links: [{ label: entry.label, url: entry.href }] };
}

export async function runTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolRunResult> {
  const { supabase, userId } = ctx;

  switch (name) {
    case "search_doctors":
      return searchDoctors(supabase, typeof input.query === "string" ? input.query : undefined);
    case "list_my_appointments":
      return listMyAppointments(supabase, userId, typeof input.status === "string" ? input.status : undefined);
    case "book_appointment":
      if (typeof input.doctorId !== "string" || typeof input.appointmentAtIso !== "string") {
        return { result: { error: "Missing doctorId or appointmentAtIso." } };
      }
      return bookAppointmentTool(input.doctorId, input.appointmentAtIso);
    case "cancel_appointment":
      if (typeof input.appointmentId !== "string") {
        return { result: { error: "Missing appointmentId." } };
      }
      return cancelAppointmentTool(input.appointmentId);
    case "list_my_prescriptions":
      return listMyPrescriptions(supabase, userId);
    case "list_my_reports":
      return listMyReports(supabase, userId);
    case "list_my_billing":
      return listMyBilling(supabase, userId);
    case "navigate_to":
      return typeof input.section === "string"
        ? navigateTo(input.section)
        : { result: { error: "Missing section." } };
    default:
      return { result: { error: `Unknown tool: ${name}` } };
  }
}
