// lib/google/driveExport.ts
import { JWT } from "google-auth-library";

/**
 * Export a Google Doc as HTML using a Service Account.
 * Requirements:
 *  - Enable the Google Drive API on your GCP project.
 *  - Set env vars: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY
 *  - Share the Doc with the Service Account email AS VIEWER, or enable domain-wide delegation and set GOOGLE_IMPERSONATE_SUBJECT.
 */
export async function exportGoogleDocHtmlWithServiceAccount(
  docId: string
): Promise<{ ok: true; html: string } | { ok: false; status?: number; hint?: string }> {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !rawKey) {
    return {
      ok: false,
      status: 401,
      hint:
        "Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY. Either configure them or make the Doc public to 'Anyone with link'.",
    };
  }

  // Handle \n escaping and stray quotes
  const key = rawKey
    .replace(/\\n/g, "\n")
    .replace(/^"([\s\S]*)"$/, "$1"); // strip surrounding quotes if present

  const subject = process.env.GOOGLE_IMPERSONATE_SUBJECT || undefined;

  let jwt: JWT;
  try {
    jwt = new JWT({
      email: clientEmail,
      key,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      subject, // only matters if domain-wide delegation is configured
    });
  } catch (e: any) {
    return { ok: false, status: 401, hint: `Failed to construct JWT: ${String(e?.message || e)}` };
  }

  // Get OAuth access token (NOT ID token)
  let accessToken: string | null = null;
  try {
    const { access_token } = await jwt.authorize();
    accessToken = access_token ?? null;
  } catch (e: any) {
    return {
      ok: false,
      status: 401,
      hint: `JWT authorize failed. Check private key formatting (newlines) and that Drive API is enabled. ${String(
        e?.message || e
      )}`,
    };
  }
  if (!accessToken) {
    return { ok: false, status: 401, hint: "No access token returned by Google." };
  }

  const endpoint = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    docId
  )}/export?mimeType=text/html`;

  const res = await fetch(endpoint, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    let hint = "Ensure the Service Account has access to the Doc and Drive API is enabled.";
    if (res.status === 404) hint = "Doc not found, or SA lacks permission to view it.";
    if (res.status === 403) hint = "Permission denied. Share the Doc with the SA or use domain-wide delegation.";
    if (res.status === 400) hint = "Bad request. Confirm the file is a Google Doc and not another type.";
    return { ok: false, status: res.status, hint };
  }

  const html = await res.text();
  return { ok: true, html };
}

