import { AvatarParameters, AvatarGender, AvatarTypes } from '../types/avatar';
import { IdPhotoSetPaths, ImagePaths } from '../types/trainingPhotoSet';
import { Job, FaceExpressionTypes, Directions } from '../types/job';
import imageRatios from '../types/imageRatios';

export const AVATAR_REFERENCE_NAME = '<avatarlife>';

export const genTrainingSyntheticIdPhotoData = (parameters: AvatarParameters, idPhotoSet: IdPhotoSetPaths): Partial<Job>[] => {
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
    height
  } = parameters;

  const squareRatio = imageRatios.qwenEdit2511['1:1'];
  const verticalRatio = imageRatios.qwenEdit2511['9:16'];
  const isFemale = gender === 'female';

  return [
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front headshot with fully visible head and shoulders in the frame of a ${age}-year-old ${ethnicity} ${gender} with ${skinColor} skin tone, ${attractiveness ? `${attractiveness} appearance, ` : ''}${face} face, ${eyes} eyes with ${eyeLashes} eyelashes and ${eyeBrows} eyebrows, ${nose} nose, ${ears} ears, ${lips} lips, ${facialHair === 'none' ? 'clean-shaven, no facial hair' : `with ${facialHair}`}, ${hairColor} hair in ${hairStyle} style, ${body || bustSize ? `with ${body} build${bustSize ? ` and ${bustSize} bust` : ''}, ` : ''}${bodyHair === 'none' ? 'no body hair' : `with ${bodyHair} body hair`}, skin is ${skin} with highly detailed realistic skin. Wearing ${isFemale ? 'white strapless top' : 'white sleeveless shirt with top undone buttons'}. Direct eye contact looking straight at the camera, completely neutral expression, natural eyes, relaxed completely closed mouth without smile. Gray concrete color wall. Even soft diffused studio light. Sharp focus on face and facial details. Hyperrealistic, ultrarealistic photo`,
          negativePrompt: 'cut off shoulders, missing shoulders, cropped head, cut off haircut, cut off hair, cut off head, blurry face, low quality, distorted face, wrong ethnicity, smile, open mouth, teeth visible, makeup, oversaturated, unrealistic skin, plastic skin, head tilt',
          mediaPaths: [],
          numSteps: 40,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 4.0,
        },
        faceRecognition: { enabled: false},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Hyper-Realistic-Portrait", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 1,
      order: 1,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Exact same person from input images. Gentle smile showing teeth. Change outfit to dark gray sleeveless t-shirt`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { min: 0.7 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 2,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `<sks> front-right quarter view eye-level shot close-up. Pure 45 degree quarter view. Facing left side of the frame, nose pointing left side of the frame. Exact same person from input images. Change outfit to dark blue t-shirt`,
          mediaPaths: [idPhotoSet.generated.front!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.right }, 
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { min: 0.65 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '45:0', shotType: 'rightQuarterCloseUpView' },
      maxRuns: 7,
      order: 3,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `<sks> front-left quarter view eye-level shot close-up. Pure 45 degree quarter view. Facing right side of the frame, nose pointing right side of the frame. Exact same person from input images. Change outfit to dark green t-shirt`,
          mediaPaths: [idPhotoSet.generated.front!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.left }, 
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { min: 0.65 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '45:0', shotType: 'leftQuarterCloseUpView' },
      maxRuns: 7,
      order: 4,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `<sks> right side view eye-level shot close-up. Pure 85 degree side view. Facing left side of the frame, nose pointing left side of the frame. Exact same person from input images. Change outfit to dark red t-shirt`,
          mediaPaths: [idPhotoSet.generated.rightQuarter!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.right }, 
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.rightQuarter!], threshold: { min: 0.65 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '90:0', shotType: 'rightSideCloseUpView' },
      maxRuns: 7,
      order: 5,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `<sks> left side view eye-level shot close-up. Pure 85 degree side view. Facing right side of the frame, nose pointing right side of the frame. Exact same person from input images. Change outfit to dark brown t-shirt`,
          mediaPaths: [idPhotoSet.generated.leftQuarter!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.left }, 
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.leftQuarter!], threshold: { min: 0.65 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '90:0', shotType: 'leftSideCloseUpView' },
      maxRuns: 7,
      order: 6,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `<sks> back view eye-level shot close-up. Keep exact body and head shapes from image 1. Pure 180 degree rear view of the person from input images. Exact same person from input images. Without hair accessories`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: false},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '180:0', shotType: 'RearCloseUpView' },
      maxRuns: 1,
      order: 7,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Tight crop around the head including haircut, face fills 90% of the frame, no neck, no shoulders visible. Cut off shoulders and neck out of the frame`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { min: 0.9 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'FrontExtremeCloseUpView' },
      maxRuns: 5,
      order: 8,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front full body of subject in input images. Natural body to head proportions from image 1, head is one-seventh of total body height. ${bodyHair !== 'none' ? `${bodyHair} body hair` : 'No body hair'}. ${body} body type. ${bustSize} chest. ${height} height. Wearing ${isFemale ? 'white running shorts and white strapless top' : 'white running shorts, white sleeveless shirt with all undone buttons showing chest and abdomen'}, barefoot, without shoes. Light wooden floor`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: verticalRatio[0], 
          height: verticalRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { min: 0.8 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`, ratio: '9:16', angle: '0:0', shotType: 'FrontFullBodyView'},
      maxRuns: 5,
      order: 9,
    },
  ]
}

export const genTrainingTwinIdPhotoData = (parameters: AvatarParameters, idPhotoSet: IdPhotoSetPaths): Partial<Job>[] => {
  const { gender, height, body, bodyHair, bustSize } = parameters;

  const squareRatio = imageRatios.qwenEdit2511['1:1'];
  const verticalRatio = imageRatios.qwenEdit2511['9:16'];
  const isFemale = gender === 'female';

  return [
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Exact same person from input images. Change outfit to ${isFemale ? 'white strapless top' : 'white sleeveless shirt with top undone buttons'}. ${bodyHair !== 'none' ? `${bodyHair} body hair` : 'No body hair'}. Change background to gray concrete color wall. Change lighting to soft diffused daylight`,
          mediaPaths: [idPhotoSet.uploaded.front!, idPhotoSet.uploaded.front!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.uploaded.front!], threshold: { min: 0.96 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 1,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Exact same person from input images. Change outfit to dark gray sleeveless t-shirt. Change background to gray concrete color wall. Change lighting to soft diffused daylight`,
          mediaPaths: [idPhotoSet.uploaded.frontSmile!, idPhotoSet.uploaded.frontSmile!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.uploaded.frontSmile!], threshold: { min: 0.96 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 2,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `<sks> front-right quarter view eye-level shot close-up. Pure 45 degree quarter view. Facing left side of the frame, nose pointing left side of the frame. Exact same person from input images. Change outfit to dark blue t-shirt. Change background to gray concrete color wall. Change lighting to soft diffused daylight`,
          mediaPaths: [idPhotoSet.uploaded.rightQuarter!, idPhotoSet.uploaded.rightQuarter!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.right },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.uploaded.rightQuarter!], threshold: { min: 0.95 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '45:0', shotType: 'rightQuarterCloseUpView' },
      maxRuns: 5,
      order: 3,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `<sks> front-left quarter view eye-level shot close-up. Pure 45 degree quarter view. Facing right side of the frame, nose pointing right side of the frame. Exact same person from input images. Change outfit to dark green t-shirt. Change background to gray concrete color wall. Change lighting to soft diffused daylight`,
          mediaPaths: [idPhotoSet.uploaded.leftQuarter!, idPhotoSet.uploaded.leftQuarter!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.left },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.uploaded.leftQuarter!], threshold: { min: 0.95 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '45:0', shotType: 'leftQuarterCloseUpView' },
      maxRuns: 5,
      order: 4,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `<sks> right side view eye-level shot close-up. Pure 80 degree side view. Facing left side of the frame, nose pointing left side of the frame. Exact same person from input images. Change outfit to dark red t-shirt`,
          mediaPaths: [idPhotoSet.generated.rightQuarter!, idPhotoSet.generated.rightQuarter!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.right },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.rightQuarter!], threshold: { min: 0.87 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '90:0', shotType: 'rightSideCloseUpView' },
      maxRuns: 7,
      order: 5,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `<sks> left side view eye-level shot close-up. Pure 80 degree side view. Facing right side of the frame, nose pointing right side of the frame. Exact same person from input images. Change outfit to dark brown t-shirt`,
          mediaPaths: [idPhotoSet.generated.leftQuarter!, idPhotoSet.generated.leftQuarter!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.left },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.leftQuarter!], threshold: { min: 0.87 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '90:0', shotType: 'leftSideCloseUpView' },
      maxRuns: 7,
      order: 6,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `<sks> back view eye-level shot close-up. Keep exact body and head shapes from image 1. Pure 180 degree rear view of the person from input images. Exact same person from input images. No hair accessories`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: false},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '180:0', shotType: 'RearCloseUpView' },
      maxRuns: 1,
      order: 7,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Tight crop around the head including haircut, face fills 90% of the frame, no neck, no shoulders visible. Cut off shoulders and neck out of the frame. Change background to gray concrete color wall. Change lighting to soft diffused daylight`,
          mediaPaths: [idPhotoSet.uploaded.front!, idPhotoSet.uploaded.front!],
          numSteps: 8,
          width: squareRatio[0], 
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.uploaded.front!], threshold: { min: 0.96 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'FrontExtremeCloseUpView' },
      maxRuns: 5,
      order: 8,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front full body of subject in input images. Natural body to head proportions from image 1, head is one-seventh of total body height. ${bodyHair !== 'none' ? `${bodyHair} body hair` : 'No body hair'}. ${body} body type. ${bustSize} chest. ${height} height. Wearing ${isFemale ? 'white running shorts and white strapless top' : 'white running shorts, white sleeveless shirt with all undone buttons showing chest and abdomen'}, barefoot, no shoes. Change background to gray concrete color wall, light wooden floor. Change lighting to soft diffused daylight`,
          mediaPaths: [idPhotoSet.uploaded.front!, idPhotoSet.uploaded.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: verticalRatio[0], 
          height: verticalRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.uploaded.front!, idPhotoSet.generated.front!], threshold: { min: 0.9, max: 0.925 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 0.7 },
        ],
      },
      metadata: { dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`, ratio: '9:16', angle: '0:0', shotType: 'FrontFullBodyView'},
      maxRuns: 7,
      order: 9,
    },
  ]
}

export const generateTrainingPhotoSetData = (parameters: AvatarParameters, avatarType: AvatarTypes, idPhotoSet: IdPhotoSetPaths): Partial<Job>[] => {
  const { gender } = parameters;

  const squareRatio = imageRatios.qwenEdit2511['1:1'];
  const portraitRatio = imageRatios.qwenEdit2511['3:4'];
  const verticalRatio = imageRatios.qwenEdit2511['9:16'];

  const isFemale = gender === 'female';

  const emotionNumFrontRepetitions = avatarType === AvatarTypes.twin ? 3 : 2;

  return [
    // =================================================================
    // CLOSE-UP EMOTIONS
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to deep slate blue sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.sad, scale: 0.9 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { 
          min: AvatarTypes.twin ? 0.9 : 0.8, 
          max: 0.96 
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 10,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to crimson red sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.angry, scale: 0.65 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { 
          min: AvatarTypes.twin ? 0.88 : 0.8, 
          max: 0.96 
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 11,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to warm peach sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.happy, scale: 0.6 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { 
          min: AvatarTypes.twin ? 0.95 : 0.8, 
          max: 0.96 
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 12,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to bright yellow sleeveless t-shirt. Exact same teeth from input images`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.frontSmile),
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.happy, scale: 0.85 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.frontSmile!], threshold: { 
          min: AvatarTypes.twin ? 0.94 : 0.9, 
          max: 0.96 
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 13,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to electric teal sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.surprised, scale: 0.57 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { 
          min: AvatarTypes.twin ? 0.92 : 0.9, 
          max: 0.96 
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 14,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to burnt orange sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.anxious, scale: 0.7 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { 
          min: AvatarTypes.twin ? 0.89 : 0.85, 
          max: 0.96 
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 15,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to soft rose sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.shy, scale: 0.7 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { 
          min: AvatarTypes.twin ? 0.92 : 0.8, 
          max: 0.96 
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 16,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to dusty lavender sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.sleepy, scale: 0.65 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { 
          min: AvatarTypes.twin ? 0.92 : 0.85, 
          max: 0.96 
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 17,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to dark violet sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.fear, scale: 0.6 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { 
          min: AvatarTypes.twin ? 0.89 : 0.8, 
          max: 0.96 
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 18,
    },

    // =================================================================
    // BEST chest-up PORTRAITS (most diverse lighting/outfit combos)
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front chest-up portrait. Change outfit to ${isFemale ? 'a soft beige cashmere turtleneck sweater' : 'an olive green henley shirt'}. Change background to indoor cozy living room, softly blurred. Change light to warm natural window light from the front-right, soft shadows on right side`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!],
          threshold: { min: AvatarTypes.twin ? 0.94 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: AvatarTypes.twin ? 0.5 : 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 }
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontChestUpView',
      },
      maxRuns: 5,
      order: 19,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front chest-up portrait. Change outfit to ${isFemale ? 'flowy sage green midi dress with subtle puff sleeves' : 'khaki light jaket with white tee'}. Change background to outdoor park. Change light to soft golden hour`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!],
          threshold: { min: AvatarTypes.twin ? 0.94 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: AvatarTypes.twin ? 0.5 : 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 }
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontChestUpView',
      },
      maxRuns: 5,
      order: 20,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front chest-up portrait. Change outfit to ${isFemale ? 'a silky emerald green camisole with delicate straps' : 'a fitted black turtleneck under a charcoal overcoat'}. Change background to blurred rooftop city night background. Change light to evening warm tungsten light`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!],
          threshold: { min: AvatarTypes.twin ? 0.94 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: AvatarTypes.twin ? 0.5 : 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 }
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontChestUpView',
      },
      maxRuns: 5,
      order: 21,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front chest-up portrait. Deep in thought, pensive expression, gaze directed upward. Change outfit to ${isFemale ? 'a chunky cream cable-knit sweater' : 'a soft taupe merino wool crewneck'}. Change background to cozy living room setting. Change light to soft warm candlelight`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!],
          threshold: { min: AvatarTypes.twin ? 0.94 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: AvatarTypes.twin ? 0.5 : 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 }
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontChestUpView',
      },
      maxRuns: 5,
      order: 22,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front chest-up portrait. Confident expression, direct stare to camera, relaxed jaw, lips lightly pressed together. Change outfit to ${isFemale ? 'a tailored pale blue Oxford shirt' : 'a modern business casual light gray button-down with micro-check pattern, light blue tie'}. Change background to modern indoor office environment. Change light to white bright office lighting`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!],
          threshold: { min: AvatarTypes.twin ? 0.94 : 0.9 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: AvatarTypes.twin ? 0.5 : 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 }
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontChestUpView',
      },
      maxRuns: 5,
      order: 23,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front chest-up portrait. Change outfit to fitted dark charcoal turtleneck. Change background to deep dark studio background. Change light to soft low-key light from the front-left, gently illuminating the face with natural shadow falloff toward the right side and edges`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!],
          threshold: { min: 0.88 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: AvatarTypes.twin ? 0.5 : 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 }
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontChestUpView',
      },
      maxRuns: 7,
      order: 24,
    },
    
    // =================================================================
    // CHEST-UP ANGULAR & DYNAMIC HEAD COVERAGE
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Quarter chest-up portrait, shoulders on the edge of the frame. Change outfit to ${isFemale ? 'a cozy oversized oatmeal cardigan' : 'a soft gray zip-up hoodie'}. Change background to loft style living room interior. Change light to soft indoor lamp light`,
          mediaPaths: [idPhotoSet.generated.rightQuarter!, idPhotoSet.generated.rightQuarter!, idPhotoSet.generated.rightQuarter!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.right },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.rightQuarter!],
          threshold: { min: AvatarTypes.twin ? 0.94 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '45:0',
        shotType: 'leftQuarterChestUpView',
      },
      maxRuns: 5,
      order: 25,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Quarter chest-up portrait, shoulders on the edge of the frame. Change outfit to ${isFemale ? 'a relaxed beige trench coat over a cream turtleneck' : 'a camel overcoat layered over a white crewneck'}. Change background to indoor cafe with a bar. Change light to soft natural daylight from ceiling to floor windows on the right`,
          mediaPaths: [idPhotoSet.generated.leftQuarter!, idPhotoSet.generated.leftQuarter!, idPhotoSet.generated.leftQuarter!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.left },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.leftQuarter!],
          threshold: { min: AvatarTypes.twin ? 0.94 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '45:0',
        shotType: 'leftQuarterChestUpView',
      },
      maxRuns: 5,
      order: 26,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Side chest-up portrait, nose tip at mid-frame vertically. Change outfit to ${isFemale ? 'a light pink windbreaker' : 'a light blue windbreaker'}. Change background to urban street. Change light to very early evening`,
          mediaPaths: [idPhotoSet.generated.rightSide!, idPhotoSet.generated.rightSide!, idPhotoSet.generated.rightSide!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.right },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.rightSide!],
          threshold: { min: AvatarTypes.twin ? 0.92 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '90:0',
        shotType: 'rightSideChestUpView',
      },
      maxRuns: 7,
      order: 27,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Side chest-up portrait, nose tip at mid-frame vertically. Change outfit to ${isFemale ? 'a metallic silver cropped jacket' : 'a sleek black puffer vest over hoodie'}. Change background to urban street. Change light to very early evening`,
          mediaPaths: [idPhotoSet.generated.leftSide!, idPhotoSet.generated.leftSide!, idPhotoSet.generated.leftSide!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.left },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.leftSide!],
          threshold: { min: AvatarTypes.twin ? 0.92 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '90:0',
        shotType: 'leftSideChestUpView',
      },
      maxRuns: 7,
      order: 28,
    },

    // =================================================================
    // UPPER-BODY SHOTS
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Waist-up portrait, sitting at the work desk, looking towards camera. Change outfit to ${isFemale ? 'a tailored pinstripe blazer in soft gray over white tee and pants' : 'a modern slim-fit navy blazer with white dress shirt and navy pants'}. Change background to co-working space background with people working, gray cement walls style, industrial aesthetic, wooden minimalist desk and Apple Mackbook on it on the left side. Change light to office bright white light`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.93 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontUpperBodyView',
      },
      maxRuns: 5,
      order: 29,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Waist-up portrait, standing casually. Change outfit to ${isFemale ? 'black racing-style crop jacket, gray crop top underneath' : 'black racing jacket with subtle contrast stitching, clean gray t-shirt underneath'}. Change background to garage with a fleet of luxury mix of sport and business cars. Change light to parking indoor lighting`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.93 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontUpperBodyView',
      },
      maxRuns: 5,
      order: 30,
    },

    // =================================================================
    // FULL-BODY & EXTREME POSES (maximum pose/lighting/clothing diversity)
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Walking. Change outfit to ${isFemale ? 'a short black cocktail dress with spaghetti straps, high heels' : 'a charcoal suit with white dress shirt, no tie, loafers'}. Change background to sidewalk background. Change light to overcast daylight`,
          mediaPaths: [idPhotoSet.generated.body!, idPhotoSet.generated.body!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: verticalRatio[0], 
          height: verticalRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.body!, idPhotoSet.generated.front!],
          threshold: { min: AvatarTypes.twin ? 0.9 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
        ratio: '9:16',
        angle: '0:0',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 31,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Deep squat, arms resting on knees. Change outfit to ${isFemale ? 'flowy taupe linen wide-leg trousers, tucked olive green relaxed linen top' : 'taupe linen trousers, olive green relaxed linen shirt'} and black sandals. Change background to outdoor nature. Change light to soft diffused daylight`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.body!, idPhotoSet.generated.front!],
          threshold: { min: AvatarTypes.twin ? 0.92 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 32,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Sitting, hands on sides supporting body. Change outfit to ${isFemale ? 'pink fitted racerback crop tank top, light gray fleece sweat shorts with elastic waistband' : 'relaxed gray joggers, white t-shirt'}. Change background to king size bed in the hotel room. Change light to simple hotel interior soft light`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.92 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 33,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Standing. Change outfit to ${isFemale ? 'a breezy floral sundress' : 'red shorts and sleeveless black t-shirt'}, barefoot. Change background to beach sand and ocean. Change light to soft golden hour`,
          mediaPaths: [idPhotoSet.generated.body!, idPhotoSet.generated.body!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: verticalRatio[0], 
          height: verticalRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.91 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
        ratio: '9:16',
        angle: '0:0',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 34,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Sitting, direct stare to camera, one knee bent upwards. Change outfit to ${isFemale ? 'a breezy yellow floral wrap midi dress with short puff sleeves and v-neckline' : 'pastel yellow shorts and hawaiian shirt'}, barefoot. Change background to lounge chair on the beach. Change light to soft daylight`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.92 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 35,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Jogging towards camera. Change outfit to ${isFemale ? 'a breezy white cover-up dress' : 'lightweight linen shorts and sleeveless white t-shirt'}, barefoot. Change background to tropical path. Change light to soft daylight`,
          mediaPaths: [idPhotoSet.generated.body!, idPhotoSet.generated.body!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: verticalRatio[0], 
          height: verticalRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.92 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
        ratio: '9:16',
        angle: '0:0',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 36,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Sitting cross-legged, relaxed pose. Change outfit to ${isFemale ? 'flowy boho pants in terracotta and cropped top' : 'relaxed-fit dark green cargo shorts and gray tee'}, flip flops. Change background to park grass. Change light to early morning`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.92 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 37,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front view standing, leaning back against lockers, confident pose, direct stare towards camera. Change outfit to ${isFemale ? 'minimalist all-black athleisure set' : 'modern all-black tracksuit with clean lines, t-shirt'} and black Nike sport shoes. Change background to gym changing room with lockers. Change light to even indoor lighting`,
          mediaPaths: [idPhotoSet.generated.body!, idPhotoSet.generated.body!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: verticalRatio[0], 
          height: verticalRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.92 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
        ratio: '9:16',
        angle: '0:0',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 38,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Laying on abdomen, upper body slightly lifted and supported by both elbows, legs are visible on the background, hands are resting palms down, looking towards camera. Change outfit to ${isFemale ? 'a stylish soft sleep pink pajama' : 'gray modal lounge shorts, t-shirt'}. Change background to bed in the bedroom. Change light to soft romantic bedroom light`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: portraitRatio[0], 
          height: portraitRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.91 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
        ratio: '3:4',
        angle: '0:0',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 39,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Dancing, looking towards camera. Change outfit to ${isFemale ? 'a fitted black micro mini skirt, sleeveless white bodysuit, black pointed-toe heels' : 'a black crew-neck tee, black trousers, white leather minimalist sneakers'}. Change background to night street. Change light to night club signs and city lights`,
          mediaPaths: [idPhotoSet.generated.body!, idPhotoSet.generated.body!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: verticalRatio[0], 
          height: verticalRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.92 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
        ratio: '9:16',
        angle: '0:0',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 40,
    },

    // =================================================================
    // FULL-BODY ANGLES
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Extreme low-angle shot with camera at ground level, looking straight. Change outfit to blue jeans, light gray polo and navy/white Converse-style canvas sneakers. Change background to White clouds, pebbles ground. Change light to soft diffused daylight`,
          mediaPaths: [idPhotoSet.generated.body!, idPhotoSet.generated.body!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: verticalRatio[0], 
          height: verticalRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.9 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
        ratio: '9:16',
        angle: '0:30',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 41,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Extreme high-angle overhead shot, looking up towards camera. Change outfit to white shorts, light gray t-shirt and orange flip flops. Change background to sahara desert. Change light to sunny weather`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: verticalRatio[0], 
          height: verticalRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.9 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: {
        dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
        ratio: '9:16',
        angle: '0:30',
        shotType: 'frontFullBodyView',
      },
      maxRuns: 5,
      order: 42,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Standing, rear view. Pure 180 degree view, face is not visible at all. Hands resting on balcony rails. Looking forward. Change outfit to ${isFemale ? 'high-waisted black tailored trousers, fitted white crop top, white sneakers' : 'slim dark navy chinos, white oxford shirt, chelsea boots '}. Change background to city skyline balcony view. Change light to daylight`,
          mediaPaths: [idPhotoSet.generated.body!, idPhotoSet.generated.body!, idPhotoSet.generated.back!],
          numSteps: 8,
          width: verticalRatio[0], 
          height: verticalRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: false },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`, ratio: '9:16', angle: '0:0', shotType: 'rearFullBodyView'},
      maxRuns: 1,
      order: 43,
    }
  ];
};

export const generatePhotoSetCaptions = (parameters: AvatarParameters & {gender: string}): string[] => {
  const { gender, body, bodyHair, bustSize } = parameters;
  const isFemale = gender === 'female';
  
  const bodyHairTag = bodyHair === 'none' ? 'smooth skin' : `${bodyHair} body hair`;
  const bodyTag = `${body} build, ${bodyHairTag}, ${bustSize} bust`;

  return [
    // --- Headshots & Tight Portraits ---
    `${AVATAR_REFERENCE_NAME}, close-up headshot, front view, neutral expression, white button-down shirt, open top buttons, studio lighting`,
    `${AVATAR_REFERENCE_NAME}, front-facing portrait, thoughtful expression, dark gray cotton t-shirt, indoor window light`,
    `${AVATAR_REFERENCE_NAME}, front view, gentle smile, dark green crew-neck t-shirt, outdoor park, golden hour side lighting`,
    `${AVATAR_REFERENCE_NAME}, front view, relaxed face, black dress shirt, low-key lighting, rim light, dark studio`,
    `${AVATAR_REFERENCE_NAME}, frontal portrait, mild surprise, light blue collared shirt, dark suit jacket, office environment`,
    `${AVATAR_REFERENCE_NAME}, front view, confident stare, light gray crew-neck t-shirt, harsh midday sunlight, urban street`,
    `${AVATAR_REFERENCE_NAME}, portrait, curious expression, pastel yellow home t-shirt, cozy living room, warm light`,
    `${AVATAR_REFERENCE_NAME}, upper chest view, soft smile, red silk shirt, city night background, tungsten light, ${bustSize} bust`,

    // --- 3/4 and Profile Angles ---
    `${AVATAR_REFERENCE_NAME}, three-quarter view facing left, neutral, casual clothing, indoor cafe, natural daylight`,
    `${AVATAR_REFERENCE_NAME}, 3/4 right angle portrait, white sleeveless t-shirt, outdoor nature, golden hour side lighting`,
    `${AVATAR_REFERENCE_NAME}, three-quarter left, happy expression, dark gray knit sweater, dramatic cinematic lighting`,
    `${AVATAR_REFERENCE_NAME}, 3/4 facing right, light gray fleece hoodie, urban street, overcast daylight`,
    `${AVATAR_REFERENCE_NAME}, three-quarter view, surprised look, pink button-up shirt, park scenery, sunset backlight`,
    `${AVATAR_REFERENCE_NAME}, 3/4 angle left, calm face, dark gray home t-shirt, indoor lamp light`,
    `${AVATAR_REFERENCE_NAME}, left profile view, neutral expression, dark blue shirt, even side lighting, plain background`,
    `${AVATAR_REFERENCE_NAME}, right side profile, black long neck turtleneck sweater, golden hour rim light`,

    // --- Additional Profiles & Dynamic Angles ---
    `${AVATAR_REFERENCE_NAME}, left profile close-up, dark brown t-shirt, dramatic low-key lighting, studio setting`,
    `${AVATAR_REFERENCE_NAME}, side view right, yellow cotton shirt, window backlight, silhouette edge`,
    `${AVATAR_REFERENCE_NAME}, profile left, subtle smile, orange t-shirt, city rooftop, blue evening light`,
    `${AVATAR_REFERENCE_NAME}, three-quarter right looking down, army green t-shirt, bedroom window, morning light`,
    `${AVATAR_REFERENCE_NAME}, 3/4 view, head tilt, white dress shirt, light gray blazer, modern workspace`,

    // --- Full-Body Shots ---
    `${AVATAR_REFERENCE_NAME}, full body standing, black hoodie, cargo pants, ${bodyTag}, urban street, golden hour`,
    `${AVATAR_REFERENCE_NAME}, full body walking side view, athletic tank top, spandex shorts, ${bodyTag}, city sidewalk`,
    `${AVATAR_REFERENCE_NAME}, full body casual, looking over shoulder, ${isFemale ? 'summer sundress' : 'polo shirt and chinos'}, ${bodyTag}, forest nature`,
    `${AVATAR_REFERENCE_NAME}, full body standing barefoot, white linen shirt, dark blue shorts, visible feet and toes, ${bodyTag}, wooden floor`,
    `${AVATAR_REFERENCE_NAME}, full body barefoot, wearing ${isFemale ? 'red bikini' : 'red swimming shorts'}, ${bodyTag}, beach sand, ocean background`,
    `${AVATAR_REFERENCE_NAME}, full body barefoot on lounge chair, ${isFemale ? 'white skirt and pink blouse' : 'Hawaiian shirt and white shorts'}, ${bodyTag}, beach background`,
    `${AVATAR_REFERENCE_NAME}, full body walking barefoot, denim shorts, white t-shirt, visible feet and toes, ${bodyTag}, tropical path`,
    `${AVATAR_REFERENCE_NAME}, full body sitting on chair, light button-up shirt, tan chinos, ${bodyTag}, indoor cafe`,
    `${AVATAR_REFERENCE_NAME}, full body sitting cross-legged, barefoot, casual shorts and t-shirt, visible bare feet, ${bodyTag}, park grass`,
    `${AVATAR_REFERENCE_NAME}, full body sitting on low wall, barefoot, athletic sport suit, visible ankles and feet, ${bodyTag}, urban rooftop`,
    `${AVATAR_REFERENCE_NAME}, full body leaning against wall, barefoot, crew-neck sweater and trousers, ${bodyTag}, studio lighting`,
    `${AVATAR_REFERENCE_NAME}, full body laying on bed, neutral color pajamas, ${bodyTag}, early morning sunrise`,

    // --- Upper-Body Variations ---
    `${AVATAR_REFERENCE_NAME}, upper body 3/4 pose, casual white t-shirt, blue jeans, ${bodyTag}, park daylight`,
    `${AVATAR_REFERENCE_NAME}, upper body leaning, dark blazer over neutral shirt, ${bodyTag}, neon city lighting`,
    `${AVATAR_REFERENCE_NAME}, upper body 3/4 view, arms crossed, crew-neck sweater, ${bodyTag}, studio lighting`,
    `${AVATAR_REFERENCE_NAME}, upper body sitting, casual olive shirt, leaning forward, ${bodyTag}, indoor lamp light`,
    `${AVATAR_REFERENCE_NAME}, upper body sitting on couch, barefoot, sleeveless white t-shirt, light blue jeans, ${bodyTag}, living room`,
    `${AVATAR_REFERENCE_NAME}, upper body back view turning head, casual hoodie, ${bodyTag}, urban street`,
    `${AVATAR_REFERENCE_NAME}, upper body sitting, barefoot, gray home shorts and t-shirt, visible feet, ${bodyTag}, natural light`
  ];
};