import { AvatarParameters, AvatarGender } from '../types/avatar';
import { TrainingPhotoSetInput, IdPhotoSetPaths } from '../types/trainingPhotoSet';
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

export const generatePhotoSetInputs = (
  userId: string,
  avatarId: string,
  parameters: AvatarParameters & { gender: string },
  idPhotoSet: IdPhotoSetPaths
): TrainingPhotoSetInput[] => {
  const { gender, height, body, bodyHair, bustSize, skinColor, ethnicity } = parameters;

  const squareRatio = imageRatios.qwenEdit2511['1:1'];
  const portraitRatio = imageRatios.qwenEdit2511['3:4'];
  const verticalRatio = imageRatios.qwenEdit2511['9:16'];

  const isFemale = gender === 'female';
  const qualityAddition = `Hyperrealistic photograph, 8K detail, skin details, hair details. Sharp focus on face`;
  const idPhotoEnv = 'Soft diffused studio lighting. Plain light gray background';
  const identityAddition = `Keep exact facial identity, proportions and skin color from reference image`;

  return [
    // // =================================================================
    // // CORE IDENTITY LOCK (non-negotiable for perfect face fidelity)
    // // =================================================================

    {
      prompt: `The exact person from the image 1. Extreme close up, micro portrait. Tightly cut on edges of the head. Face takes 100% of the frame. Neutral expression, looking at camera. Soft diffused studio lighting. Plain light gray background, remove objects`,
      inference: {
        imagePaths: [idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: squareRatio[0], height: squareRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 1,
    },
    {
      prompt: `The exact person from the image 1. Front close-up headshot. Neutral expression, looking at camera. Wearing a gray t-shirt. Soft diffused studio lighting. Plain light gray background, remove objects`,
      inference: {
        imagePaths: [idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: squareRatio[0], height: squareRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 2,
    },
    {
      prompt: `The exact person from the image 1. Front close-up headshot. Gentle smile showing teeth, looking at camera. Wearing a pastel red t-shirt. Soft diffused studio lighting. Plain light gray background, remove objects`,
      inference: {
        imagePaths: [idPhotoSet.frontSmile],
        idPhotoPaths: [idPhotoSet.frontSmile],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: squareRatio[0], height: squareRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 3,
    },
    {
      prompt: `The exact person from the image 1 and image 2. <sks> front-right quarter view eye-level shot close-up. Neutral expression, looking towards head direction. Wearing a pastel blue t-shirt. Soft diffused studio lighting. Plain light gray background, remove objects`,
      inference: {
        imagePaths: [idPhotoSet.rightQuarter, idPhotoSet.rightQuarter],
        idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: squareRatio[0], height: squareRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
      ],
      order: 4,
    },
    {
      prompt: `The exact person from the image 1 and image 2. <sks> front-left quarter view eye-level shot close-up. Neutral expression, looking towards head direction. Wearing a pastel green t-shirt. Soft diffused studio lighting. Plain light gray background, remove objects`,
      inference: {
        imagePaths: [idPhotoSet.leftQuarter, idPhotoSet.leftQuarter],
        idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: squareRatio[0], height: squareRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
      ],
      order: 5,
    },
    {
      prompt: `The exact person from the image 1 and image 2. <sks> right side view eye-level shot close-up. Neutral expression, looking towards head direction. Wearing a pastel brown t-shirt. Soft diffused studio lighting. Plain light gray background, remove objects`,
      inference: {
        imagePaths: [idPhotoSet.rightQuarter, idPhotoSet.rightQuarter],
        idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 5, numInferenceSteps: 8, width: squareRatio[0], height: squareRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
      ],
      order: 6,
    },
    {
      prompt: `The exact person from the image 1 and image 2. <sks> left side view eye-level shot close-up. Neutral expression, looking towards head direction. Wearing a pastel purple t-shirt. Soft diffused studio lighting. Plain light gray background, remove objects`,
      inference: {
        imagePaths: [idPhotoSet.leftQuarter, idPhotoSet.leftQuarter],
        idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 5, numInferenceSteps: 8, width: squareRatio[0], height: squareRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
      ],
      order: 7,
    },
    {
      prompt: `The exact person from the input images. Front full body standing view. Neutral expression, looking at camera. ${bodyHair !== 'none' ? `${bodyHair} body hair on chest, abdomen, arms and legs` : 'smooth with no body hair'}. ${body} body type, no tattoos. ${bustSize} chest. ${height} height. Wearing ${isFemale ? 'white short-cut cotton boxers and white bikini top' : 'white short-cut cotton boxers, white shirt with short sleeves and all open undone buttons showing chest and abdomen'}, barefoot. Soft diffused studio lighting. Plain light gray background and light wooden floor, remove objects. Make the subjects skin details more prominent and natural`,
      inference: {
        imagePaths: [idPhotoSet.front, idPhotoSet.front, idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 7, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 0.3, filename: "qwen-edit-skin_1.1_000002750.safetensors" },
      ],
      order: 8,
    },
    
    // =================================================================
    // BEST chest-up PORTRAITS (most diverse lighting/outfit/emotions combos)
    // =================================================================

    {
      prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Soft and warm expression. Wearing ${isFemale ? 'a soft beige cashmere turtleneck sweater' : 'a slim-fit olive green henley shirt'}. Indoor cozy living room, softly blurred. Warm natural window light from the front-right, soft shadows on right side`,
      inference: {
        imagePaths: [idPhotoSet.front, idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 9,
    },
    {
      prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Neutral expression. Wearing ${isFemale ? 'flowy sage green midi dress with subtle puff sleeves' : 'khaki light jaket with white tee'}. Outdoor park. Soft and warm golden hour lighting`,
      inference: {
        imagePaths: [idPhotoSet.front, idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 10,
    },
    {
      prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Relaxed expression. Wearing ${isFemale ? 'a silky emerald green camisole with delicate straps' : 'a fitted black turtleneck under a charcoal overcoat'}. Blurred rooftop city night background. Evening warm tungsten light. Natural body to head proportions`,
      inference: {
        imagePaths: [idPhotoSet.front, idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 11,
    },
    {
      prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Subtle curious expression. Wearing ${isFemale ? 'a chunky cream cable-knit sweater' : 'a soft taupe merino wool crewneck'}. Cozy living room setting. Soft warm candlelight`,
      inference: {
        imagePaths: [idPhotoSet.front, idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 12,
    },
    {
      prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Thinking expression. Wearing ${isFemale ? 'a tailored pale blue Oxford shirt' : 'a modern business casual light gray button-down with micro-check pattern'}. Modern indoor environment. White bright office lighting. Natural body to head proportions`,
      inference: {
        imagePaths: [idPhotoSet.front, idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 13,
    },
    {
      prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Serious and focused — direct eye contact, no smile, firm jaw. Arms crossed with hands tucked under armpits. Wearing a fitted dark charcoal ribbed turtleneck. Deep dark studio background. Soft low-key light from the front-left, gently illuminating the face with natural shadow falloff toward the right side and edges`,
      inference: {
        imagePaths: [idPhotoSet.front, idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 14,
    },
    {
      prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. A bare trace of laughing. Wearing a light gray minimalist hoodie. Theme park. Overcast daylight. Natural body to head proportions`,
      inference: {
        imagePaths: [idPhotoSet.frontSmile, idPhotoSet.frontSmile],
        idPhotoPaths: [idPhotoSet.front, idPhotoSet.frontSmile],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 5, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 15,
    },
    {
      prompt: `The exact person from the image 1 and image 2. Front chest-up portrait. Slight irritation, barely noticeable tension in the brow, lips pressed together. Wearing ${isFemale ? 'Brown top' : 'Brown sleeveless t-shirt'}. Crowded supermarket. Bright indoor light. Natural body to head proportions`,
      inference: {
        imagePaths: [idPhotoSet.front, idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 5, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 16,
    },
    {
      prompt: `The exact person from the image 1 and image 2 Chest-up selfie. Slight smile with completely closed mouth. Wearing fitted t-shirt. Aqua park. Morning light. Natural body to head proportions`,
      inference: {
        imagePaths: [idPhotoSet.front, idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 5, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
      ],
      order: 17,
    },

    // // =================================================================
    // // CHEST-UP ANGULAR & DYNAMIC HEAD COVERAGE
    // // =================================================================

    {
      prompt: `The exact person from the image 1 and image 2. <sks> front-left quarter view eye-level shot chest-up. Neutral expression. Wearing ${isFemale ? 'a relaxed beige trench coat over a cream turtleneck' : 'a camel overcoat layered over a white crewneck'}. Indoor cafe. Soft natural daylight from ceiling to floor windows on the right`,
      inference: {
        imagePaths: [idPhotoSet.leftQuarter, idPhotoSet.leftQuarter],
        idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 5, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
      ],
      order: 18,  
    },
    {
      prompt: `The exact person from the image 1 and image 2. <sks> front-right quarter view eye-level shot chest-up. Neutral expression. Wearing ${isFemale ? 'a cozy oversized oatmeal cardigan' : 'a soft gray zip-up hoodie'}. Modern living room interior. Soft indoor lamp light`,
      inference: {
        imagePaths: [idPhotoSet.rightQuarter, idPhotoSet.rightQuarter],
        idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 5, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
      ],
      order: 19,  
    },
    {
      prompt: `The exact person from the image 1 and image 2. <sks> right side view eye-level shot chest-up. Neutral expression. Wearing ${isFemale ? 'a flowy white peasant blouse with embroidered neckline' : 'a relaxed linen chambray shirt'}. Airport terminal. Natural daylight + terminal bright light`,
      inference: {
        imagePaths: [idPhotoSet.rightQuarter, idPhotoSet.rightQuarter],
        idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 5, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
      ],
      order: 20,
    },
    {
      prompt: `The exact person from the image 1 and image 2. <sks> left side view eye-level shot chest-up. Neutral expression. Wearing ${isFemale ? 'a metallic silver cropped jacket' : 'a sleek black puffer vest over hoodie'}. Street covered with snow. Very early evening, distant city light`,
      inference: {
        imagePaths: [idPhotoSet.leftQuarter, idPhotoSet.leftQuarter],
        idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 5, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Multiple-Angles-LoRA", scale: 1.0 },
      ],
      order: 21,  
    },

    // // =================================================================
    // // UPPER-BODY SHOTS
    // // =================================================================

    // {
    //   prompt: `Front waist-up portrait of the same person from the input image, preserving exact facial features, skin tone, eye color, and facial structure. One hand in the pocket. Wearing ${isFemale ? 'a tailored pinstripe blazer in soft gray over white tee and pants' : 'a modern slim-fit navy blazer with white dress shirt and navy pants'}. Co-working space background with people working, gray cement walls style, industrial aesthetic, wooden minimalist desk and Apple Mackbook on it on the left side. Office bright white light. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 7, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 23,  
    // },

    // // =================================================================
    // // FULL-BODY & EXTREME POSES (maximum pose/lighting/clothing diversity)
    // // =================================================================

    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Wearing ${isFemale ? 'high-waisted cream tailored trousers, silk blouse and white heels' : 'slim-fit dark gray chinos, beige shirt and black oxford shoes'}. Urban street, soft early morning with clear sky. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 20,
    // },
    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Full body walking. Wearing ${isFemale ? 'a fitted short cocktail dress with spaghetti straps, high heels, sleek and elegant' : 'a slim fit charcoal suit with white dress shirt, no tie, loafers, smart casual'}. City sidewalk background. Overcast daylight. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 21,
    // },
    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Full body deep squat, arms resting on knees. Wearing taupe linen trousers, olive green relaxed linen shirt and sandals. Outdoor nature. Soft forest diffused light. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 22,
    // },
    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Full body sitting, hands on sides supporting body. Wearing ${isFemale ? 'pink fitted racerback crop tank top, light gray fleece sweat shorts with elastic waistband' : 'relaxed gray joggers, white t-shirt'}. On king size bed in the hotel room. Simple home interior soft light. Keep face and identity completely unchanged. Remove objects from input image`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 23,
    // },
    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Full body standing. Wearing ${isFemale ? 'a breezy floral sundress' : 'red shorts and sleeveless black t-shirt'}, barefoot. On the beach sand, ocean background. Soft golden hour. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 24,
    // },
    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Full body laying barefoot, front camera view slightly from above, head slightly lifted, direct stare to camera, knees bent upwards. Wearing ${isFemale ? 'a breezy yellow floral wrap midi dress with short puff sleeves and v-neckline' : 'pastel yellow shorts and hawaiian shirt'}. On the lounge chair on the beach. Soft golden hour. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 25,
    // },
    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Full body jogging barefoot towards camera. Wearing ${isFemale ? 'a breezy white cover-up dress' : 'lightweight linen shorts and white shirt'}. Tropical path. Soft daylight. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 26,
    // },
    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Full body sitting barefoot cross-legged, relaxed pose. Wearing ${isFemale ? 'flowy boho pants in terracotta and cropped top' : 'relaxed-fit cargo shorts and tee'}, flip flops. On ground, park grass. Soft daylight. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 27,
    // },
    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Leaning against wall standing, confident pose, looking towards camera. Wearing ${isFemale ? 'minimalist all-black athleisure set' : 'modern all-black tracksuit with clean lines, t-shirt'} and black Nike sport shoes. Gym changing room. Gym even bright lighting. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 28,
    // },
    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Full body lying on abdomen, upper body slightly lifted and supported by both elbows, legs are visible on the background, hands are resting palms down, looking towards camera. Wearing ${isFemale ? 'a stylish soft sleep pink pajama' : 'gray modal lounge shorts, t-shirt'}. On the bed in the bedroom. Morning light. Keep face and identity completely unchanged. Remove objects from input image`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: portraitRatio[0], height: portraitRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 29,
    // },
    // {
    //   prompt: `Full body front view of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Slightly dancing. Wearing ${isFemale ? 'a fitted black micro mini skirt, sleeveless white bodysuit, black pointed-toe heels' : 'a black fitted crew-neck tee, slim black trousers, white leather minimalist sneakers'}. Night street. Light from night club signs and city lights. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 }
    //   ],
    //   order: 30,
    // },
    // {
    //   prompt: `Full body front view extreme low-angle shot of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Full body standing upright, extreme low-angle shot with camera at ground level, hands on hips, looking directly into the camera, body completely straight and vertical. Wearing blue jeans, light gray polo and navy/white Converse-style canvas sneakers. White clouds background, pebbles ground. Daylight. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //   ],
    //   order: 31,
    // },
    // {
    //   prompt: `Full body front view extreme high-angle shot of the person from the input images, preserving exact facial features, skin tone, eye color, and facial structure from input image 1 and preserving exact body from input image 2. Full body standing, extreme angle overhead shot, looking up towards camera. Wearing white shorts, white t-shirt and orange flip flops. Sahara desert. Sunny weather. Keep face and identity completely unchanged`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //     idPhotoPaths: [idPhotoSet.front],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
    //   ],
    //   order: 32,
    // },
    
    // // =================================================================
    // // FULL-BODY BACK VIEW
    // // =================================================================

    // {
    //   prompt: `Full body rear view walking, preserving exact body, head and haircut from input image. Looking forward. Wearing ${isFemale ? 'stylish red bikini with white half transparent pareo' : 'Pastel green swim shorts with sleeveless t-shirt'}. On the beach sand walking towards beach bar. Soft golden hour`,
    //   inference: {
    //     imagePaths: [idPhotoSet.body],
    //     idPhotoPaths: [],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 1, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //   ],
    //   order: 33,
    // },
    // {
    //   prompt: `Full body rear view standing, preserving exact body, head and haircut from input image. Hands resting on balcony rails. Looking forward. Wearing ${isFemale ? 'high-waisted black tailored trousers, fitted white crop top, white sneakers' : 'slim dark navy chinos, white oxford shirt, chelsea boots '}. City skyline balcony view. Early morning`,
    //   inference: {
    //     imagePaths: [idPhotoSet.body],
    //     idPhotoPaths: [],
    //     trueCfgScale: 1.0,
    //     inferenceLevels: [
    //       { numRuns: 1, numInferenceSteps: 8, width: verticalRatio[0], height: verticalRatio[1] },
    //     ],
    //   },
    //   loras: [
    //     { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
    //   ],
    //   order: 34,  
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