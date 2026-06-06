import { AvatarParameters, Platforms, AiModelGateway, JobMetadata, JobStatuses, Models, Services, ImageRatios } from '@loom24/shared/types';
import { IdPhotoSetPaths } from '../types/idPhotoSet';
import uuid from 'uuid';

export const genSyntheticFrontIdPhtotoData = (parameters: AvatarParameters, userId: string, avatarId: string): {
  imageGenerator: AiModelGateway, metadata: JobMetadata
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
  const dimensions = '2048x2048';
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
    },
    metadata: { ratio, dimensions }
  }
}

export const genSyntheticIdPhotoData = (parameters: AvatarParameters, userId: string, avatarId: string, idPhotoSet: IdPhotoSetPaths): {
  imageGenerator: AiModelGateway, metadata: JobMetadata, order: number
}[] => {
  const {
    gender,
    body,
    bustSize,
    bodyHair,
    height
  } = parameters;

  const ratio = ImageRatios['1:1'];
  const dimensions = '2048x2048';
  const isFemale = gender === 'female';

  return [
    {
      imageGenerator: {
        prompt: `Gentle smile showing teeth`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        temperature: 1.0,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 2,
    },
    {
      imageGenerator: {
        prompt: 'rotate person 45 degrees to the left to create a three-quarter view',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        temperature: 1.0,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 3,
    },
    {
      imageGenerator: {
        prompt: 'rotate person 45 degrees to the right to create a three-quarter view',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        temperature: 1.0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 4,
    },
    {
      imageGenerator: {
        prompt: 'rotate person 90 degrees to the left to create a side profile view',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        temperature: 1.0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 5,
    },
    {
      imageGenerator: {
        prompt: 'rotate person 90 degrees to the right to create a side profile view',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        temperature: 1.0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 6,
    },
    {
      imageGenerator: {
        prompt: `Standing full body wearing ${isFemale ? 'white strapless top' : 'white polo with open buttons'}, light gray running shorts and white sneakers. ${body} body type, ${bodyHair !== 'none' ? `${bodyHair} body hair` : 'no body hair'}, ${bustSize} chest, ${height} height.`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        temperature: 1.0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 7,
    }
  ]
}


export const genDigitalTwinIdPhotoData = (parameters: AvatarParameters, userId: string, avatarId: string, idPhotoSet: IdPhotoSetPaths): { 
  imageGenerator: AiModelGateway, metadata: JobMetadata, order: number 
}[] => {
  const ratio = ImageRatios['1:1'];
  const dimensions = '2048x2048';

  const uuids = Array.from({ length: 7 }, () => uuid.v4());

  return [
    {
      imageGenerator: {
        prompt: `Change background to gray studio background`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        temperature: 0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuids[0]}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 1,
    },
    {
      imageGenerator: {
        prompt: `Change background to gray studio background`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.frontSmile!],
        temperature: 0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuids[1]}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 2,
    },
    {
      imageGenerator: {
        prompt: `Change background to gray studio background`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.leftQuarter!],
        temperature: 0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuids[2]}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 3,
    },
    {
      imageGenerator: {
        prompt: `Change background to gray studio background`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.rightQuarter!],
        temperature: 0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuids[3]}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 4,
    },
    {
      imageGenerator: {
        prompt: `Change background to gray studio background`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.leftSide!],
        temperature: 0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuids[4]}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 5,
    },
    {
      imageGenerator: {
        prompt: `Change background to gray studio background`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.rightSide!],
        temperature: 0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuids[5]}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 6,
    },
    {
      imageGenerator: {
        prompt: `Change background to gray studio background`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.body!],
        temperature: 0,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuids[6]}.png`,
        status: JobStatuses.pending,
        model: Models.geminiImage3Pro,
        platform: Platforms.google,
        service: Services.aiModelGateway
      },
      metadata: { ratio, dimensions },
      order: 7,
    },
  ]
}
