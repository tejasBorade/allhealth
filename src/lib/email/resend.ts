import "server-only";

// Thin wrapper over Resend's REST API via plain fetch, rather than adding
// the `resend` npm package for something this small — matches this repo's
// otherwise dependency-light style (see package.json).
export async function sendReminderEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed: ${response.status} ${body}`);
  }

  return response.json();
}
