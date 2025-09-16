import type { DesignOptionsProfile, BannerKey } from "@/components/status-form/projectProfiles";

export type ReportKind =
  | "weekly" | "monthly" | "quarterly"
  | "program" | "project" | "ops" | "exec" | "incident";

export type DesignOptions = DesignOptionsProfile & {
  optReportKind: ReportKind;
};

export interface FormData {
  programTitle: string;
  programSummary: string;
  asOf: string;
  lastStatus: string;
  currentStatus: string;
  trending: string;
  tpm: string;
  engDri: string;
  bizSponsor: string;
  engSponsor: string;
  execSummaryTitle: string;
  highlightsTitle: string;
  execSummary: string;
  lowlights: string;
  highlightsHtml: string;
  updatesTrack: string;
  updatesTeam: string;
  updatesHtml: string;
  sectionTitle: string;
  emailTo: string;
  updatesTitle: string;
  milestonesTitle: string;
  milestonesSectionTitle: string;
  milestonesHtml: string;
  keyDecisionsTitle: string;
  keyDecisionsSectionTitle: string;
  keyDecisionsHtml: string;
  risksTitle: string;
  risksSectionTitle: string;
  risksHtml: string;
  resourcesTitle: string;
  resourcesSectionTitle: string;
  resourcesHtml: string;
  audioMp3Url: string;
}

export const EMAIL_MAX_WIDTH = 900;

