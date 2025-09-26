// lib/status-form/buildEmailHtml.ts
import { FormData } from "@/components/status-form/context";

/**
 * Build the HTML body of the status email from the current formData.
 * Every section is optional — if empty, we show "No content provided"
 * instead of placeholders like "Your Program/Project Title here."
 */
export default function buildEmailHtml(formData: Partial<FormData>): string {
  const {
    execSummaryHtml,
    highlightsHtml,
    milestonesHtml,
    keyDecisionsHtml,
    risksHtml,
    resourcesHtml,
    optProjectName,
  } = formData;

  const section = (title: string, html?: string) => `
    <h2 style="font-family:sans-serif; margin:16px 0 4px;">${title}</h2>
    <div style="font-family:sans-serif; margin-bottom:16px;">
      ${html && html.trim().length > 0 ? html : "<em>No content provided</em>"}
    </div>
  `;

  return `
    <div style="max-width:700px; margin:auto; padding:20px; font-family:sans-serif;">
      <h1 style="text-align:center; margin-bottom:32px;">
        ${optProjectName || "Project Status Report"}
      </h1>
      ${section("Executive Summary", execSummaryHtml)}
      ${section("Highlights / Accomplishments", highlightsHtml)}
      ${section("Milestones", milestonesHtml)}
      ${section("Key Decisions", keyDecisionsHtml)}
      ${section("Risks & Mitigation Plan", risksHtml)}
      ${section("Resources / Requests", resourcesHtml)}
    </div>
  `;
}

