import { Job } from '../types/job';

const GEN_QWEN_EDIT_2511_TOPIC = process.env.GEN_QWEN_EDIT_2511_TOPIC || 'gen-qwen-edit-2511';

export function buildPhotoSetJobs(baseJob: Partial<Job>, inputs: Partial<Job>[], groupId: string): Job[] {
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
    } as Job;
  });
}
