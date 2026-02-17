import { JobTypes, JobStatuses } from "./job";

export type AIModelResult = {
  userId: string;
  avatarId: string;
  jobId: string;
  type: JobTypes;
  status: JobStatuses;
  resultPath: string | null;
  error: string | null;
}