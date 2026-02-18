export enum JobStatuses {
  pending = 'pending',
  generating = 'generating',
  completed = 'completed',
  error = 'error',
}

export enum JobTypes {
  idPhoto = 'idPhoto',
  photoSet = 'photoSet',
  text2image = 'text2image',
  textImage2image = 'textimage2image'
}

export type JobResult = {
  mediaPath?: string;
  error?: string;
}

export type UpdateJobData = {
  status: JobStatuses;
  result: JobResult;
}