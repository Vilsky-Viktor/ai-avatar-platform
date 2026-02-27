import { JobTypes, JobStatuses } from "./job";

export type AIModelResult = {
  userId: string;
  avatarId: string;
  jobId: string;
  type: JobTypes;
  status: JobStatuses;
  mediaPath: string | null;
  similarities: number[];
  maxSimilarity: number;
  numRuns: number;
  error: string | null;
}