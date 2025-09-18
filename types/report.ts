// types/report.ts
export type PlayerKind = "html5" | "sharepoint" | "gdrive" | "unknown";

export type AudioValidated = {
  ok: boolean;
  normalized?: string | null;
  player?: PlayerKind;
  reason?: string | null;
  authLikely?: boolean;
  pageUrl?: string | null;
  playableUrl?: string | null;
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
  highlightsHtml: string;
  risksTitle: string;
  risksSectionTitle: string;
  risksHtml: string;
  resourcesTitle: string;
  resourcesSectionTitle: string;
  resourcesHtml: string;

  // Audio
  audioMp3Url: string;
  audioValidatedUrl: string;
  audioPlayer: PlayerKind;
}

