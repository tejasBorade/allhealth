-- Bug fix: on_appointment_change() formatted appointment_at with to_char()
-- with no timezone conversion, which renders in the DB session's default
-- zone (UTC) rather than the clinic's zone — an 11:00 AM IST booking showed
-- up in the notification text as "05:30 AM". Match the app's display
-- convention (REMINDER_TIMEZONE, Asia/Kolkata) by converting before
-- formatting.

create or replace function public.on_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  patient_name text;
  doctor_name text;
  when_text text;
begin
  select full_name into patient_name from public.profiles where id = new.patient_id;
  select full_name into doctor_name from public.profiles where id = new.doctor_id;
  when_text := to_char(new.appointment_at at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM');

  if tg_op = 'INSERT' then
    perform public.notify(
      new.doctor_id, 'appointment_booked', 'New appointment booked',
      coalesce(patient_name, 'A patient') || ' booked an appointment for ' || when_text,
      '/doctor/appointments'
    );
  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    perform public.notify(
      new.patient_id, 'appointment_cancelled', 'Appointment cancelled',
      'Your appointment with Dr. ' || coalesce(doctor_name, '') || ' on ' || when_text || ' was cancelled.',
      '/patient/appointments'
    );
    perform public.notify(
      new.doctor_id, 'appointment_cancelled', 'Appointment cancelled',
      'Appointment with ' || coalesce(patient_name, '') || ' on ' || when_text || ' was cancelled.',
      '/doctor/appointments'
    );
  elsif tg_op = 'UPDATE' and new.status = 'completed' and old.status <> 'completed' then
    perform public.notify(
      new.patient_id, 'appointment_completed', 'Appointment completed',
      'Your appointment with Dr. ' || coalesce(doctor_name, '') || ' is marked completed.',
      '/patient/appointments'
    );
  end if;
  return new;
end;
$$;
