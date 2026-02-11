import { Request, Response, NextFunction } from 'express';
import { Job, IdPhotoJob, JobTypes, JobStatuses, IdPhotoJobInput } from '../types/job';
import { create as createDb } from '../repositories/job';

const generateIdPhotoPrompt = (input: IdPhotoJobInput): string => {
  const { gender, ethnicity, age, body, face, hairStyle, hairColor, eyes, skin, facialHair } = input;

  const ageDescription = age.toLowerCase().includes('s') 
    ? `${gender} in their ${age}` 
    : `${age} ${gender}`;

  let facialHairPart = '';
  if (gender.toLowerCase() === 'male') {
    facialHairPart = (facialHair && facialHair.toLowerCase() !== 'none' && facialHair.toLowerCase() !== 'clean-shaven')
      ? `Facial hair: ${facialHair},`
      : 'Clean-shaven face,';
  } else {
    facialHairPart = (facialHair && facialHair.toLowerCase() !== 'none')
      ? `Facial hair: ${facialHair},`
      : '';
  }

  return `Extreme high-quality biometric passport ID photo of a ${ethnicity} ${ageDescription}. 
    Physical traits: ${body} build, ${face}-shaped face, ${skin} skin texture with realistic pores. 
    Features: ${eyes} eyes, ${hairStyle} hair in ${hairColor}. ${facialHairPart} 
    Styling: Wearing professional neutral business attire. 
    Technical specs: Frontal headshot, centered composition, looking directly into the camera with a neutral expression. 
    Background: Plain, solid light grey studio background. 
    Lighting: Even soft studio lighting, no shadows on the face, high-resolution 8k photography, shot on 85mm lens, sharp focus, hyper-realistic, unfiltered raw photo.`
    .replace(/\s+/g, ' ')
    .trim();
};

export const createIdPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const idPhotoJob: IdPhotoJob = req.body;

  req.log.info(`Create ID Photo Job for ${headerUserId}`);

  const job: Job = {
    userId: headerUserId as string,
    avatarId: idPhotoJob.avatarId,
    type: JobTypes.idPhoto,
    status: JobStatuses.pending,
    input: { prompt: generateIdPhotoPrompt(idPhotoJob.input) }
  }

  try {
    const jobDB = await createDb(headerUserId as string, job);

    return res.status(201).json(jobDB);
  } catch (error) {
    req.log.info(`Failed to create ID photo job for ${headerUserId}: ${error}`);
    next(error);
  }
};
