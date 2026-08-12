-- Gap-fill: a printable prescription needs a real letterhead, and Indian
-- prescription law makes this non-optional — under the Drugs and Cosmetics
-- Act a prescription without the doctor's State/NMC registration number is
-- legally void, and NMC's 2020 Telemedicine Practice Guidelines separately
-- require the registration number to be displayed on every e-prescription.
-- Neither the registration number nor formal qualifications were captured
-- anywhere in this app before now.

alter table public.doctors
  add column registration_number text,
  add column qualifications text,
  add column clinic_address text,
  add column clinic_phone text;
