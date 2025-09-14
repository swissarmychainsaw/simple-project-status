import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const raw = cookies().get("gTokens")?.value;
  if (!raw) {
    return NextResponse.json({ ok: false, hasCookie: false });
  }
  try {
    const t = JSON.parse(raw);
    return NextResponse.json({
      ok: true,
      hasCookie: true,
      hasAccessToken: !!t.access_token,
      hasRefreshToken: !!t.refresh_token,
      expiry_date: t.expiry_date ?? null,
    });
  } catch {
    return NextResponse.json({ ok: false, hasCookie: true, parseError: true });
  }
}

