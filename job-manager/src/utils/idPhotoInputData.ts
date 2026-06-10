import { AvatarParameters, Platforms, AiModelGateway, JobMetadata, JobStatuses, Models, Services, ImageRatios, HeadDirectionChecker, Directions, FaceMatcher } from '@loom24/shared/types';
import { IdPhotoSetPaths } from '../types/idPhotoSet';
import uuid from 'uuid';

export const genSyntheticFrontIdPhtotoData = (parameters: AvatarParameters, userId: string, avatarId: string): {
  imageGenerator: AiModelGateway
} => {
  const {
    gender,
    attractiveness,
    ethnicity,
    skinColor,
    age,
    body,
    bustSize,
    face,
    hairStyle,
    hairColor,
    ears,
    nose,
    eyes,
    eyeLashes,
    eyeBrows,
    lips,
    skin,
    facialHair,
    bodyHair,
  } = parameters;

  const ratio = ImageRatios['1:1'];
  const isFemale = gender === 'female';
  const imageId = uuid.v4();
  const uploadPath = `media/${userId}-user/avatars/${avatarId}-avatar/images/${imageId}.png`

  return {
    imageGenerator: {
      prompt: `Front headshot with fully visible head and shoulders in the frame of a ${age}-year-old ${ethnicity} ${gender} with ${skinColor} skin tone, ${attractiveness ? `${attractiveness} appearance, ` : ''}${face} face, ${eyes} eyes with ${eyeLashes} eyelashes and ${eyeBrows} eyebrows, ${nose} nose, ${ears} ears, ${lips} lips, ${facialHair === 'none' ? 'no facial hair' : `with ${facialHair}`}, ${hairColor} hair in ${hairStyle} style, ${body || bustSize ? `with ${body} build${bustSize ? ` and ${bustSize} bust` : ''}, ` : ''}${bodyHair === 'none' ? 'no body hair' : `with ${bodyHair} body hair`}, skin is ${skin} with natural texture. Ultrarealistic and natural, neutral expression. Wearing ${isFemale ? 'white strapless top' : 'white polo with open buttons'}. Gray studio background`,
      negativePrompt: '',
      ratio,
      uploadPath,
      status: JobStatuses.pending,
      model: Models.geminiImage3Pro,
      platform: Platforms.google,
      temperature: 1.0,
      imagePaths: [],
      service: Services.aiModelGateway
    }
  }
}

export const genSyntheticIdPhotoData = (parameters: AvatarParameters, userId: string, avatarId: string, idPhotoSet: IdPhotoSetPaths): {
  imageGenerator: AiModelGateway, headDirectionChecker: HeadDirectionChecker, order: number
}[] => {
  const {
    gender,
    body,
    bustSize,
    bodyHair,
    height
  } = parameters;

  const ratio = ImageRatios['1:1'];
  const isFemale = gender === 'female';

  const imagePaths = Array.from({ length: 6 }, () => `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`);

  return [
    {
      imageGenerator: {
        prompt: `Gentle smile showing teeth. Preserve the exact same identity from image 1. Gray studio background.`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        uploadPath: imagePaths[0],
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        temperature: 0,
        service: Services.aiModelGateway
      },
      headDirectionChecker: {
        service: Services.headDirectionChecker,
        status: JobStatuses.pending,
        imagePath: imagePaths[0],
        direction: Directions.front
      },
      order: 2,
    },
    {
      imageGenerator: {
        prompt: 'Rotate the entire person 45 degrees to the left to create a pure three-quarter view. Preserve the exact same identity from image 1. The head, eyes, and gaze must follow the body — do not turn the face back toward the camera. Subject should be looking in the same direction the body is facing. Gray studio background',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        uploadPath: imagePaths[1],
        temperature: 0,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      headDirectionChecker: {
        service: Services.headDirectionChecker,
        status: JobStatuses.pending,
        imagePath: imagePaths[1],
        direction: Directions.leftQuarter
      },
      order: 3,
    },
    {
      imageGenerator: {
        prompt: 'Rotate the entire person 45 degrees to the right to create a pure three-quarter view. Preserve the exact same identity from image 1. The head, eyes, and gaze must follow the body — do not turn the face back toward the camera. Subject should be looking in the same direction the body is facing. Gray studio background',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        temperature: 0,
        uploadPath: imagePaths[2],
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      headDirectionChecker: {
        service: Services.headDirectionChecker,
        status: JobStatuses.pending,
        imagePath: imagePaths[2],
        direction: Directions.rightQuarter
      },
      order: 4,
    },
    {
      imageGenerator: {
        prompt: 'rotate person 90 degrees to the left to create a pure side profile view. Preserve the exact same identity from image 1. Gray studio background',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        temperature: 0,
        uploadPath: imagePaths[3],
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      headDirectionChecker: {
        service: Services.headDirectionChecker,
        status: JobStatuses.pending,
        imagePath: imagePaths[3],
        direction: Directions.leftSide
      },
      order: 5,
    },
    {
      imageGenerator: {
        prompt: 'rotate person 90 degrees to the right to create a pure side profile view. Preserve the exact same identity from image 1. Gray studio background',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        temperature: 0,
        uploadPath: imagePaths[4],
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      headDirectionChecker: {
        service: Services.headDirectionChecker,
        status: JobStatuses.pending,
        imagePath: imagePaths[4],
        direction: Directions.rightSide
      },
      order: 6,
    },
    {
      imageGenerator: {
        prompt: `Standing full body wearing ${isFemale ? 'white strapless top' : 'white polo with open buttons'}, light gray running shorts and white sneakers. ${body} body type, ${bodyHair !== 'none' ? `${bodyHair} body hair` : 'no body hair'}, ${bustSize} chest, ${height} height. Preserve the exact same identity from image 1. Gray studio background`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        temperature: 0,
        uploadPath: imagePaths[5],
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      headDirectionChecker: {
        service: Services.headDirectionChecker,
        status: JobStatuses.pending,
        imagePath: imagePaths[5],
        direction: Directions.front
      },
      order: 7,
    }
  ]
}
