// Hand-authored to match supabase/migrations/*.sql — no Docker available in
// this environment to run `npx supabase gen types typescript --local`.
// Once you have a real project linked, regenerate with that command and
// this file becomes redundant (just re-run it after every migration).
//
// `Relationships: []` on every table means postgrest-js's embedded-select
// type inference (`doctors(profiles(full_name))`) can't resolve nested
// shapes on its own — those call sites cast the result explicitly instead.

export type UserRole = "patient" | "doctor" | "staff" | "admin";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";
export type BillingStatus = "pending" | "paid" | "cancelled";
export type ReminderType = "appointment_24h" | "appointment_1h" | "medication_dose";
export type ReminderStatus = "pending" | "sent" | "failed";
export type ReportStatus = "pending" | "reviewed" | "critical";
export type NotificationType =
  | "appointment_booked"
  | "appointment_cancelled"
  | "appointment_completed"
  | "prescription_created"
  | "medical_record_added"
  | "report_uploaded"
  | "report_reviewed"
  | "report_critical"
  | "message_received"
  | "account_approved"
  | "bill_created"
  | "risk_digest_flagged";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          approved: boolean;
          data_consent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      doctors: {
        Row: {
          profile_id: string;
          specialization: string | null;
          clinic_name: string | null;
          bio: string | null;
          registration_number: string | null;
          qualifications: string | null;
          clinic_address: string | null;
          clinic_phone: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["doctors"]["Row"]> & {
          profile_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["doctors"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "doctors_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          profile_id: string;
          date_of_birth: string | null;
          gender: string | null;
          address: string | null;
          allergies: string | null;
          blood_group: string | null;
          chronic_conditions: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          abha_number: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["patients"]["Row"]> & {
          profile_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "patients_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          appointment_at: string;
          duration_minutes: number;
          status: AppointmentStatus;
          notes: string | null;
          chief_complaint: string | null;
          bp_systolic: number | null;
          bp_diastolic: number | null;
          pulse_bpm: number | null;
          weight_kg: number | null;
          advice: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["appointments"]["Row"]> & {
          patient_id: string;
          doctor_id: string;
          appointment_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      prescriptions: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          appointment_id: string | null;
          prescribed_at: string;
          follow_up_date: string | null;
          diagnosis: string | null;
          notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["prescriptions"]["Row"]> & {
          patient_id: string;
          doctor_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["prescriptions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      prescription_medicines: {
        Row: {
          id: string;
          prescription_id: string;
          medication_name: string;
          dosage: string;
          frequency_code: string;
          duration_days: number;
          start_date: string;
        };
        Insert: Partial<Database["public"]["Tables"]["prescription_medicines"]["Row"]> & {
          prescription_id: string;
          medication_name: string;
          dosage: string;
          frequency_code: string;
          duration_days: number;
        };
        Update: Partial<Database["public"]["Tables"]["prescription_medicines"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "prescription_medicines_prescription_id_fkey";
            columns: ["prescription_id"];
            isOneToOne: false;
            referencedRelation: "prescriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_records: {
        Row: {
          id: string;
          patient_id: string;
          author_id: string;
          record_type: string;
          notes: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["medical_records"]["Row"]> & {
          patient_id: string;
          author_id: string;
          record_type: string;
          notes: string;
        };
        Update: Partial<Database["public"]["Tables"]["medical_records"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "medical_records_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      medical_reports: {
        Row: {
          id: string;
          patient_id: string;
          uploaded_by: string;
          storage_path: string;
          report_type: string;
          status: ReportStatus;
          uploaded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["medical_reports"]["Row"]> & {
          patient_id: string;
          uploaded_by: string;
          storage_path: string;
          report_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["medical_reports"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "medical_reports_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      dose_logs: {
        Row: {
          id: string;
          prescription_medicine_id: string;
          patient_id: string;
          scheduled_for: string;
          taken_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["dose_logs"]["Row"]> & {
          prescription_medicine_id: string;
          patient_id: string;
          scheduled_for: string;
        };
        Update: Partial<Database["public"]["Tables"]["dose_logs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "dose_logs_prescription_medicine_id_fkey";
            columns: ["prescription_medicine_id"];
            isOneToOne: false;
            referencedRelation: "prescription_medicines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dose_logs_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      billing: {
        Row: {
          id: string;
          patient_id: string;
          appointment_id: string | null;
          amount: number;
          status: BillingStatus;
          created_by: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["billing"]["Row"]> & {
          patient_id: string;
          amount: number;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["billing"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "billing_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      reminder_log: {
        Row: {
          id: string;
          reminder_type: ReminderType;
          reference_id: string;
          patient_id: string;
          scheduled_for: string;
          status: ReminderStatus;
          email_to: string | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reminder_log"]["Row"]> & {
          reminder_type: ReminderType;
          reference_id: string;
          patient_id: string;
          scheduled_for: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminder_log"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "reminder_log_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: NotificationType;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          sender_id: string;
          recipient_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      patient_risk_digests: {
        Row: {
          id: string;
          doctor_id: string;
          patient_id: string;
          computed_at: string;
          flagged: boolean;
          adherence_pct_recent: number | null;
          adherence_pct_prior: number | null;
          vitals_flag: boolean;
          vitals_note: string | null;
          summary_text: string | null;
          suggested_action: string | null;
          dismissed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["patient_risk_digests"]["Row"]> & {
          doctor_id: string;
          patient_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["patient_risk_digests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "patient_risk_digests_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "patient_risk_digests_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["profile_id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
