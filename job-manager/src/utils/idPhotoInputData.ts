import { AvatarParameters } from '../types/avatar';
import { IdPhotoSetPaths } from '../types/trainingPhotoSet';
import { InferenceJob, Directions } from '../types/job';
import imageRatios from '../types/imageRatios';

export const genTrainingSyntheticIdPhotoData = (parameters: AvatarParameters, idPhotoSet: IdPhotoSetPaths): Partial<InferenceJob>[] => {
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
          width: squareRatio[0],
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: { min: 0.8 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '9:16', angle: '0:0', shotType: 'FrontFullBodyView'},
      maxRuns: 5,
      order: 9,
    },
  ]
}

export const genTrainingTwinIdPhotoData = (parameters: AvatarParameters, idPhotoSet: IdPhotoSetPaths): Partial<InferenceJob>[] => {
  const { gender, height, body, bodyHair, bustSize } = parameters;

  const squareRatio = imageRatios.qwenEdit2511['1:1'];
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
          width: squareRatio[0],
          height: squareRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.uploaded.front!, idPhotoSet.generated.front!], threshold: { min: 0.9 }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 0.7 },
        ],
      },
      metadata: { dimensions: `${squareRatio[0]}x${squareRatio[1]}`, ratio: '9:16', angle: '0:0', shotType: 'FrontFullBodyView'},
      maxRuns: 7,
      order: 9,
    },
  ]
}
