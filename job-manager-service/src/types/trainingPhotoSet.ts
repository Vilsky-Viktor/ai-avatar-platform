import { JobInput } from '../types/job';

export type TrainingPhotoSetInput = {
    prompt: string;
    imagePaths: string[];
    maxRuns?: number;
    numSteps?: number;
    guidance?: number;
    similarityThreshold?: number;
    idPhotoPaths?: string[];
    upsamplePromptMode?: string;
    order: number;
    width?: number;
    height?: number;
    swapFace?: boolean;
};

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
