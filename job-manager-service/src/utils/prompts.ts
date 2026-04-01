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

  const sqareRatio = imageRatios.qwenEdit2511['1:1'];
  const portraitRatio = imageRatios.qwenEdit2511['3:4'];

  const isFemale = gender === 'female';
  const qualityAddition = `Hyperrealistic photograph, 8K detail, skin details, hair details. Sharp focus on face`;
  const idPhotoEnv = 'Soft diffused studio lighting. Plain light gray background';
  const identityAddition = `Keep exact facial identity, proportions and skin color from reference image`;

  return [
    // =================================================================
    // CORE IDENTITY LOCK (non-negotiable for perfect face fidelity)
    // =================================================================

    // Extreme close-up (skin/eye/lip texture lock)
    {
      prompt: `${identityAddition}. Extreme close-up portrait, face only, cropped tightly at the chin and forehead edges. Face fills 95% of the frame. No shoulders, no neck visible. ${idPhotoEnv}. ${qualityAddition}`,
      inference: {
        imagePaths: [idPhotoSet.front],
        idPhotoPaths: [idPhotoSet.front],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 3, numInferenceSteps: 8, width: sqareRatio[0], height: sqareRatio[1] },
        ],
      },
      loras: [
        { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
        // { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
        // { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }
      ],
      order: 1,
    },
    // // Front facing ID headshot
    // {
    //   prompt: `${identityAddition}. Front close-up headshot ID photo. Wearing coal t-shirt. ${idPhotoEnv}. ${qualityAddition}`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front],
    //     idPhotoPaths: [idPhotoSet.front],
    //     inferenceLevels: [
    //       { numRuns: 8, numInferenceSteps: 2, width: 1328, height: 1328 },
    //       { numRuns: 4, numInferenceSteps: 8, width: 1328, height: 1328 },
    //       { numRuns: 2, numInferenceSteps: 25, width: 1328, height: 1328 },
    //     ],
    //   },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 0.5, blend: 80, referenceIdx: 0 },
    //   order: 2,
    // },
    // // Front facing ID headshot (smile variation)
    // {
    //   prompt: `${identityAddition}. Front close-up headshot ID photo. Wearing dark red t-shirt. ${idPhotoEnv}. ${qualityAddition}`,
    //   inference: {
    //     imagePaths: [idPhotoSet.frontSmile],
    //     idPhotoPaths: [idPhotoSet.frontSmile],
    //     inferenceLevels: [
    //       { numRuns: 8, numInferenceSteps: 2, width: 1328, height: 1328 },
    //       { numRuns: 4, numInferenceSteps: 8, width: 1328, height: 1328 },
    //       { numRuns: 2, numInferenceSteps: 25, width: 1328, height: 1328 },
    //     ],
    //   },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 0.5, blend: 80, referenceIdx: 0 },
    //   order: 3,
    // },
    // // Right quarter ID headshot
    // {
    //   prompt: `${identityAddition}. Strictly 45 degree three-quarter view chest-up portrait. Sharp focus on face. Wearing dark blue t-shirt. ${idPhotoEnv}. ${qualityAddition}`,
    //   inference: {
    //     imagePaths: [idPhotoSet.rightQuarter],
    //     idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
    //     inferenceLevels: [
    //       { numRuns: 8, numInferenceSteps: 2, width: 1328, height: 1328 },
    //       { numRuns: 4, numInferenceSteps: 8, width: 1328, height: 1328 },
    //       { numRuns: 2, numInferenceSteps: 25, width: 1328, height: 1328 },
    //     ],
    //   },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 0.5, blend: 80, referenceIdx: 0 },
    //   order: 4,
    // },
    // // Left quarter ID headshot
    // {
    //   prompt: `${identityAddition}. Strictly 45 degree three-quarter view chest-up portrait. Wearing dark green t-shirt. ${idPhotoEnv}. ${qualityAddition}`,
    //   inference: {
    //     imagePaths: [idPhotoSet.leftQuarter],
    //     idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
    //     inferenceLevels: [
    //       { numRuns: 8, numInferenceSteps: 2, width: 1328, height: 1328 },
    //       { numRuns: 4, numInferenceSteps: 8, width: 1328, height: 1328 },
    //       { numRuns: 2, numInferenceSteps: 25, width: 1328, height: 1328 },
    //     ],
    //   },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 0.5, blend: 80, referenceIdx: 0 },
    //   order: 5,
    // },
    // // Right side profile ID headshot
    // {
    //   prompt: `${identityAddition}. Rotate subject to get strictly 80 degree side profile view headshot. Wearing gray t-shirt. ${idPhotoEnv}. ${qualityAddition}`,
    //   inference: {
    //     imagePaths: [idPhotoSet.rightQuarter],
    //     idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
    //     inferenceLevels: [
    //       { numRuns: 8, numInferenceSteps: 4, width: 1328, height: 1328 },
    //       { numRuns: 4, numInferenceSteps: 10, width: 1328, height: 1328 },
    //       { numRuns: 2, numInferenceSteps: 25, width: 1328, height: 1328 },
    //     ],
    //   },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 0.5, blend: 80, referenceIdx: 0 },
    //   order: 6,
    // },
    // // Left side profile ID headshot
    // {
    //   prompt: `${identityAddition}. Rotate subject to get strictly 80 degree side profile view headshot. Wearing dark brown t-shirt. ${idPhotoEnv}. ${qualityAddition}`,
    //   inference: {
    //     imagePaths: [idPhotoSet.leftQuarter],
    //     idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
    //     inferenceLevels: [
    //       { numRuns: 8, numInferenceSteps: 4, width: 1328, height: 1328 },
    //       { numRuns: 4, numInferenceSteps: 10, width: 1328, height: 1328 },
    //       { numRuns: 2, numInferenceSteps: 25, width: 1328, height: 1328 },
    //     ],
    //   },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 0.5, blend: 80, referenceIdx: 0 },
    //   order: 7,
    // },
    // // Full-body front ID
    // {
    //   prompt: `${identityAddition}. Front full body ID photo of the ${gender} from the reference image. Shoulders width naturally proportional to head size. Head occupies roughly one-seventh of total body height. ${isFemale ? 'She' : 'He'} has ${body} body type, ${bustSize} chest, and ${height} height. ${bodyHair !== 'none' ? `Visible ${bodyHair} body hair covers his chest, abdomen, arms and legs` : 'No body hair'}. Wearing white ${isFemale ? 'bikini bottom and top' : 'boxer trunks and topless'}, barefoot. ${idPhotoEnv}. ${qualityAddition}`,
    //   inference: {
    //     imagePaths: [idPhotoSet.front],
    //     idPhotoPaths: [idPhotoSet.front],
    //     inferenceLevels: [
    //       { numRuns: 10, numInferenceSteps: 4, width: 1328, height: 1328 },
    //       { numRuns: 5, numInferenceSteps: 10, width: 1328, height: 1328 },
    //       { numRuns: 2, numInferenceSteps: 25, width: 1328, height: 1328 },
    //     ],
    //   },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 0.5, blend: 50 },
    //   order: 8,
    // },
    
    // =================================================================
    // BEST chest-up PORTRAITS (most diverse lighting/outfit combos)
    // =================================================================

    // {
    //   prompt: `Keep exact facial identity and proportions from reference images. Front chest-up portrait. Wearing ${isFemale ? 'a soft beige cashmere turtleneck sweater' : 'a slim-fit olive green henley shirt'}. Indoor cozy living room, softly blurred. Warm natural window light from the front-right, soft shadows on right side. ${qualityAddition}`,
    //   imagePaths: [idPhotoSet.front],
    //   idPhotoPaths: [idPhotoSet.front],
    //   controlnetScale: 0.2,
    //   numSteps: 30,
    //   cascadeSampling: {
    //     enabled: true,
    //     maxRuns: 12,
    //     numSteps: 15,
    //     maxBestCandidates: 2,
    //     width: 512,
    //     height: 512,
    //   },
    //   order: 9,
    // },
    // {
    //   prompt: `Keep exact facial identity and proportions from reference images. Front chest-up portrait. Wearing ${isFemale ? 'flowy sage green midi dress with subtle puff sleeves' : 'khaki light jaket with white tee'}. Out-of-focus green trees, bokeh background. No sun daylight, soft diffused natural light. ${qualityAddition}`,
    //   imagePaths: [idPhotoSet.front],
    //   idPhotoPaths: [idPhotoSet.front],
    //   controlnetScale: 0.2,
    //   numSteps: 30,
    //   cascadeSampling: {
    //     enabled: true,
    //     maxRuns: 15,
    //     numSteps: 15,
    //     maxBestCandidates: 2,
    //     width: 512,
    //     height: 512,
    //   },
    //   order: 10,
    // },
    // {
    //   prompt: `Keep exact facial identity and proportions from reference images. Front chest-up portrait. Wearing ${isFemale ? 'a silky emerald green camisole with delicate straps' : 'a fitted black turtleneck under a charcoal overcoat'}. Blurred rooftop city night background. Evening warm tungsten light. ${qualityAddition}`,
    //   imagePaths: [idPhotoSet.front],
    //   idPhotoPaths: [idPhotoSet.front],
    //   controlnetScale: 0.2,
    //   numSteps: 30,
    //   cascadeSampling: {
    //     enabled: true,
    //     maxRuns: 15,
    //     numSteps: 15,
    //     maxBestCandidates: 2,
    //     width: 512,
    //     height: 512,
    //   },
    //   order: 11,
    // },
    // {
    //   prompt: `Keep exact facial identity and proportions from reference images. Front chest-up portrait. Wearing ${isFemale ? 'a chunky cream cable-knit sweater' : 'a soft taupe merino wool crewneck'}. Cozy living room setting. Soft warm candlelight. ${qualityAddition}`,
    //   imagePaths: [idPhotoSet.front],
    //   idPhotoPaths: [idPhotoSet.front],
    //   controlnetScale: 0.2,
    //   numSteps: 30,
    //   cascadeSampling: {
    //     enabled: true,
    //     maxRuns: 12,
    //     numSteps: 15,
    //     maxBestCandidates: 2,
    //     width: 512,
    //     height: 512,
    //   },
    //   order: 12,
    // },
    // {
    //   prompt: `Keep exact facial identity and proportions from reference images. Front chest-up portrait. Wearing ${isFemale ? 'a tailored pale blue Oxford shirt' : 'a modern business casual light gray button-down with micro-check pattern'}. Modern indoor environment. White bright office lighting. ${qualityAddition}`,
    //   imagePaths: [idPhotoSet.front],
    //   idPhotoPaths: [idPhotoSet.front],
    //   controlnetScale: 0.2,
    //   numSteps: 30,
    //   cascadeSampling: {
    //     enabled: true,
    //     maxRuns: 12,
    //     numSteps: 15,
    //     maxBestCandidates: 2,
    //     width: 512,
    //     height: 512,
    //   },
    //   order: 13,
    // },

    // // =================================================================
    // // ANGULAR & DYNAMIC HEAD COVERAGE
    // // =================================================================

    // {
    //   prompt: `Keep exact facial identity and proportions from reference images. Three-quarter 45 degree view chest-up portrait. Wearing ${isFemale ? 'a relaxed beige trench coat over a cream turtleneck' : 'a camel overcoat layered over a white crewneck'}. Indoor cafe. Soft natural daylight from ceiling to floor windows on the right. ${qualityAddition}`,
    //   similarityThreshold: 0.9,
    //   imagePaths: [idPhotoSet.rightQuarter, idPhotoSet.front],
    //   idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 100 },
    //   controlnetScale: 0.3,
    //   numSteps: 25,
    //   order: 14,  
    // },
    // {
    //   prompt: `Keep exact facial identity and proportions from reference images. Three-quarter 45 degree view chest-up portrait. Wearing ${isFemale ? 'a cozy oversized oatmeal cardigan' : 'a soft gray zip-up hoodie'}. Home interior blurred. Soft indoor lamp light. ${qualityAddition}`,
    //   similarityThreshold: 0.9,
    //   imagePaths: [idPhotoSet.leftQuarter, idPhotoSet.front],
    //   idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 100 },
    //   controlnetScale: 0.3,
    //   numSteps: 25,
    //   order: 15,  
    // },
    // {
    //   prompt: `Keep exact facial identity and proportions from reference image.Rotate subject to get 80-degree side profile view chest-up portrait. Wearing ${isFemale ? 'a flowy white peasant blouse with embroidered neckline' : 'a relaxed linen chambray shirt'}. Airport terminal. Natural daylight + terminal bright lighting. ${qualityAddition}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.rightQuarter, idPhotoSet.front],
    //   idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
    //   controlnetScale: 0.3,
    //   numSteps: 30,
    //   order: 16,
    // },
    // {
    //   prompt: `Keep exact facial identity and proportions from reference image. Rotate subject to get 80-degree side profile view chest-up portrait. Wearing ${isFemale ? 'a metallic silver cropped jacket' : 'a sleek black puffer vest over hoodie'}. Street covered with snow. Very early evening, distant city light. ${qualityAddition}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.leftQuarter, idPhotoSet.front],
    //   idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
    //   controlnetScale: 0.3,
    //   numSteps: 30,
    //   order: 17,  
    // },

    // // =================================================================
    // // FULL-BODY & EXTREME POSES (maximum pose/lighting/clothing diversity)
    // // =================================================================

    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body standing, subject has ${height} height, ${body} body type. ${isFemale ? 'high-waisted cream tailored trousers, silk blouse and white heels' : 'slim-fit dark gray chinos, white button-down and black oxford shoes'}. Urban street soft golden hour. ${qualityAddition}`,
    //   similarityThreshold: 0.85,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 18,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body walking, subject has ${height} height, ${body} body type. Wearing ${isFemale ? 'a fitted short cocktail dress with spaghetti straps, high heels, sleek and elegant' : 'a slim fit charcoal suit with white dress shirt, no tie, loafers, smart casual'}. City sidewalk background. Overcast daylight. ${qualityAddition}`,
    //   similarityThreshold: 0.85,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 19,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body deep squat, subject has ${height} height, ${body} body type. Wearing taupe linen trousers, olive green relaxed linen shirt and sandals. Outdoor nature. Soft forest diffused light. ${qualityAddition}`,
    //   similarityThreshold: 0.85,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 20,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body sitting, feet are cut off the frame, subject has ${height} height, ${body} body type. Wearing ${isFemale ? 'pink fitted racerback crop tank top, light gray fleece sweat shorts with elastic waistband' : 'relaxed gray joggers, white t-shirt'}. On king size bed in the hotel room. Simple home interior soft light. ${qualityAddition}`,
    //   similarityThreshold: 0.85,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 21,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body standing, weight shifted on one leg, subject has ${height} height, ${body} body type. Wearing ${isFemale ? 'stylish black bikini' : 'black swim shorts'}, barefoot. On the beach sand, ocean background. Soft golden hour. ${qualityAddition}`,
    //   similarityThreshold: 0.85,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 22,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body laying barefoot, three-quarter camera view slightly from above, looking straight into camera, head slightly lifted, hands clasped behind head, one knee bent upward, subject has ${height} height, ${body} body type. Wearing ${isFemale ? 'a breezy yellow floral wrap midi dress with short puff sleeves and v-neckline' : 'pastel yellow shorts and hawaiian shirt'}. On the lounge chair on the beach. Soft golden hour. ${qualityAddition}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter, idPhotoSet.rightQuarter],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 23,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body jogging barefoot towards camera, subject has ${height} height, ${body} body type. Wearing ${isFemale ? 'a breezy white cover-up dress' : 'lightweight linen shorts and white shirt'}. Tropical path. Soft daylight. ${qualityAddition}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 24,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body sitting barefoot cross-legged, relaxed pose, subject has ${height} height, ${body} body type. Wearing ${isFemale ? 'flowy boho pants in terracotta and cropped top' : 'relaxed-fit cargo shorts and tee'}. On ground, park grass. Soft daylight. ${qualityAddition}`,
    //   similarityThreshold: 0.85,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 25,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Front full body leaning against wall standing, confident pose, subject has ${height} height, ${body} body type. Wearing ${isFemale ? 'minimalist all-black athleisure set' : 'modern all-black tracksuit with clean lines'} and sport shoes. Gym changing room. Studio even lighting. ${qualityAddition}`,
    //   similarityThreshold: 0.85,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 26,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body lying on abdomen, upper body slightly lifted and supported by both elbows, legs stretched and feet visible in the background, hands are laying palms down, subject has ${height} height, ${body} body type. Wearing ${isFemale ? 'a stylish soft sleep pink pajama' : 'gray modal lounge shorts, t-shirt'}. On the bed in the bedroom. Morning light. ${qualityAddition}`,
    //   similarityThreshold: 0.85,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 27,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body subtly dancing, subject has ${height} height, ${body} body type. Wearing ${isFemale ? 'a fitted black micro mini skirt, sleeveless white bodysuit, black pointed-toe heels' : 'a black fitted crew-neck tee, slim black trousers, white leather minimalist sneakers'}. Night street. Light from night club signs and city lights. ${qualityAddition}`,
    //   similarityThreshold: 0.85,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 28,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body standing, extreme low angle shot camera at ground level, hands on hips, looking forward, subject has ${height} height, ${body} body type. Wearing blue jeans, light gray polo and navy/white Converse-style canvas sneakers. White clouds background, pebbles ground. Daylight. ${qualityAddition}`,
    //   similarityThreshold: 0.75,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 29,
    // },
    // {
    //   prompt: `Keep exact facial identity from image 1 only. Keep body size and proportions from image 2. Ignore face from image 2. Full body standing, extreme overhead shot, looking up towards camera. Wearing white shorts, white t-shirt and orange flip flops, subject has ${height} height, ${body} body type. Sahara desert. Sunny and hot. ${qualityAddition}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 30,
    // },
    // {
    //   prompt: `Keep exact facial identity from reference images. Upper body sitting at desk, both hands flat on desk surface in front. Wearing ${isFemale ? 'a tailored pinstripe blazer in soft gray over white tee and pants' : 'a modern slim-fit navy blazer with white dress shirt and navy pants'}. Co-working space background with people working, gray cement walls style, industrial aesthetic, wooden minimalist desk and Apple Mackbook on it on the left side. Office bright white light. ${qualityAddition}`,
    //   similarityThreshold: 0.85,
    //   imagePaths: [idPhotoSet.front],
    //   idPhotoPaths: [idPhotoSet.front],
    //   faceSwap: { enabled: true, model: 'hyperswap_1a_256', weight: 1.0, pixelBoost: '1328x1328', referenceIdx: 0 },
    //   faceEnhancement: { enabled: true, model: 'gpen_bfr_2048', weight: 1.0, blend: 80 },
    //   order: 31,  
    // },
    // // Back view (essential for rear silhouette & hair learning)
    // {
    //   prompt: `Keep haircut from image 1. Keep exact body proportions and size from image 2. Full body rear view walking, subject has ${height} height, ${body} body type. ${bodyHair !== 'none' ? `Keep body hair intensity from image 1` : 'No body hair'}. Wearing ${isFemale ? 'stylish red bikini with white pareo' : 'Red swim shorts with a white towel on shoulder'}. On the beach sand towards beach bar. Soft golden hour. ${qualityAddition}`,
    //   imagePaths: [idPhotoSet.leftQuarter, idPhotoSet.body],
    //   idPhotoPaths: [],
    //   maxRuns: 1,
    //   order: 32,
    // },
    // {
    //   prompt: `Keep haircut from image 1. Keep exact body proportions and size from image 2. Full body back view standing, head fully visible only from behind, hands resting on balcony rails, subject has ${height} height, ${body} body type. Wearing ${isFemale ? 'high-waisted black tailored trousers, fitted white crop top, white sneakers' : 'slim dark navy chinos, white oxford shirt, chelsea boots '}. City skyline balcony view. Early morning. ${qualityAddition}`,
    //   maxRuns: 1,
    //   imagePaths: [idPhotoSet.leftQuarter, idPhotoSet.body],
    //   idPhotoPaths: [],
    //   order: 33,  
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