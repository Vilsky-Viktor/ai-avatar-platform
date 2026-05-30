import { AvatarParameters } from '../types/avatar';
import { IdPhotoSetPaths } from '../types/idPhotoSet';
import { Directions, Flows, ImageGenerator, Job, JobMetadata, JobStatuses, Models, Services } from '../types/job';
import { Ratios } from '../types/ratios';
import uuid from 'uuid';

export const genSyntheticFrontIdPhtotoData = (parameters: AvatarParameters, userId: string, avatarId: string): {imageGenerator: ImageGenerator, metadata: JobMetadata} => {
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

  const ratio = Ratios['1:1'];
  const dimensions = '2048x2048';
  const isFemale = gender === 'female';
  const imageId = uuid.v4();
  const uploadPath = `media/${userId}-user/avatars/${avatarId}-avatar/images/${imageId}.png`

  return {
    imageGenerator: {
      service: Services.imageGenerator,
      prompt: `Front headshot with fully visible head and shoulders in the frame of a ${age}-year-old ${ethnicity} ${gender} with ${skinColor} skin tone, ${attractiveness ? `${attractiveness} appearance, ` : ''}${face} face, ${eyes} eyes with ${eyeLashes} eyelashes and ${eyeBrows} eyebrows, ${nose} nose, ${ears} ears, ${lips} lips, ${facialHair === 'none' ? 'no facial hair' : `with ${facialHair}`}, ${hairColor} hair in ${hairStyle} style, ${body || bustSize ? `with ${body} build${bustSize ? ` and ${bustSize} bust` : ''}, ` : ''}${bodyHair === 'none' ? 'no body hair' : `with ${bodyHair} body hair`}, skin is ${skin} with natural texture. Ultrarealistic and natural, neutral expression. Wearing ${isFemale ? 'white strapless top' : 'white polo with open buttons'}. Gray studio background`,
      negativePrompt: 'cut off shoulders, missing shoulders, cropped head, cut off haircut, cut off hair, cut off head, blurry face, low quality, distorted face, wrong ethnicity, smile, open mouth, teeth visible, makeup, oversaturated, unrealistic skin, plastic skin, head tilt',
      ratio,
      uploadPath,
      status: JobStatuses.pending,
      model: Models.qwen,
      flow: Flows.t2i,
    },
    metadata: { ratio, dimensions }
  }
}

export const genSyntheticIdPhotoData = (parameters: AvatarParameters, userId: string, avatarId: string, idPhotoSet: IdPhotoSetPaths): {
  imageGenerator: ImageGenerator, metadata: JobMetadata, order: number, direction: Directions
}[] => {
  const {
    gender,
    body,
    bustSize,
    bodyHair,
    height
  } = parameters;

  const ratio = Ratios['1:1'];
  const dimensions = '2048x2048';
  const isFemale = gender === 'female';

  return [
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: `Gentle smile showing teeth`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.qwen,
        flow: Flows.ti2i,
      },
      metadata: { ratio, dimensions },
      order: 2,
      direction: Directions.front
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: 'rotated 35 degrees to the left side of the frame',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        horizontalAngle: 45,
        verticalAngle: 0,
        zoom: 5,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.qwen,
        flow: Flows.ia2i,
      },
      metadata: { ratio, dimensions },
      order: 3,
      direction: Directions.right
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: 'rotated 35 degrees to the right side of the frame',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        horizontalAngle: 315,
        verticalAngle: 0,
        zoom: 5,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.qwen,
        flow: Flows.ia2i,
      },
      metadata: { ratio, dimensions },
      order: 4,
      direction: Directions.left
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: 'rotated 90 degrees to the left side of the frame',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        horizontalAngle: 90,
        verticalAngle: 0,
        zoom: 5,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.qwen,
        flow: Flows.ia2i,
      },
      metadata: { ratio, dimensions },
      order: 5,
      direction: Directions.right
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: 'rotated 90 degrees to the right side of the frame',
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        horizontalAngle: 270,
        verticalAngle: 0,
        zoom: 5,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.qwen,
        flow: Flows.ia2i,
      },
      metadata: { ratio, dimensions },
      order: 6,
      direction: Directions.left
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: `Standing full body wearing ${isFemale ? 'white strapless top' : 'white polo with open buttons'}, light gray running shorts and white sneakers. ${body} body type, ${bodyHair !== 'none' ? `${bodyHair} body hair` : 'no body hair'}, ${bustSize} chest, ${height} height.`,
        negativePrompt: '',
        ratio,
        imagePaths: [idPhotoSet.front!],
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.qwen,
        flow: Flows.ti2i,
      },
      metadata: { ratio, dimensions },
      order: 7,
      direction: Directions.front
    }
  ]
}


export const genDigitalTwinIdPhotoData = (parameters: AvatarParameters, userId: string, avatarId: string, idPhotoSet: IdPhotoSetPaths): { 
  imageGenerator: ImageGenerator, metadata: JobMetadata, order: number 
}[] => {
  const { gender } = parameters;

  const ratio = Ratios['1:1'];
  const dimensions = '2048x2048';
  const isFemale = gender === 'female';

  return [
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: `Change outfit to ${isFemale ? 'white strapless top' : 'white polo with open buttons'}. Change background to gray studio background`,
        negativePrompt: 'disproportion, low quality, blurred face, blurry, distorted face, warped facial features, wrong body type, wrong body hair density, another person, changed identity, low resolution, compression artifacts',
        ratio,
        imagePaths: [idPhotoSet.front!],
        safetyTolerance: 2,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.flux,
        flow: Flows.ti2i,
      },
      metadata: { ratio, dimensions },
      order: 1,
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: `Change outfit to ${isFemale ? 'white strapless top' : 'white polo with open buttons'}. Change background to gray studio background`,
        negativePrompt: 'disproportion, low quality, blurred face, blurry, distorted face, warped facial features, wrong body type, wrong body hair density, another person, changed identity, low resolution, compression artifacts',
        ratio,
        imagePaths: [idPhotoSet.frontSmile!],
        safetyTolerance: 2,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.flux,
        flow: Flows.ti2i,
      },
      metadata: { ratio, dimensions },
      order: 2,
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: `Change outfit to ${isFemale ? 'white strapless top' : 'white polo with open buttons'}. Change background to gray studio background`,
        negativePrompt: 'disproportion, low quality, blurred face, blurry, distorted face, warped facial features, wrong body type, wrong body hair density, another person, changed identity, low resolution, compression artifacts',
        ratio,
        imagePaths: [idPhotoSet.rightQuarter!],
        safetyTolerance: 2,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.flux,
        flow: Flows.ti2i,
      },
      metadata: { ratio, dimensions },
      order: 3,
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: `Change outfit to ${isFemale ? 'white strapless top' : 'white polo with open buttons'}. Change background to gray studio background`,
        negativePrompt: 'disproportion, low quality, blurred face, blurry, distorted face, warped facial features, wrong body type, wrong body hair density, another person, changed identity, low resolution, compression artifacts',
        ratio,
        imagePaths: [idPhotoSet.leftQuarter!],
        safetyTolerance: 2,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.flux,
        flow: Flows.ti2i,
      },
      metadata: { ratio, dimensions },
      order: 4,
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: `Change outfit to ${isFemale ? 'white strapless top' : 'white polo with open buttons'}. Change background to gray studio background`,
        negativePrompt: 'disproportion, low quality, blurred face, blurry, distorted face, warped facial features, wrong body type, wrong body hair density, another person, changed identity, low resolution, compression artifacts',
        ratio,
        imagePaths: [idPhotoSet.rightSide!],
        safetyTolerance: 2,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.flux,
        flow: Flows.ti2i,
      },
      metadata: { ratio, dimensions },
      order: 5,
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: `Change outfit to ${isFemale ? 'white strapless top' : 'white polo with open buttons'}. Change background to gray studio background`,
        negativePrompt: 'disproportion, low quality, blurred face, blurry, distorted face, warped facial features, wrong body type, wrong body hair density, another person, changed identity, low resolution, compression artifacts',
        ratio,
        imagePaths: [idPhotoSet.leftSide!],
        safetyTolerance: 2,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.flux,
        flow: Flows.ti2i,
      },
      metadata: { ratio, dimensions },
      order: 6,
    },
    {
      imageGenerator: {
        service: Services.imageGenerator,
        prompt: `Change outfit to ${isFemale ? 'white strapless top' : 'white polo with open buttons'}, light gray running shorts and white sneakers. Change background to gray studio background`,
        negativePrompt: 'disproportion, low quality, blurred face, blurry, distorted face, warped facial features, wrong body type, wrong body hair density, another person, changed identity, low resolution, compression artifacts',
        ratio,
        imagePaths: [idPhotoSet.body!],
        safetyTolerance: 2,
        uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
        status: JobStatuses.pending,
        model: Models.flux,
        flow: Flows.ti2i,
      },
      metadata: { ratio, dimensions },
      order: 7,
    },
  ]
}
