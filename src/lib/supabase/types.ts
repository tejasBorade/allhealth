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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
