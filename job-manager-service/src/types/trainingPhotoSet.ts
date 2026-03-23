import { JobInput } from '../types/job';

export type TrainingPhotoSetInput = Partial<JobInput> & { order: number };

export type IdPhotoSetPaths = {
    microPortrait: string;
    front: string;
    frontSmile: string;
    rightQuarter: string;
    leftQuarter: string;
    rightSide: string;
    leftSide: string;
    body: string;
}
