import { AvatarParameters } from '../types/avatar';

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
  const bodyHariDesc = bodyHair === 'none' ? 'no body hair' : `with ${bodyHair} body hair`;

  let prompt = `Ultra-realistic passport-style ID photo, professional studio portrait of a ${age}-year-old ${ethnicity} ${gender} with ${skinColor} skin tone, `;

  if (attractiveness) prompt += `${attractiveness} appearance, `;
  prompt += `${face} face, ${eyes} eyes with ${eyeLashes} eyelashes and ${eyeBrows} eyebrows, ${nose} nose, ${ears} ears, ${lips} lips, `;

  if (facialHairDesc) prompt += `${facialHairDesc}, `;
  prompt += `${hairColor} hair in ${hairStyle} style, `;

  if (body || bustSize) prompt += `with ${body} build${bustSize ? ` and ${bustSize} bust` : ''}, `;
  if (bodyHariDesc) prompt += `${bodyHariDesc}, `

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

export const generatePhotoSetPrompts = (parameters: AvatarParameters & {gender: string}): string[] => {
  const { gender, body, bodyHair, bustSize } = parameters;

  const isFemale = gender === 'female';

  // Fix: Corrected variable naming and typos
  const bodyHairDesc = bodyHair === 'none' ? 'no body hair' : `with ${bodyHair} body hair`;
  const bodyDesc = `, ${body} body, ${bodyHairDesc} and ${bustSize} bust size`;
  
  const baseIdentity = `${AVATAR_REFERENCE_NAME}, identical facial features, highly detailed skin texture, pores, natural eye color, ultra-realistic photorealistic photo`;

  const qualitySuffix = ", sharp focus, DSLR quality, 8k, natural lighting balance, high resolution, no artifacts";

  return [
    // --- Headshots & Tight Portraits (Face Lock) ---
    `${baseIdentity}, front view close-up headshot, neutral calm expression, soft even studio lighting, plain light gray background, wearing white shirt with open top buttons${qualitySuffix}`,
    `${baseIdentity}, front-facing portrait, subtle thoughtful expression looking slightly upward, warm natural window light from left, indoor neutral setting, wearing dark gray t-shirt${qualitySuffix}`,
    `${baseIdentity}, direct gaze at camera, very slight gentle smile, golden hour soft side lighting, outdoor blurred park background, wearing dark green t-shirt${qualitySuffix}`,
    `${baseIdentity}, front view, relaxed neutral face, dramatic low-key lighting with soft rim light, dark studio background, wearing black shirt${qualitySuffix}`,
    `${baseIdentity}, close frontal portrait, eyes looking straight, mild surprise expression, cool blue-toned office lighting, modern indoor environment, wearing light blue shirt and dark jacket${qualitySuffix}`,
    `${baseIdentity}, front view, confident direct stare, harsh midday sunlight with soft shadows, urban street blurred backdrop, wearing light gray t-shirt${qualitySuffix}`,
    `${baseIdentity}, portrait, subtle curious expression, warm candle-like indoor lighting, cozy living room setting, wearing pastel yellow home t-shirt${qualitySuffix}`,
    `${baseIdentity}, front view upper chest included, soft smile, evening warm tungsten light, blurred city night background, wearing red shirt${bodyDesc}${qualitySuffix}`,

    // --- 3/4 and Profile Angles (Angular Coverage) ---
    `${baseIdentity}, three-quarter view facing left, neutral expression, soft natural daylight from window, indoor cafe setting, wearing casual clothes${qualitySuffix}`,
    `${baseIdentity}, 3/4 right angle portrait, thoughtful gaze slightly away, golden hour warm side lighting, outdoor blurred nature, wearing sleeveless white t-shirt${qualitySuffix}`,
    `${baseIdentity}, three-quarter left, mild happy expression, dramatic cinematic side lighting with rim, dark moody background, wearing dark gray sweater${qualitySuffix}`,
    `${baseIdentity}, 3/4 facing right, relaxed neutral, cool overcast daylight, urban street environment, wearing light gray hoodie${qualitySuffix}`,
    `${baseIdentity}, three-quarter view, subtle surprised look, warm sunset backlight with front fill, park scenery, wearing pink shirt${qualitySuffix}`,
    `${baseIdentity}, 3/4 angle left, calm serene face, soft indoor lamp light, home interior blurred, wearing dark gray home t-shirt${qualitySuffix}`,
    `${baseIdentity}, pure left profile view, neutral expression, soft even side lighting, plain background, wearing dark blue shirt${qualitySuffix}`,
    `${baseIdentity}, right side profile, looking forward, warm golden hour rim light, outdoor blurred, wearing black turtleneck sweater${qualitySuffix}`,

    // --- Additional Profiles & Dynamic Head Angles ---
    `${baseIdentity}, left profile close-up, thoughtful expression, dramatic low-key single source light, studio dark, wearing dark brown t-shirt${qualitySuffix}`,
    `${baseIdentity}, side view right, relaxed face, natural window light from behind creating silhouette edge, indoor, wearing yellow shirt${qualitySuffix}`,
    `${baseIdentity}, profile left, subtle smile, cool blue evening light, city rooftop blurred background, wearing orange t-shirt${qualitySuffix}`,
    `${baseIdentity}, three-quarter right looking slightly down, gentle expression, soft morning light, bedroom window setting, wearing army green flannel shirt${qualitySuffix}`,
    `${baseIdentity}, front three-quarter slight head tilt, confident expression, mixed natural + studio lighting, modern workspace, wearing white shirt and light gray jacket${qualitySuffix}`,

    // --- Full-Body Shots (Diversity Boost) ---
    `${baseIdentity}, full body standing front, relaxed pose hands in pockets, confident look, wearing black hoodie and cargo pants${bodyDesc}, urban street golden hour${qualitySuffix}`,
    `${baseIdentity}, full body walking pose side view, natural stride, wearing athletic tank top and shorts${bodyDesc}, overcast daylight, city sidewalk background${qualitySuffix}`,
    `${baseIdentity}, full body casual standing, looking over shoulder at camera, ${isFemale ? 'wearing light summer sundress' : 'wearing casual polo shirt and chinos'}${bodyDesc}, soft forest diffused light, outdoor nature${qualitySuffix}`,
    `${baseIdentity}, full body standing barefoot on wooden floor, relaxed pose, arms at sides, simple home interior soft light, wearing white shirt and dark blue shorts${bodyDesc}${qualitySuffix}`,
    `${baseIdentity}, full body barefoot standing on beach sand, wearing ${isFemale ? 'red bikini' : 'red swimming shorts'}${bodyDesc}, golden hour ocean background${qualitySuffix}`,
    `${baseIdentity}, full body barefoot laying on the lounge chair on the beach, wearing ${isFemale ? 'white skirt and pastel pink blouse' : 'Hawaiian shirt and white shorts'}${bodyDesc}, golden hour ocean background${qualitySuffix}`,
    `${baseIdentity}, full body walking barefoot toward camera, natural stride, visible feet, tropical path soft daylight, wearing denim shorts and white t-shirt${bodyDesc}${qualitySuffix}`,
    `${baseIdentity}, full body sitting on modern chair, legs crossed at the knee, thoughtful expression, wearing light button-up and chinos${bodyDesc}, indoor cafe warm light${qualitySuffix}`,
    `${baseIdentity}, full body sitting cross-legged on ground barefoot, relaxed pose, wearing casual shorts and shirt, park grass soft daylight${bodyDesc}${qualitySuffix}`,
    `${baseIdentity}, full body sitting on low wall barefoot, legs dangling, hands supporting the body on the sides, subtle smile, urban rooftop evening light, wearing tracksuit${bodyDesc}${qualitySuffix}`,
    `${baseIdentity}, full body leaning against wall standing barefoot, arms crossed, confident pose, simple crew-neck sweater and pants${bodyDesc}, studio even lighting${qualitySuffix}`,
    `${baseIdentity}, full body laying on the bed, wearing neutral color pajama set${bodyDesc}, early morning sunrise${qualitySuffix}`,

    // --- Upper-Body & Variations ---
    `${baseIdentity}, upper body three-quarter pose standing, arms relaxed, wearing casual white t-shirt and jeans${bodyDesc}, soft natural park daylight${qualitySuffix}`,
    `${baseIdentity}, upper body portrait leaning against wall, subtle smile, wearing dark blazer over neutral shirt${bodyDesc}, dramatic neon evening city lighting${qualitySuffix}`,
    `${baseIdentity}, upper body three-quarter, arms crossed, wearing a textured wool cable-knit sweater${bodyDesc}, studio even lighting, plain background${qualitySuffix}`,
    `${baseIdentity}, upper body sitting on stool, thoughtful expression, leaning forward slightly, wearing casual shirt${bodyDesc}, warm indoor lamp light${qualitySuffix}`,
    `${baseIdentity}, upper body sitting on couch barefoot, legs tucked to side positioned parallel one to another, relaxed pose, cozy living room setting, wearing light blue jeans and white sleeveless t-shirt${bodyDesc}${qualitySuffix}`,
    `${baseIdentity}, upper body standing three-quarter back view turning head, casual hoodie${bodyDesc}, urban street golden hour${qualitySuffix}`,
    `${baseIdentity}, upper body close-up sitting, arms on knees barefoot, visible feet, soft indoor natural light, wearing light gray home shorts and t-shirt${bodyDesc}${qualitySuffix}`
  ];
};

export const generatePhotoSetCaptions = (parameters: AvatarParameters & {gender: string}): string[] => {
  const { gender, body, bustSize } = parameters;
  const isFemale = gender === 'female';
  
  const bodyTag = `${body} build, ${bustSize} bust`;

  return [
    // --- Headshots: Isolating Upper Garments ---
    `${AVATAR_REFERENCE_NAME}, close-up headshot, front view, white button-down shirt, open collar, studio lighting`,
    `${AVATAR_REFERENCE_NAME}, portrait, thoughtful expression, dark gray cotton t-shirt, indoor window light`,
    `${AVATAR_REFERENCE_NAME}, front view, gentle smile, dark green crew-neck t-shirt, outdoor park, golden hour`,
    `${AVATAR_REFERENCE_NAME}, front view, black dress shirt, low-key lighting, rim light, dark studio`,
    `${AVATAR_REFERENCE_NAME}, frontal portrait, light blue collared shirt, dark suit jacket, office environment`,
    `${AVATAR_REFERENCE_NAME}, front view, direct stare, light gray t-shirt, harsh sunlight, urban street`,
    `${AVATAR_REFERENCE_NAME}, portrait, curious expression, pastel yellow t-shirt, cozy living room, warm light`,
    `${AVATAR_REFERENCE_NAME}, upper chest view, soft smile, red silk shirt, city night background, ${bustSize}`,

    // --- Angles & Profiles: Defining Silhouettes ---
    `${AVATAR_REFERENCE_NAME}, 3/4 view left, casual clothes, indoor cafe, natural daylight`,
    `${AVATAR_REFERENCE_NAME}, 3/4 view right, white sleeveless tank top, outdoor nature, side lighting`,
    `${AVATAR_REFERENCE_NAME}, 3/4 view left, happy expression, dark gray knit sweater, cinematic lighting`,
    `${AVATAR_REFERENCE_NAME}, 3/4 view right, light gray fleece hoodie, urban street, overcast daylight`,
    `${AVATAR_REFERENCE_NAME}, 3/4 view, pink button-up shirt, park scenery, sunset backlight`,
    `${AVATAR_REFERENCE_NAME}, 3/4 view left, dark gray home t-shirt, indoor lamp light`,
    `${AVATAR_REFERENCE_NAME}, left profile, dark blue shirt, even side lighting, plain background`,
    `${AVATAR_REFERENCE_NAME}, right profile, black turtleneck sweater, golden hour rim light`,

    // --- Specific Textures & Layers ---
    `${AVATAR_REFERENCE_NAME}, left profile close-up, dark brown t-shirt, low-key lighting`,
    `${AVATAR_REFERENCE_NAME}, side view right, yellow cotton shirt, window backlight, silhouette edge`,
    `${AVATAR_REFERENCE_NAME}, left profile, orange t-shirt, rooftop background, blue evening light`,
    `${AVATAR_REFERENCE_NAME}, 3/4 view right, army green flannel shirt, bedroom window, morning light`,
    `${AVATAR_REFERENCE_NAME}, 3/4 view, white dress shirt, gray blazer, modern workspace, mixed lighting`,

    // --- Full Body: Separating Person from Outfit & Environment ---
    `${AVATAR_REFERENCE_NAME}, full body, black oversized hoodie, cargo pants, ${bodyTag}, urban street, golden hour`,
    `${AVATAR_REFERENCE_NAME}, full body, athletic tank top, spandex shorts, ${bodyTag}, city sidewalk`,
    `${AVATAR_REFERENCE_NAME}, full body, ${isFemale ? 'floral summer sundress' : 'polo shirt, khaki chinos'}, ${bodyTag}, forest nature`,
    `${AVATAR_REFERENCE_NAME}, full body, barefoot, white linen shirt, dark blue shorts, visible ankles and toes, ${bodyTag}, wooden floor`,
    `${AVATAR_REFERENCE_NAME}, full body, barefoot, wearing ${isFemale ? 'red bikini' : 'red swimming shorts'}, ${bodyTag}, beach, ocean background`,
    `${AVATAR_REFERENCE_NAME}, full body, barefoot, wearing ${isFemale ? 'white skirt, pink blouse' : 'Hawaiian patterned shirt, white shorts'}, ${bodyTag}, lounge chair`,
    `${AVATAR_REFERENCE_NAME}, full body, walking barefoot, denim shorts, white t-shirt, visible feet and toes, ${bodyTag}, tropical path`,
    `${AVATAR_REFERENCE_NAME}, full body, sitting, light blue button-up shirt, tan chinos, ${bodyTag}, cafe, warm light`,
    `${AVATAR_REFERENCE_NAME}, full body, sitting cross-legged, barefoot, casual cotton shorts, t-shirt, visible feet, ${bodyTag}, park grass`,
    `${AVATAR_REFERENCE_NAME}, full body, sitting on low wall, barefoot, gray tracksuit, visible ankles, ${bodyTag}, rooftop, evening`,
    `${AVATAR_REFERENCE_NAME}, full body, leaning against wall, barefoot, wool crew-neck sweater, trousers, ${bodyTag}, studio lighting`,
    `${AVATAR_REFERENCE_NAME}, full body, laying on bed, neutral colored pajamas, ${bodyTag}, sunrise lighting`,

    // --- Upper Body: Final Variety Check ---
    `${AVATAR_REFERENCE_NAME}, upper body, white t-shirt, blue jeans, ${bodyTag}, park daylight`,
    `${AVATAR_REFERENCE_NAME}, upper body, navy blazer, neutral inner shirt, ${bodyTag}, neon city lighting`,
    `${AVATAR_REFERENCE_NAME}, upper body, textured cable-knit sweater, ${bodyTag}, studio lighting`,
    `${AVATAR_REFERENCE_NAME}, upper body, sitting, olive green casual shirt, ${bodyTag}, indoor lamp light`,
    `${AVATAR_REFERENCE_NAME}, upper body, sitting on couch, barefoot, light blue jeans, sleeveless t-shirt, ${bodyTag}, living room`,
    `${AVATAR_REFERENCE_NAME}, upper body, back view turning head, black hoodie, ${bodyTag}, urban street`,
    `${AVATAR_REFERENCE_NAME}, upper body, close-up sitting, barefoot, gray home shorts, matching t-shirt, ${bodyTag}, natural light`
  ];
};