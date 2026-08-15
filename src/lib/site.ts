// No per-request host is reliably available in a server action, so the site
// origin used for links in outbound emails is resolved from env instead:
// an explicit override, falling back to Vercel's auto-populated VERCEL_URL,
// falling back to localhost for local dev.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
