-- Gap-fill: a patient-downloadable, doctor-auto-emailed visit report
-- (modeled on a real NMC-compliant outpatient prescription/assessment
-- format) needs vitals + chief complaint + advice captured at the moment
-- a doctor marks a visit complete — none of that existed anywhere before.

alter table public.appointments
  add column chief_complaint text,
  add column bp_systolic int,
  add column bp_diastolic int,
  add column pulse_bpm int,
  add column weight_kg numeric(5, 2),
  add column advice text;
