import { InferenceJob } from '../types/job';
import { AVATAR_REFERENCE_NAME } from './trainingPhotoSetCaptions';
import uuid from 'uuid';

const GEN_QWEN_EDIT_2511_TOPIC = process.env.GEN_QWEN_EDIT_2511_TOPIC || 'gen-qwen-edit-2511';

export function buildTrainingPhotoSetJobs(baseJob: Partial<InferenceJob>, inputs: Partial<InferenceJob>[], groupId: string): InferenceJob[] {
  return inputs.map(customInput => {
    const inference = customInput.input?.inference;
    return {
      ...baseJob,
      order: customInput.order,
      maxRuns: customInput.maxRuns ?? baseJob.maxRuns,
      input: customInput.input,
      metadata: customInput.metadata
        ? { ...customInput.metadata, queueTopic: GEN_QWEN_EDIT_2511_TOPIC }
        : baseJob.metadata,
      result: {
        fileName: `${String(customInput.order).padStart(3, '0')}-training-photo-set-${groupId}-${inference?.width}x${inference?.height}.png`,
      },
    } as InferenceJob;
  });
}

export function buildPhotoSetJobs(baseJob: Partial<InferenceJob>, inputs: Partial<InferenceJob>[]): InferenceJob[] {
  return inputs.map(customInput => {
    const name = uuid.v4();
    const inference = customInput.input?.inference;

    const job = {
      ...baseJob,
      order: customInput.order,
      maxRuns: customInput.maxRuns ?? baseJob.maxRuns,
      input: customInput.input,
      metadata: {
        ...(baseJob.metadata ?? {}),
        ...(customInput.metadata ?? {}),
        queueTopic: GEN_QWEN_EDIT_2511_TOPIC,
      },
      result: {
        fileName: `${name}-${inference?.width}x${inference?.height}.png`,
      },
    } as InferenceJob;

    const rawPrompt = customInput.input?.inference.prompt ?? '';
    job.metadata!.userPrompt = rawPrompt.startsWith(`${AVATAR_REFERENCE_NAME} `)
      ? rawPrompt.slice(`${AVATAR_REFERENCE_NAME} `.length)
      : rawPrompt;

    return job
  });
}

