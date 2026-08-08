import "server-only";

/**
 * True only when the request's Authorization header exactly matches
 * `Bearer ${CRON_SECRET}` and CRON_SECRET is actually set. An unset
 * CRON_SECRET is treated as "unauthorized", never as "no check needed".
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
