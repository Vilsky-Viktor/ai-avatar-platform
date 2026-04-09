import { AvatarParameters, AvatarGender } from '../types/avatar';
import { IdPhotoSetPaths } from '../types/trainingPhotoSet';
import { Job, FaceExpressionTypes } from '../types/job';
import imageRatios from '../types/imageRatios';

export const AVATAR_REFERENCE_NAME = 'AVATARLIFE';

export const generateIdPhotoView0Prompt = (parameters: AvatarParameters & {gender: string}): string => {
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
    bodyHair
  } = parameters;

  const facialHairDesc = facialHair === 'none' ? 'clean-shaven, no facial hair' : `with ${facialHair}`;
  const bodyHairDesc = bodyHair === 'none' ? 'no body hair' : `with ${bodyHair} body hair`;

  let prompt = `Ultra-realistic passport-style ID photo, professional studio portrait of a ${age}-year-old ${ethnicity} ${gender} with ${skinColor} skin tone, `;

  if (attractiveness) prompt += `${attractiveness} appearance, `;
  prompt += `${face} face, ${eyes} eyes with ${eyeLashes} eyelashes and ${eyeBrows} eyebrows, ${nose} nose, ${ears} ears, ${lips} lips, `;

  if (facialHairDesc) prompt += `${facialHairDesc}, `;
  prompt += `${hairColor} hair in ${hairStyle} style, `;

  if (body || bustSize) prompt += `with ${body} build${bustSize ? ` and ${bustSize} bust` : ''}, `;
  if (bodyHairDesc) prompt += `${bodyHairDesc}, `

  prompt += `skin is ${skin} with highly detailed realistic natural pores, subtle texture and imperfections for lifelike appearance. `;

  prompt += `Wearing simple white shirt with open top buttons. Front-facing pose, head and shoulders only, perfectly centered composition, direct eye contact looking straight at the camera, completely neutral expression, relaxed closed mouth, no smile. `;

  prompt += `Even soft diffused studio lighting from front and sides, no harsh shadows or highlights on face, plain uniform light gray or white background, sharp focus especially on eyes and facial details, photorealistic, captured with professional DSLR like Canon EOS R5 or Sony A7R IV with 85mm lens at f/5.6–f/8, ISO 100, crisp 8K resolution, natural color balance, no artifacts, no makeup overload, true-to-life quality.`;

  return prompt;
};

export const generateIdPhotoView45Prompt = (parameters: AvatarParameters & {gender: string}): string => {
  return 'Rotate the person 45 degrees to the left to generate a quarter 45 degree view. Maintain the same person, face features, body features, facial emotions, outfit, background and everything else as in the reference images';
}

export const generateIdPhotoView90Prompt = (parameters: AvatarParameters & {gender: string}): string => {
  return 'Rotate the person 45 degrees to the left to generate a side 90 degree view. Maintain the same person, face features, body features, facial emotions, outfit, background and everything else as in the reference images';
}

export const generateTrainingPhotoSetData = (
  userId: string,
  avatarId: string,
  parameters: AvatarParameters & { gender: string },
  idPhotoSet: IdPhotoSetPaths
): Partial<Job>[] => {
  const { gender, height, body, bodyHair, bustSize } = parameters;

  const squareRatio = imageRatios.qwenEdit2511['1:1'];
  const portraitRatio = imageRatios.qwenEdit2511['3:4'];
  const verticalRatio = imageRatios.qwenEdit2511['9:16'];
  const horisontalRatio = imageRatios.qwenEdit2511['4:3'];
  const horisontalWideRatio = imageRatios.qwenEdit2511['16:9'];

  const isFemale = gender === 'female';

  return [
    // =================================================================
    // CORE IDENTITY LOCK (non-negotiable for perfect face fidelity)
    // =================================================================

    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1. Extreme tight close-up portrait, face occupying 95% of the frame. Pure headshot, shoulders fully cropped out, tight framing around head and chin. Remove shoulders and neck completely. Neutral expression, direct gaze to camera. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
    //       mediaPaths: [idPhotoSet.front],
    //       numSteps: 8,
    //       width: squareRatio[0], 
    //       height: squareRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.95
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
    //     ratio: '1:1',
    //     angle: '0:0',
    //     shotType: 'frontExtremeCloseUpView',
    //   },
    //   maxRuns: 5,
    //   order: 1,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1. Front close-up headshot. Neutral expression, direct gaze to camera. Wearing a dark gray t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
    //       mediaPaths: [idPhotoSet.front],
    //       numSteps: 8,
    //       width: squareRatio[0], 
    //       height: squareRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.96
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
    //     ratio: '1:1',
    //     angle: '0:0',
    //     shotType: 'frontCloseUpView',
    //   },
    //   maxRuns: 5,
    //   order: 2,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1. Front close-up headshot. Gentle smile showing teeth, direct gaze to camera. Wearing a pastel red t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
    //       mediaPaths: [idPhotoSet.frontSmile],
    //       numSteps: 8,
    //       width: squareRatio[0], 
    //       height: squareRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.frontSmile],
    //       threshold: 0.96
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
    //     ratio: '1:1',
    //     angle: '0:0',
    //     shotType: 'frontCloseUpView',
    //   },
    //   maxRuns: 5,
    //   order: 3,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `<sks> front-right quarter view eye-level shot close-up, pure 45 degree quarter view. Nose pointing the left side of the frame. The exact person from the input images. Neutral expression. Wearing a pastel blue t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
    //       mediaPaths: [idPhotoSet.rightQuarter, idPhotoSet.rightQuarter],
    //       numSteps: 8,
    //       width: squareRatio[0], 
    //       height: squareRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
    //       threshold: 0.96
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 0.95 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
    //     ratio: '1:1',
    //     angle: '45:0',
    //     shotType: 'rightQuarterCloseUpView',
    //   },
    //   maxRuns: 7,
    //   order: 4,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `<sks> front-left quarter view eye-level shot close-up, pure 45 degree quarter view. Nose pointing the right side of the frame. The exact person from the input images. Neutral expression. Wearing a pastel green t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
    //       mediaPaths: [idPhotoSet.leftQuarter, idPhotoSet.leftQuarter],
    //       numSteps: 8,
    //       width: squareRatio[0], 
    //       height: squareRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
    //       threshold: 0.96
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 0.95 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
    //     ratio: '1:1',
    //     angle: '45:0',
    //     shotType: 'leftQuarterCloseUpView',
    //   },
    //   maxRuns: 7,
    //   order: 5,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `<sks> right side view eye-level shot close-up, pure 80 degree side view. Nose pointing the left side of the frame. The exact person from the input images. Neutral expression. Wearing a pastel amber t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
    //       mediaPaths: [idPhotoSet.rightQuarter, idPhotoSet.rightQuarter],
    //       numSteps: 8,
    //       width: squareRatio[0], 
    //       height: squareRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
    //       threshold: 0.82
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 0.95 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
    //     ratio: '1:1',
    //     angle: '90:0',
    //     shotType: 'rightSideCloseUpView',
    //   },
    //   maxRuns: 9,
    //   order: 6,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `<sks> left side view eye-level shot close-up, pure 80 degree side view. Nose pointing the right side of the frame. The exact person from the input images. Neutral expression. Wearing a pastel purple t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
    //       mediaPaths: [idPhotoSet.leftQuarter, idPhotoSet.leftQuarter],
    //       numSteps: 8,
    //       width: squareRatio[0], 
    //       height: squareRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
    //       threshold: 0.82
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 0.95 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
    //     ratio: '1:1',
    //     angle: '90:0',
    //     shotType: 'leftSideCloseUpView',
    //   },
    //   maxRuns: 9,
    //   order: 7,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the input images. Front full body standing view. Neutral expression, direct gaze to camera. High-angle overhead shot, camera at 45 degrees above. Exact head proportions from input images with no distortion. ${bodyHair !== 'none' ? `${bodyHair} body hair on chest, abdomen, arms and legs` : 'smooth with no body hair'}. ${body} body type, no tattoos. ${bustSize} chest. ${height} height. Natural body to head proportions, head is one-seventh of total body height. Wearing ${isFemale ? 'white running shorts and white bikini top' : 'white running shorts, white shirt with short sleeves and all open undone buttons showing chest and abdomen'}, barefoot. Gray concrete color wall, light wooden floor. Soft diffused daylight. Make the subjects skin details more prominent and natural. Sharp focus on face`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front],
    //       numSteps: 8,
    //       width: verticalRatio[0], 
    //       height: verticalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.93
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
    //     ratio: '9:16',
    //     angle: '0:45',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 9,
    //   order: 8,
    // },

    // // =================================================================
    // // CHEST-UP EMOTIONS
    // // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `The exact person from the input images. Front close-up headshot. Wearing a dark gray t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
          mediaPaths: [idPhotoSet.front, idPhotoSet.front],
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.sad, scale: 0.7 },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.front],
          threshold: 0.85
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 }
        ],
      },
      metadata: {
        dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontCloseUpView',
      },
      maxRuns: 5,
      order: 9,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `The exact person from the input images. Front close-up headshot. Wearing a dark gray t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
          mediaPaths: [idPhotoSet.front, idPhotoSet.front],
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.angry, scale: 0.7 },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.front],
          threshold: 0.85
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 }
        ],
      },
      metadata: {
        dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontCloseUpView',
      },
      maxRuns: 5,
      order: 10,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `The exact person from the input images. Front close-up headshot. Wearing a dark gray t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
          mediaPaths: [idPhotoSet.front, idPhotoSet.front],
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.confused, scale: 0.7 },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.front],
          threshold: 0.85
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 }
        ],
      },
      metadata: {
        dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontCloseUpView',
      },
      maxRuns: 5,
      order: 11,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `The exact person from the input images. Front close-up headshot. Wearing a dark gray t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
          mediaPaths: [idPhotoSet.front, idPhotoSet.front],
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.contempt, scale: 0.7 },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.front],
          threshold: 0.85
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 }
        ],
      },
      metadata: {
        dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontCloseUpView',
      },
      maxRuns: 5,
      order: 12,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `The exact person from the input images. Front close-up headshot. Wearing a dark gray t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
          mediaPaths: [idPhotoSet.front, idPhotoSet.front],
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.confident, scale: 0.7 },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.front],
          threshold: 0.85
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0},
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 }
        ],
      },
      metadata: {
        dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontCloseUpView',
      },
      maxRuns: 5,
      order: 13,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `The exact person from the input images. Front close-up headshot. Wearing a dark gray t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
          mediaPaths: [idPhotoSet.front, idPhotoSet.front],
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.disgust, scale: 0.7 },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.front],
          threshold: 0.85
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 }
        ],
      },
      metadata: {
        dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontCloseUpView',
      },
      maxRuns: 5,
      order: 14,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `The exact person from the input images. Front close-up headshot. Wearing a dark gray t-shirt. Gray concrete color wall. Remove objects from the background. Soft diffused daylight`,
          mediaPaths: [idPhotoSet.front, idPhotoSet.front],
          numSteps: 8,
          width: squareRatio[0],
          height: squareRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.fear, scale: 0.7 },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.front],
          threshold: 0.85
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 }
        ],
      },
      metadata: {
        dimensions: `${squareRatio[0]}x${squareRatio[1]}`,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontCloseUpView',
      },
      maxRuns: 5,
      order: 15,
    },
    
    // // =================================================================
    // // BEST chest-up PORTRAITS (most diverse lighting/outfit/emotions combos)
    // // =================================================================

    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Wearing ${isFemale ? 'a soft beige cashmere turtleneck sweater' : 'a slim-fit olive green henley shirt'}. Indoor cozy living room, softly blurred. Warm natural window light from the front-right, soft shadows on right side`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.95
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontChestUpView',
    //   },
    //   maxRuns: 5,
    //   order: 9,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Wearing ${isFemale ? 'flowy sage green midi dress with subtle puff sleeves' : 'khaki light jaket with white tee'}. Outdoor park. Golden hour light`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.95
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontChestUpView',
    //   },
    //   maxRuns: 5,
    //   order: 10,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Wearing ${isFemale ? 'a silky emerald green camisole with delicate straps' : 'a fitted black turtleneck under a charcoal overcoat'}. Blurred rooftop city night background. Evening warm tungsten light. Natural body to head proportions`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.95
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontChestUpView',
    //   },
    //   maxRuns: 5,
    //   order: 11,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. Front chest-up portrait, looking directly at camera. Wearing ${isFemale ? 'a chunky cream cable-knit sweater' : 'a soft taupe merino wool crewneck'}. Cozy living room setting. Soft warm candlelight`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.95
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontChestUpView',
    //   },
    //   maxRuns: 5,
    //   order: 12,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Wearing ${isFemale ? 'a tailored pale blue Oxford shirt' : 'a modern business casual light gray button-down with micro-check pattern'}. Modern indoor environment. White bright office lighting. Natural body to head proportions`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.95
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontChestUpView',
    //   },
    //   maxRuns: 5,
    //   order: 13,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. Front chest-up portrait, looking directly at camera. Wearing a fitted dark charcoal ribbed turtleneck. Deep dark studio background. Soft low-key light from the front-left, gently illuminating the face with natural shadow falloff toward the right side and edges`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.95
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontChestUpView',
    //   },
    //   maxRuns: 5,
    //   order: 14,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. Front chest-up selfie, looking directly at camera. Wearing dark blue shirt. Searshore path with cafes and bars. Overcast daylight`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.95
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontChestUpView',
    //   },
    //   maxRuns: 5,
    //   order: 15,
    // },

    // // =================================================================
    // // CHEST-UP ANGULAR & DYNAMIC HEAD COVERAGE
    // // =================================================================

    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `<sks> front-right quarter view eye-level shot chest-up, pure 45 degree quarter view. Nose pointing the left side of the frame. The exact person from the input images. Wearing ${isFemale ? 'a cozy oversized oatmeal cardigan' : 'a soft gray zip-up hoodie'}. Loft style living room interior. Soft indoor lamp light`,
    //       mediaPaths: [idPhotoSet.rightQuarter, idPhotoSet.rightQuarter],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 0.95 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '45:0',
    //     shotType: 'leftQuarterChestUpView',
    //   },
    //   maxRuns: 5,
    //   order: 16,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `<sks> front-left quarter view eye-level shot chest-up, pure 45 degree quarter view. Nose pointing the right side of the frame. The exact person from the input images. Wearing ${isFemale ? 'a relaxed beige trench coat over a cream turtleneck' : 'a camel overcoat layered over a white crewneck'}. Indoor cafe with a bar. Soft natural daylight from ceiling to floor windows on the right`,
    //       mediaPaths: [idPhotoSet.leftQuarter, idPhotoSet.leftQuarter],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 0.95 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '45:0',
    //     shotType: 'leftQuarterChestUpView',
    //   },
    //   maxRuns: 5,
    //   order: 17,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `<sks> right side view eye-level shot chest-up, pure 80 degree side view. Nose pointing the left side of the frame. The exact person from the input images. Neutral expression. Wearing ${isFemale ? 'a light pink windbreaker' : 'a light blue windbreaker'}. Harbor with yachts. Cloudy bright`,
    //       mediaPaths: [idPhotoSet.rightQuarter, idPhotoSet.rightQuarter],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
    //       threshold: 0.85
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 0.95 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '90:0',
    //     shotType: 'rightSideChestUpView',
    //   },
    //   maxRuns: 7,
    //   order: 18,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `<sks> left side view eye-level shot chest-up, pure 80 degree side view. Nose pointing the right side of the frame. The exact person from the input images. Wearing ${isFemale ? 'a metallic silver cropped jacket' : 'a sleek black puffer vest over hoodie'}. Urban street. Very early evening`,
    //       mediaPaths: [idPhotoSet.leftQuarter, idPhotoSet.leftQuarter],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
    //       threshold: 0.85
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 0.95 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '90:0',
    //     shotType: 'leftSideChestUpView',
    //   },
    //   maxRuns: 7,
    //   order: 19,
    // },

    // // =================================================================
    // // UPPER-BODY SHOTS
    // // =================================================================

    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Front waist-up portrait. One hand in the pocket. Wearing ${isFemale ? 'a tailored pinstripe blazer in soft gray over white tee and pants' : 'a modern slim-fit navy blazer with white dress shirt and navy pants'}. Co-working space background with people working, gray cement walls style, industrial aesthetic, wooden minimalist desk and Apple Mackbook on it on the left side. Office bright white light`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.92
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontWaistUpView',
    //   },
    //   maxRuns: 5,
    //   order: 20,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1. The exact body from the image 2. Front waist-up portrait. Standing casually. Wearing ${isFemale ? 'fitted black racing-style crop jacket, gray crop top underneath' : 'fitted black racing jacket with subtle contrast stitching, clean gray t-shirt underneath'}. Garage with a fleet of luxury mix of sport and business cars. Parking indoor lighting`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.92
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontWaistUpView',
    //   },
    //   maxRuns: 5,
    //   order: 21,
    // },

    // // =================================================================
    // // FULL-BODY & EXTREME POSES (maximum pose/lighting/clothing diversity)
    // // =================================================================

    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view. Wearing ${isFemale ? 'high-waisted cream tailored trousers, silk blouse and white heels' : 'slim-fit dark gray chinos, beige shirt and black oxford shoes'}. Street with skyscrapers. Soft early morning with clear sky`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: verticalRatio[0], 
    //       height: verticalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.87
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
    //     ratio: '9:16',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 22,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view walking. Wearing ${isFemale ? 'a fitted short cocktail dress with spaghetti straps, high heels, sleek and elegant' : 'a slim fit charcoal suit with white dress shirt, no tie, loafers, smart casual'}. City sidewalk background. Overcast daylight`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: verticalRatio[0], 
    //       height: verticalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.87
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
    //     ratio: '9:16',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 23,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view deep squat, arms resting on knees. Wearing taupe linen trousers, olive green relaxed linen shirt and sandals. Outdoor nature. Soft forest diffused light`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 24,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view sitting, hands on sides supporting body. Wearing ${isFemale ? 'pink fitted racerback crop tank top, light gray fleece sweat shorts with elastic waistband' : 'relaxed gray joggers, white t-shirt'}. On king size bed in the hotel room. Simple home interior soft light. Remove objects from input image`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 25,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view standing. Wearing ${isFemale ? 'a breezy floral sundress' : 'red shorts and sleeveless black t-shirt'}, barefoot. On the beach sand, ocean background. Soft golden hour`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: verticalRatio[0], 
    //       height: verticalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
    //     ratio: '9:16',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 26,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view sitting, direct stare to camera, one knee bent upwards. Wearing ${isFemale ? 'a breezy yellow floral wrap midi dress with short puff sleeves and v-neckline' : 'pastel yellow shorts and hawaiian shirt'}, barefoot. On the lounge chair on the beach. Soft daylight`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 27,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view jogging towards camera, looking directly at camera. Wearing ${isFemale ? 'a breezy white cover-up dress' : 'lightweight linen shorts and shirt undone top buttons'}, barefoot. Tropical path. Soft daylight`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: verticalRatio[0], 
    //       height: verticalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
    //     ratio: '9:16',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 28,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view sitting barefoot cross-legged, relaxed pose, direct gaze to camera. Wearing ${isFemale ? 'flowy boho pants in terracotta and cropped top' : 'relaxed-fit dark green cargo shorts and gray tee'}, flip flops. On ground, park grass. Early morning`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.92
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 29,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view standing, arms crossed over chest, hands tucked under armpits, direct gaze to camera. Wearing ${isFemale ? 'minimalist all-black athleisure set' : 'modern all-black tracksuit with clean lines, t-shirt'} and black Nike sport shoes. Gym changing room with lockers. Even bright lighting`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: verticalRatio[0], 
    //       height: verticalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.92
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
    //     ratio: '9:16',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 30,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view laying on abdomen, upper body slightly lifted and supported by both elbows, legs are visible on the background, hands are resting palms down, looking towards camera. Wearing ${isFemale ? 'a stylish soft sleep pink pajama' : 'gray modal lounge shorts, t-shirt'}. On the bed in the bedroom. Soft romantic bedroom light`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: portraitRatio[0], 
    //       height: portraitRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${portraitRatio[0]}x${portraitRatio[1]}`,
    //     ratio: '3:4',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 31,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view, dancing. Wearing ${isFemale ? 'a fitted black micro mini skirt, sleeveless white bodysuit, black pointed-toe heels' : 'a black fitted crew-neck tee, slim black trousers, white leather minimalist sneakers'}. Night street. Light from night club signs and city lights`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: verticalRatio[0], 
    //       height: verticalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.85
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
    //     ratio: '9:16',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 32,
    // },

    // // =================================================================
    // // FULL-BODY ANGLES
    // // =================================================================

    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view extreme low-angle shot with camera at ground level, hands on hips, looking straight. Wearing blue jeans, light gray polo and navy/white Converse-style canvas sneakers. White clouds background, pebbles ground. Daylight`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: verticalRatio[0], 
    //       height: verticalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.8
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
    //     ratio: '9:16',
    //     angle: '0:30',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 33,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view extreme high-angle overhead shot, looking up towards camera. Wearing white shorts, light gray t-shirt and orange flip flops. Sahara desert. Sunny weather`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: verticalRatio[0], 
    //       height: verticalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
    //     ratio: '9:16',
    //     angle: '0:30',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 34,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact body from the image 1. Full body rear view standing, preserving exact body, head and haircut from input image. Hands resting on balcony rails. Looking forward. Wearing ${isFemale ? 'high-waisted black tailored trousers, fitted white crop top, white sneakers' : 'slim dark navy chinos, white oxford shirt, chelsea boots '}. City skyline balcony view. Daylight`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: verticalRatio[0], 
    //       height: verticalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: false,
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${verticalRatio[0]}x${verticalRatio[1]}`,
    //     ratio: '9:16',
    //     angle: '0:0',
    //     shotType: 'rearFullBodyView',
    //   },
    //   maxRuns: 1,
    //   order: 35,
    // },

    // // =================================================================
    // // HORISONTAL VIEWs
    // // =================================================================

    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view, looking directly at camera. Wearing ${isFemale ? 'beige crop top, high-waisted light wash denim jeans' : 'beige t-shirt, light slim jeans'}. Private house yard. Soft daylight`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: horisontalRatio[0], 
    //       height: horisontalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${horisontalRatio[0]}x${horisontalRatio[1]}`,
    //     ratio: '4:3',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 36,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view, sitting on a sport motorcycle, leaning slightly forward, looking directly at camera, wihout helmet. Wearing fitted black motorcycle racing suit, racing gloves. Open mountain road, motion blur background. Natural daylight`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: horisontalRatio[0], 
    //       height: horisontalRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${horisontalRatio[0]}x${horisontalRatio[1]}`,
    //     ratio: '4:3',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 37,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view, sitting on a concrete ledge at the edge, looking directly at camera. Wearing beige slim jeans and brown tee. Construction blured background. Overcast daylight. Sharp focus on face`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: horisontalWideRatio[0], 
    //       height: horisontalWideRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${horisontalWideRatio[0]}x${horisontalWideRatio[1]}`,
    //     ratio: '16:9',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 38,
    // },
    // {
    //   input: {
    //     checkDependencies: true,
    //     inference: {
    //       prompt: `The exact person from the image 1 and image 2. The exact body from the image 3. Full body front view, both hands in pockets, looking directly at camera. Wearing ${isFemale ? 'olive green utility jacket, white tee, light wash skinny jeans' : 'olive green bomber jacket, grey crew neck tee, dark chinos'}. Park with a lake background. Open shade`,
    //       mediaPaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.body],
    //       numSteps: 8,
    //       width: horisontalWideRatio[0], 
    //       height: horisontalWideRatio[1],
    //       guidanceScale: 1.0,
    //     },
    //     faceRecognition: {
    //       enabled: true,
    //       mediaPaths: [idPhotoSet.front],
    //       threshold: 0.9
    //     },
    //     loras: [
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.6 },
    //       { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //     ],
    //   },
    //   metadata: {
    //     dimensions: `${horisontalWideRatio[0]}x${horisontalWideRatio[1]}`,
    //     ratio: '16:9',
    //     angle: '0:0',
    //     shotType: 'frontFullBodyView',
    //   },
    //   maxRuns: 5,
    //   order: 39,
    // },
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