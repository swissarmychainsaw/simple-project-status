// app/api/eml/route.ts
import { NextResponse } from "next/server";
import { buildEmlFromForm, makeEmlFilename } from "@/lib/email/buildEml";

export async function POST(req: Request) {
  const fd = await req.json();
  const eml = await buildEmlFromForm(fd); // now async (for fetching bannerWeb if needed)
  const filename = makeEmlFilename(fd);

  return new NextResponse(eml, {
    status: 200,
    headers: {
      "Content-Type": "message/rfc822",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

