import { JobInput } from '../types/job';

export type TrainingPhotoSetPrompts = {
    prompt: string;
    imagePaths: string[];
    maxRuns?: number;
    numSteps?: number;
    guidance?: number;
    similarityThreshold?: number;
    idPhotoPaths?: string[];
    upsamplePromptMode?: string;
    order: number;
};

export type IdPhotoSetPaths = {
    front: string;
    frontSmile: string;
    rightQuarter: string;
    leftQuarter: string;
    rightSide: string;
    leftSide: string;
    bodyFront: string;
}
