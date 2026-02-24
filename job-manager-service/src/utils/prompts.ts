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

  const bodyHariDesc = bodyHair === 'none' ? 'no body hair' : `with ${bodyHair} body hair`;
  const bodyDesc = `, ${body} body, ${bodyHariDesc} and ${bustSize} bust size`;
  
  const baseIdentity = `${AVATAR_REFERENCE_NAME}, the exact same person as in the reference images, identical face, identical facial features, skin texture, pores, eye color, hair, ultra-realistic photorealistic photo`;

  const qualitySuffix = ", sharp focus, photorealistic, DSLR quality, 8k, natural lighting balance, no artifacts";

  return [
    // Headshots & tight portraits (strong face lock)
    `${baseIdentity}, front view close-up headshot, neutral calm expression, soft even studio lighting, plain light gray background${qualitySuffix}`,
    `${baseIdentity}, front-facing portrait, subtle thoughtful expression looking slightly upward, warm natural window light from left, indoor neutral setting${qualitySuffix}`,
    `${baseIdentity}, direct gaze at camera, very slight gentle smile, golden hour soft side lighting, outdoor blurred park background${qualitySuffix}`,
    `${baseIdentity}, front view, relaxed neutral face, dramatic low-key lighting with soft rim light, dark studio background${qualitySuffix}`,
    `${baseIdentity}, close frontal portrait, eyes looking straight, mild surprise expression, cool blue-toned office lighting, modern indoor environment${qualitySuffix}`,
    `${baseIdentity}, front view, confident direct stare, harsh midday sunlight with soft shadows, urban street blurred backdrop${qualitySuffix}`,
    `${baseIdentity}, portrait, subtle curious expression, warm candle-like indoor lighting, cozy living room setting${qualitySuffix}`,
    `${baseIdentity}, front view upper chest included, soft smile, evening warm tungsten light, blurred city night background${bodyDesc}${qualitySuffix}`,

    // 3/4 and profile angles (good angular coverage)
    `${baseIdentity}, three-quarter view facing left, neutral expression, soft natural daylight from window, indoor cafe setting${qualitySuffix}`,
    `${baseIdentity}, 3/4 right angle portrait, thoughtful gaze slightly away, golden hour warm side lighting, outdoor blurred nature${qualitySuffix}`,
    `${baseIdentity}, three-quarter left, mild happy expression, dramatic cinematic side lighting with rim, dark moody background${qualitySuffix}`,
    `${baseIdentity}, 3/4 facing right, relaxed neutral, cool overcast daylight, urban street environment${qualitySuffix}`,
    `${baseIdentity}, three-quarter view, subtle surprised look, warm sunset backlight with front fill, park scenery${qualitySuffix}`,
    `${baseIdentity}, 3/4 angle left, calm serene face, soft indoor lamp light, home interior blurred${qualitySuffix}`,
    `${baseIdentity}, pure left profile view, neutral expression, soft even side lighting, plain background${qualitySuffix}`,
    `${baseIdentity}, right side profile, looking forward, warm golden hour rim light, outdoor blurred${qualitySuffix}`,

    // Additional profiles & dynamic head angles
    `${baseIdentity}, left profile close-up, thoughtful expression, dramatic low-key single source light, studio dark${qualitySuffix}`,
    `${baseIdentity}, side view right, relaxed face, natural window light from behind creating silhouette edge, indoor${qualitySuffix}`,
    `${baseIdentity}, profile left, subtle smile, cool blue evening light, city rooftop blurred background${qualitySuffix}`,
    `${baseIdentity}, three-quarter right looking slightly down, gentle expression, soft morning light, bedroom window setting${qualitySuffix}`,
    `${baseIdentity}, front three-quarter slight head tilt, confident expression, mixed natural + studio lighting, modern workspace${qualitySuffix}`,

    // Full-body shots — 10 total (increased diversity)
    `${baseIdentity}, full body standing front, relaxed pose hands in pockets, confident look, wearing black hoodie and cargo pants${bodyDesc}, urban street golden hour${qualitySuffix}`,
    `${baseIdentity}, full body walking pose side view, natural stride, wearing athletic tank top and shorts${bodyDesc}, overcast daylight, city sidewalk background${qualitySuffix}`,
    `${baseIdentity}, full body casual standing, looking over shoulder at camera, ${isFemale ? 'wearing light summer sundress' : 'wearing casual polo shirt and chinos'}${bodyDesc}, soft forest diffused light, outdoor nature${qualitySuffix}`,
    `${baseIdentity}, full body standing barefoot on wooden floor, relaxed pose, arms at sides, visible ankles and toes, simple home interior soft light${bodyDesc}${qualitySuffix}`,
    `${baseIdentity}, full body barefoot standing on beach sand, weight shifted to one leg, casual summer outfit${bodyDesc}, golden hour ocean background${qualitySuffix}`,
    `${baseIdentity}, full body barefoot laying on the lounge chair on the beach, wearing black swimming suit${bodyDesc}, golden hour ocean background${qualitySuffix}`,
    `${baseIdentity}, full body walking barefoot toward camera, natural stride, visible feet and toes, tropical path soft daylight${bodyDesc}${qualitySuffix}`,
    `${baseIdentity}, full body sitting on modern chair, legs crossed, thoughtful expression, wearing light button-up and chinos${bodyDesc}, indoor cafe warm light${qualitySuffix}`,
    `${baseIdentity}, full body sitting cross-legged on ground barefoot, relaxed pose, wearing casual shorts, visible bare feet and toes, park grass soft daylight${bodyDesc}${qualitySuffix}`,
    `${baseIdentity}, full body sitting on low wall barefoot, legs dangling, subtle smile, visible ankles and toes, urban rooftop evening light${bodyDesc}${qualitySuffix}`,
    `${baseIdentity}, full body leaning against wall standing barefoot, arms crossed, confident pose, simple crew-neck sweater and pants${bodyDesc}, studio even lighting${qualitySuffix}`,
    `${baseIdentity}, full body laying on the bed, wearing pajama${bodyDesc}, early morning sunrise${qualitySuffix}`,

    // Upper-body & additional sitting/leaning variations
    `${baseIdentity}, upper body three-quarter pose standing, arms relaxed, neutral expression, wearing casual white t-shirt and jeans${bodyDesc}, soft natural park daylight${qualitySuffix}`,
    `${baseIdentity}, upper body portrait leaning against wall, subtle smile, wearing dark blazer over neutral shirt${bodyDesc}, dramatic neon evening city lighting${qualitySuffix}`,
    `${baseIdentity}, upper body three-quarter, arms crossed confident pose, wearing simple crew-neck sweater${bodyDesc}, studio even lighting, plain background${qualitySuffix}`,
    `${baseIdentity}, upper body sitting on stool, thoughtful expression, leaning forward slightly, wearing casual shirt${bodyDesc}, warm indoor lamp light${qualitySuffix}`,
    `${baseIdentity}, upper body sitting on couch barefoot, legs tucked to side, relaxed pose, visible ankles, cozy living room setting${bodyDesc}${qualitySuffix}`,
    `${baseIdentity}, upper body standing three-quarter back view turning head, casual hoodie${bodyDesc}, urban street golden hour${qualitySuffix}`,
    `${baseIdentity}, upper body close-up sitting, arms on knees barefoot, visible feet close to camera, soft indoor natural light${bodyDesc}${qualitySuffix}`
  ];
};

export const generatePhotoSetCaptions = (parameters: AvatarParameters & {gender: string}): string[] => {
  const { gender, body, bustSize } = parameters;

  const isFemale = gender === 'female';
  const bodyDesc = `${body} and ${bustSize}`;

  return [
    // 1–10: Headshots & tight portraits
    `${AVATAR_REFERENCE_NAME} front view close-up headshot neutral expression soft studio lighting plain background`,
    `${AVATAR_REFERENCE_NAME} front portrait thoughtful expression warm window light indoor setting`,
    `${AVATAR_REFERENCE_NAME} direct gaze slight gentle smile golden hour outdoor park`,
    `${AVATAR_REFERENCE_NAME} front relaxed neutral face dramatic low-key lighting dark studio`,
    `${AVATAR_REFERENCE_NAME} close frontal portrait mild surprise expression cool office lighting modern interior`,
    `${AVATAR_REFERENCE_NAME} front confident direct stare harsh midday sunlight urban street`,
    `${AVATAR_REFERENCE_NAME} portrait subtle curious expression warm candle indoor cozy room`,
    `${AVATAR_REFERENCE_NAME} front view upper chest included soft smile evening tungsten light city night background ${bustSize}`,

    // 11–18: 3/4 and profile angles
    `${AVATAR_REFERENCE_NAME} three-quarter left neutral soft cafe daylight`,
    `${AVATAR_REFERENCE_NAME} 3/4 right thoughtful golden hour nature`,
    `${AVATAR_REFERENCE_NAME} three-quarter left happy cinematic moody`,
    `${AVATAR_REFERENCE_NAME} 3/4 right relaxed overcast urban`,
    `${AVATAR_REFERENCE_NAME} three-quarter surprised sunset park`,
    `${AVATAR_REFERENCE_NAME} 3/4 left serene indoor lamp home`,
    `${AVATAR_REFERENCE_NAME} left profile neutral soft side lighting plain`,
    `${AVATAR_REFERENCE_NAME} right profile forward golden hour rim outdoor`,

    // 19–23: Additional profiles & dynamic head angles
    `${AVATAR_REFERENCE_NAME} left profile close-up thoughtful dramatic low-key studio`,
    `${AVATAR_REFERENCE_NAME} side view right relaxed window backlight indoor`,
    `${AVATAR_REFERENCE_NAME} profile left subtle smile blue evening city rooftop`,
    `${AVATAR_REFERENCE_NAME} three-quarter right looking slightly down gentle morning bedroom light`,
    `${AVATAR_REFERENCE_NAME} front three-quarter slight head tilt confident mixed natural studio workspace`,

    // 24–33: Full-body shots (10 total — increased diversity)
    `${AVATAR_REFERENCE_NAME} full body standing front relaxed hands in pockets confident wearing black hoodie cargo pants ${bodyDesc} urban street golden hour`,
    `${AVATAR_REFERENCE_NAME} full body walking side view natural stride wearing athletic tank top shorts ${bodyDesc} overcast city sidewalk`,
    `${AVATAR_REFERENCE_NAME} full body casual standing looking over shoulder ${isFemale ? 'wearing light summer sundress' : 'wearing casual polo shirt chinos'} ${bodyDesc} soft forest outdoor nature`,
    `${AVATAR_REFERENCE_NAME} full body standing barefoot relaxed arms at sides visible ankles toes wearing simple home outfit ${bodyDesc} wooden floor soft indoor light`,
    `${AVATAR_REFERENCE_NAME} full body barefoot standing on beach weight shifted casual summer outfit ${bodyDesc} golden hour ocean`,
    `${AVATAR_REFERENCE_NAME} full body barefoot laying on the lounge chair on the beach wearing black smimming suit ${bodyDesc} golden hour ocean`,
    `${AVATAR_REFERENCE_NAME} full body walking barefoot toward camera natural stride visible feet toes tropical path ${bodyDesc} soft daylight`,
    `${AVATAR_REFERENCE_NAME} full body sitting on chair legs crossed thoughtful wearing light button-up chinos ${bodyDesc} indoor cafe warm light`,
    `${AVATAR_REFERENCE_NAME} full body sitting cross-legged on ground barefoot relaxed wearing casual shorts visible bare feet toes ${bodyDesc} park grass daylight`,
    `${AVATAR_REFERENCE_NAME} full body sitting on low wall barefoot legs dangling subtle smile visible ankles toes ${bodyDesc} urban rooftop evening`,
    `${AVATAR_REFERENCE_NAME} full body leaning against wall standing barefoot arms crossed confident wearing crew-neck sweater pants ${bodyDesc} studio even lighting`,
    `${AVATAR_REFERENCE_NAME} full body laying on the bed wearing pajama ${bodyDesc} early morning sunrise`,

    // 34–40: Upper-body & additional sitting/leaning variations
    `${AVATAR_REFERENCE_NAME} upper body three-quarter standing arms relaxed neutral wearing casual white t-shirt jeans ${bodyDesc} soft park daylight`,
    `${AVATAR_REFERENCE_NAME} upper body portrait leaning against wall subtle smile wearing dark blazer neutral shirt ${bodyDesc} neon evening city`,
    `${AVATAR_REFERENCE_NAME} upper body three-quarter arms crossed confident wearing simple crew-neck sweater ${bodyDesc} studio even lighting plain background`,
    `${AVATAR_REFERENCE_NAME} upper body sitting on stool thoughtful leaning forward wearing casual shirt ${bodyDesc} warm indoor lamp light`,
    `${AVATAR_REFERENCE_NAME} upper body sitting on couch barefoot legs tucked visible ankles relaxed cozy living room ${bodyDesc}`,
    `${AVATAR_REFERENCE_NAME} upper body standing three-quarter back view turning head casual hoodie ${bodyDesc} urban street golden hour`,
    `${AVATAR_REFERENCE_NAME} upper body close-up sitting arms on knees barefoot visible feet close camera soft indoor natural light ${bodyDesc}`
  ];
};