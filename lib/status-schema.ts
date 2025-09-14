import { z } from "zod";

// Allow empty or missing values for all five fields.
const Text = z.string().optional().default("");

export const StatusSchema = z.object({
  summary: Text,
  highlights: Text,
  upcoming_milestones: Text,
  key_decisions: Text,
  risks: Text,
}).strict();

export type ExecStatus = z.infer<typeof StatusSchema>;

