-- New notification type for the AI Patient Risk & Adherence Digest feature.
-- A new enum value must land in its own migration, committed before any
-- statement (e.g. the trigger function added next) can reference it.

alter type public.notification_type add value 'risk_digest_flagged';
