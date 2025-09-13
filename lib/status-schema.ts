import { z } from "zod";

// Five fields, each as plain text (line breaks preserved by using YAML "|")
export const StatusSchema = z.object({
  summary: z.string().min(1, "summary required"),
  highlights: z.string().min(1, "highlights required"),
  upcoming_milestones: z.string().min(1, "upcoming_milestones required"),
  key_decisions: z.string().min(1, "key_decisions required"),
  risks: z.string().min(1, "risks required"),
}).strict();

export type ExecStatus = z.infer<typeof StatusSchema>;
