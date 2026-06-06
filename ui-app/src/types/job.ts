import type { FirestoreTimestamp } from "./firestore";

export {
  Views,
  ShotTypes,
  MediaTypes,
  JobTargets,
  JobStatuses,
  Directions,
  Platforms,
  Models,
  Services,
} from '@loom24/shared/types';

export type {
  PhotoSetType,
  IdPhotoJobRequest,
  PhotoJobRequest,
  VideoJobRequest,
  MimicMotionRequest,
  AudioJobRequest,
  PhotoSetJobRequest,
  JobMetadata,
  StepBase,
  AiModelGateway,
  FaceMatcher,
  HeadDirectionChecker,
  WorkflowStep,
} from '@loom24/shared/types';

import type { WorkflowStep, JobStatuses, MediaTypes, JobTargets, JobMetadata } from '@loom24/shared/types';

export type Job = {
  id?: string;
  groupId?: string;
  userId: string;
  avatarId: string;
  mediaType: MediaTypes;
  target: JobTargets;
  status?: JobStatuses;
  curRun: number;
  maxRuns: number;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  order?: number;
  workflow: WorkflowStep[];
  metadata?: JobMetadata;
  resultMediaPath: string;
}
