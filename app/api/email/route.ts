import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    console.log("[v0] Email API called")

    if (!process.env.RESEND_API_KEY) {
      console.log("[v0] Missing RESEND_API_KEY environment variable")
      return NextResponse.json(
        {
          error: "Email service not configured. Please add RESEND_API_KEY environment variable.",
        },
        { status: 500 },
      )
    }

    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { html, subject, to } = await req.json()
    console.log("[v0] Request data:", { htmlLength: html?.length, subject, to })

    if (!html || typeof html !== "string") {
      console.log("[v0] Missing or invalid html")
      return NextResponse.json({ error: "Missing html" }, { status: 400 })
    }

    if (!to || typeof to !== "string") {
      console.log("[v0] Missing or invalid email address")
      return NextResponse.json({ error: "Missing email address" }, { status: 400 })
    }

    const subj = subject && typeof subject === "string" ? subject : "Status Report"

    console.log("[v0] Attempting to send email via Resend")

    const { data, error } = await resend.emails.send({
      from: "Status Reports <onboarding@resend.dev>",
      to,
      subject: subj,
      html,
    })

    console.log("[v0] Resend response:", { data, error })

    if (error) {
      console.log("[v0] Resend error:", error)
      return NextResponse.json({ error: `Email service error: ${String(error)}` }, { status: 502 })
    }

    console.log("[v0] Email sent successfully")
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.log("[v0] API error:", e)
    console.log("[v0] Error stack:", e?.stack)
    return NextResponse.json(
      {
        error: `Server error: ${e?.message ?? "Unknown error"}`,
        details: e?.stack ? e.stack.split("\n")[0] : "No stack trace",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Email API is running",
    hasApiKey: !!process.env.RESEND_API_KEY,
  })
}
