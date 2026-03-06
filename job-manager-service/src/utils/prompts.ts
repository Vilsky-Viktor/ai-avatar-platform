import { AvatarParameters, AvatarGender } from '../types/avatar';

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

type PhotoSetPrompts = {
  prompt: string;
  maxRuns: number;
  guidance: number;
  numSteps: number;
  similarityThreshold: number;
  imagePaths: string[],
  idPhotoPaths: string[],
  resultFileName: string;
}

export const generatePhotoSetInputs = (userId: string, avatarId: string, parameters: AvatarParameters & {gender: string}): PhotoSetPrompts[] => {
  const { gender, height, body, bodyHair, bustSize } = parameters;

  const avatarMediaPath = `media/${userId}-user/avatars/${avatarId}-avatar/images`;
  const dimensionSuffix = '1024x1024';
  const isFemale = gender === 'female';

  const bodyHairDesc = bodyHair === 'none' ? 'no body hair' : `${bodyHair} body hair`;
  const bodyDesc = `Person height: ${height}cm, body style: ${body}, body hair: ${bodyHairDesc}, ${isFemale ? 'bust' : 'chest'} size: ${bustSize}. Maintain described body description. Keep natural proportions`


  const numSteps = 40;
  const guidance = 4.0;
  const maxRuns = 3;
  const similarityThreshold = 0.85;
  
  const baseIdentity = `Maintain exactly same face, face shape, facial features, head shape, body, skin texture, eye color, nose and hair style, person age as in the reference images. High quality, sharp focus on face`;

  return [
    // ID photos
    {
      prompt: `Front view close-up headshot, no head tilt, neutral calm expression, soft even studio lighting, plain light gray background, wearing white shirt with open top buttons. ${bodyDesc}. ${baseIdentity}`,
      maxRuns: 5,
      guidance,
      numSteps,
      similarityThreshold: 0.9,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`
      ],
      resultFileName: `001-training-photo-set-${dimensionSuffix}.png`,
    },
    {
      prompt: `Quarter view close-up headshot, no head tilt, neutral calm expression, soft even studio lighting, plain light gray background, wearing white shirt with open top buttons. ${bodyDesc}. ${baseIdentity}`,
      maxRuns: 5,
      guidance,
      numSteps,
      similarityThreshold: 0.9,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
      ],
      resultFileName: `002-training-photo-set-${dimensionSuffix}.png`,
    },
    {
      prompt: `Pure side profile close-up headshot, no head tilt, neutral calm expression, soft even studio lighting, plain light gray background, wearing white shirt with open top buttons. ${bodyDesc}. ${baseIdentity}`,
      maxRuns: 5,
      guidance,
      numSteps,
      similarityThreshold: 0.75,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-profile-portrait-${dimensionSuffix}.png`,
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-profile-portrait-${dimensionSuffix}.png`,
      ],
      resultFileName: `003-training-photo-set-${dimensionSuffix}.png`,
    },
    {
      prompt: `Full body front shot barefoot, no head tilt, neutral calm expression, soft even studio lighting, plain light gray background, wearing ${isFemale ? 'strapless bandeau crop top and denim cutoff micro shorts' : 'drop armhole tank and denim shorts'}. ${bodyDesc}. ${baseIdentity}`,
      maxRuns: 5,
      guidance,
      numSteps,
      similarityThreshold: 0.85,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      resultFileName: `004-training-photo-set-${dimensionSuffix}.png`,
    },
    
    // Headshots & tight portraits (strong face lock)
    {
      prompt: `Front-facing portrait, head perfectly straight, zero tilt, eyes only looking slightly up-left, subtle thoughtful expression, warm natural window light from left, indoor neutral setting, wearing ${isFemale ? 'a soft beige cashmere turtleneck sweater' : 'a slim-fit olive green henley shirt'}. ${baseIdentity}`,
      maxRuns,
      guidance,
      numSteps,
      similarityThreshold: 0.75,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      resultFileName: `005-training-photo-set-${dimensionSuffix}.png`,
    },
    {
      prompt: `Portrait with a subtle smile, happy and joyful smiling mood, golden hour soft side lighting, outdoor blurred park background, wearing ${isFemale ? 'a flowy off-white linen button-up shirt' : 'a relaxed-fit white linen shirt with rolled sleeves'}. ${baseIdentity}`,
      maxRuns,
      guidance,
      numSteps,
      similarityThreshold: 0.8,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      resultFileName: `006-training-photo-set-${dimensionSuffix}.png`,
    },
    {
      prompt: `Front view, relaxed neutral face, soft split lighting from camera-left, light gradually fading across face to a visible shadow side, face fully recognizable, dark studio background, wearing ${isFemale ? 'a sleek black mock-neck top' : 'a deep charcoal slim-fit polo'}. ${baseIdentity}`,
      maxRuns,
      guidance,
      numSteps,
      similarityThreshold: 0.85,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      resultFileName: `007-training-photo-set-${dimensionSuffix}.png`,
    },
    {
      prompt: `Subtle hint of surprise, eyes opened very slightly wider than on reference image, mouth barely parted, composed professional expression, cool blue-toned office lighting, modern indoor environment, wearing ${isFemale ? 'a tailored pale blue Oxford shirt' : 'a modern business casual light gray button-down with micro-check pattern'}. ${baseIdentity}`,
      maxRuns,
      guidance,
      numSteps,
      similarityThreshold: 0.85,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      resultFileName: `008-training-photo-set-${dimensionSuffix}.png`,
    },
    {
      prompt: `Front view portrait, confident direct stare, bright outdoor daylight, soft natural shadows on face, clear even skin illumination, urban street blurred backdrop, wearing ${isFemale ? 'a cropped black leather jacket over a white tank' : 'a black bomber jacket over a gray graphic tee'}. ${baseIdentity}`,
      maxRuns,
      guidance,
      numSteps,
      similarityThreshold: 0.8,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      resultFileName: `009-training-photo-set-${dimensionSuffix}.png`,
    },
    {
      prompt: `Portrait, one eyebrow very slightly raised, lips lightly pressed together, soft warm candlelight, cozy living room setting, wearing ${isFemale ? 'a chunky cream cable-knit sweater' : 'a soft taupe merino wool crewneck'}. ${baseIdentity}`,
      maxRuns,
      guidance,
      numSteps,
      similarityThreshold: 0.85,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      resultFileName: `010-training-photo-set-${dimensionSuffix}.png`,
    },
    {
      prompt: `Front view upper chest included, subtle scared expression, eyes very slightly widened, mouth barely open, evening warm tungsten light, blurred city night background, wearing ${isFemale ? 'a silky emerald green camisole with delicate straps' : 'a fitted black turtleneck under a charcoal overcoat'}. ${baseIdentity}`,
      maxRuns,
      guidance,
      numSteps,
      similarityThreshold: 0.85,
      imagePaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      idPhotoPaths: [
        `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
      ],
      resultFileName: `011-training-photo-set-${dimensionSuffix}.png`,
    },

    // // 3/4 and profile angles (good angular coverage)
    // {
    //   prompt: `Three-quarter view facing left, neutral expression, soft natural daylight from window, indoor cafe setting, wearing ${isFemale ? 'a relaxed beige trench coat over a cream turtleneck' : 'a camel overcoat layered over a white crewneck'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `012-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `3/4 right angle portrait, thoughtful gaze slightly away, golden hour warm side lighting, outdoor blurred nature, wearing ${isFemale ? 'a flowy terracotta midi dress with subtle puff sleeves' : 'a rust-colored chore jacket over a white tee'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `013-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Three-quarter left, soft dramatic cinematic side lighting with rim preserving facial details, dark moody background, wearing ${isFemale ? 'a structured black blazer with strong shoulders' : 'a tailored navy suit jacket unbuttoned over white shirt'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `014-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `3/4 facing right, relaxed neutral, cool overcast daylight, urban street environment, wearing ${isFemale ? 'oversized denim jacket in medium wash over cropped hoodie' : 'baggy cargo pants with a black tech hoodie'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `015-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Three-quarter view, subtle surprised look with closed mouth, warm sunset backlight with front fill, park scenery, wearing ${isFemale ? 'a butter-yellow linen blazer and matching shorts' : 'a lightweight khaki utility jacket and cream chinos'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `016-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `3/4 left angle, calm serene face, soft indoor lamp light, home interior blurred, wearing ${isFemale ? 'a cozy oversized oatmeal cardigan' : 'a soft gray zip-up hoodie'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `017-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Pure side profile, looking forward, warm golden hour rim light, outdoor blurred, wearing ${isFemale ? 'a sleeveless white linen top' : 'a relaxed white linen camp-collar shirt'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-profile-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-profile-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `018-training-photo-set-${dimensionSuffix}.png`,
    // },

    // // Additional profiles & dynamic head angles
    // {
    //   prompt: `Pure side profile close-up, soft dramatic low-key single source light preserving sharp features, studio dark, wearing ${isFemale ? 'a dramatic black asymmetrical top' : 'a charcoal turtleneck sweater'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-profile-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-profile-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `019-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Pure side profile, natural window light from behind creating silhouette edge, indoor, wearing ${isFemale ? 'a sheer black mesh long-sleeve' : 'a fitted black long-sleeve compression top'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-profile-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-profile-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `020-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Pure side profile, evening cloudy weather, city rooftop blurred background, wearing ${isFemale ? 'a metallic silver cropped jacket' : 'a sleek black puffer vest over hoodie'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-profile-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-profile-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `021-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Three-quarter view, eyes looking slightly down, soft morning light illuminating facial details, bedroom window setting, wearing ${isFemale ? 'a pastel lavender oversized button-up' : 'a soft mint green oxford shirt'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `022-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Three-quarter view with slight head tilt, looking towards camera, confident expression, mixed natural + studio lighting, modern workspace, wearing ${isFemale ? 'a tailored pinstripe blazer in soft gray over white tee' : 'a modern slim-fit navy blazer with white dress shirt'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `023-training-photo-set-${dimensionSuffix}.png`,
    // },

    // // Full-body shots — 10 total (increased diversity)
    // {
    //   prompt: `Full body standing front, relaxed pose hands in pockets, confident look, wearing ${isFemale ? 'high-waisted cream tailored trousers and silk blouse' : 'slim-fit dark gray chinos and white button-down'}, urban street golden hour. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `024-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body walking pose side view, natural stride, wearing ${isFemale ? 'a fitted short cocktail dress with spaghetti straps, high heels, sleek and elegant' : 'a slim fit charcoal suit with white dress shirt, no tie, mocassin, smart casual'}, overcast daylight, city sidewalk background. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `025-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body casual standing, looking over shoulder at camera, wearing ${isFemale ? 'a flowy white broderie anglaise midi sundress with thin straps and tiered skirt' : 'straight-leg beige chinos and olive utility shirt'}, soft forest diffused light, outdoor nature. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `026-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body sitting barefoot on the bed in the hotel, relaxed pose, arms at sides, visible ankles and toes, simple home interior soft light, wearing ${isFemale ? 'pink fitted racerback crop tank top and light gray fleece sweat shorts with elastic waistband' : 'relaxed gray joggers and white t-shirt'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `027-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body barefoot standing on beach sand, weight shifted to one leg, wearing ${isFemale ? 'stylish black bikini' : 'navy swim trunks with side stripes'}, golden hour ocean background. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `028-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body barefoot laying on the lounge chair on the beach, looking towards camera, wearing ${isFemale ? 'a breezy yellow floral wrap midi dress with short puff sleeves and v-neckline' : 'shorts and hawaiian shirt'}, golden hour ocean background. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `029-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body walking barefoot toward camera, natural stride, visible feet and toes, tropical path soft daylight, wearing ${isFemale ? 'a breezy white cover-up dress' : 'lightweight linen shorts and open white shirt'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `030-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body sitting on modern chair, legs crossed, thoughtful expression, wearing ${isFemale ? 'tailored black wide-leg trousers and silk blouse' : 'slim charcoal trousers and crisp white shirt'}, indoor cafe warm light. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `031-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body sitting cross-legged on ground barefoot, relaxed pose, wearing ${isFemale ? 'flowy boho pants in terracotta and cropped top' : 'relaxed-fit cargo shorts and graphic tee'}, visible bare feet and toes, park grass soft daylight. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `032-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body sitting on low wall barefoot, legs dangling, slight smile, visible ankles and toes, urban rooftop evening light, wearing ${isFemale ? 'high-waisted denim shorts and cropped hoodie' : 'relaxed black joggers and fitted tee'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
        
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `033-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body leaning against wall standing barefoot, arms crossed, confident pose, wearing ${isFemale ? 'minimalist all-black athleisure set' : 'modern all-black tracksuit with clean lines'}, studio even lighting in gym changing room. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `034-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body laying on the bed, wearing ${isFemale ? 'a soft sleep pink pajama' : 'gray modal lounge shorts and t-shirt'}, early morning sunrise. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `035-training-photo-set-${dimensionSuffix}.png`,
    // },

    // // // Upper-body & additional sitting/leaning variations
    // {
    //   prompt: `Upper body three-quarter pose standing, arms relaxed, neutral expression, wearing ${isFemale ? 'a cream knit polo sweater' : 'a taupe cashmere crewneck'}, soft natural park daylight. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `036-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Upper body portrait leaning against wall, subtle smile, wearing ${isFemale ? 'a structured blazer in chocolate brown over white tee' : 'a slim charcoal blazer over black turtleneck'}, dramatic neon evening city lighting. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `037-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Upper body three-quarter, arms crossed confident pose, wearing ${isFemale ? 'a tailored white power blazer with white t-shirt' : 'a modern navy suit jacket with white shirt'}, studio even lighting, plain background. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `038-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Upper body sitting on stool, thoughtful expression, leaning forward slightly, wearing ${isFemale ? 'a soft camel knit top' : 'a fitted olive green polo'}, warm indoor lamp light. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `039-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Upper body sitting on couch barefoot, legs tucked to side, relaxed pose, visible ankles, cozy living room setting, wearing ${isFemale ? 'an oversized chunky cardigan in oatmeal' : 'a soft gray hoodie'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `040-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Upper body standing three-quarter back view turning head, wearing ${isFemale ? 'a cropped denim jacket and high-neck top' : 'a black hoodie and relaxed jeans'}, urban street golden hour. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-quarter-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `041-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body close-up sitting, arms on knees barefoot, visible feet close to camera, soft indoor natural light, wearing ${isFemale ? 'a loose white linen shirt' : 'a relaxed white camp-collar shirt'}. ${baseIdentity}`,
    //   maxRuns,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `042-training-photo-set-${dimensionSuffix}.png`,
    // },

    // // Full body back view
    // {
    //   prompt: `Full body back view standing, hair fully visible from behind, arms relaxed at sides, urban street golden hour background, wearing ${isFemale ? 'high-waisted black tailored trousers and fitted white crop top' : 'slim dark navy chinos and white oxford shirt'}. ${baseIdentity}`,
    //   maxRuns: 1,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `043-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Full body back view standing barefoot on beach sand, hair visible from behind, relaxed pose, golden hour ocean background, wearing ${isFemale ? 'a stylish black bikini' : 'navy swim trunks with side stripes'}. ${baseIdentity}`,
    //   maxRuns: 1,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `044-training-photo-set-${dimensionSuffix}.png`,
    // },
    // {
    //   prompt: `Upper body back view, head slightly turned showing partial profile, hair detail visible, soft indoor natural window light, wearing ${isFemale ? 'a sleeveless open-back black top' : 'a relaxed gray crewneck sweatshirt'}. ${baseIdentity}`,
    //   maxRuns: 1,
    //   guidance,
    //   numSteps,
    //   similarityThreshold,
    //   imagePaths: [
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/002-training-photo-set-${dimensionSuffix}-final.png`,
    //   ],
    //   resultFileName: `045-training-photo-set-${dimensionSuffix}.png`,
    // },

    // // Extreme close-up
    // {
    //   prompt: `Extreme close-up portrait filling entire frame, eyes and nose only, sharp iris texture and detail, natural skin pores visible, soft diffused studio lighting, no harsh shadows, photorealistic macro. ${baseIdentity}`,
    //   maxRuns: 1,
    //   guidance,
    //   numSteps: 50,
    //   similarityThreshold: 0.9,
    //   imagePaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //   ],
    //   idPhotoPaths: [
    //     `${avatarMediaPath}/000-uploaded-front-portrait-${dimensionSuffix}.png`,
    //   ],
    //   resultFileName: `046-training-photo-set-${dimensionSuffix}.png`,
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