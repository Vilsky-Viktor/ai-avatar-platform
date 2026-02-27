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

export const generatePhotoSetPrompts = (parameters: AvatarParameters & {gender: string}): string[] => {
  const { gender, body, bodyHair, bustSize } = parameters;

  const isFemale = gender === 'female';

  const bodyHairDesc = bodyHair === 'none' ? 'no body hair' : `with ${bodyHair} body hair`;
  const bodyDesc = `, ${body} body, ${bodyHairDesc} and ${bustSize} bust size`;
  
  const baseIdentity = `Maintain exactly same face, facial features, body, skin texture, eye color and hair style as in the reference images`;

return [
    // Headshots & tight portraits (strong face lock)
    `${baseIdentity}, front view close-up headshot, neutral calm expression, soft even studio lighting, plain light gray background, wearing ${isFemale ? 'a crisp white silk blouse with subtle pearl buttons' : 'a fitted charcoal gray crewneck t-shirt under an open navy blazer'}`,
    `${baseIdentity}, front-facing portrait, subtle thoughtful expression looking slightly upward, warm natural window light from left, indoor neutral setting, wearing ${isFemale ? 'a soft beige cashmere turtleneck sweater' : 'a slim-fit olive green henley shirt'}`,
    `${baseIdentity}, direct gaze at camera, very slight gentle smile, golden hour soft side lighting, outdoor blurred park background, wearing ${isFemale ? 'a flowy off-white linen button-up shirt' : 'a relaxed-fit white linen shirt with rolled sleeves'}`,
    `${baseIdentity}, front view, relaxed neutral face, dramatic low-key lighting with soft rim light, dark studio background, wearing ${isFemale ? 'a sleek black mock-neck top' : 'a deep charcoal slim-fit polo'}`,
    `${baseIdentity}, close frontal portrait, eyes looking straight, mild surprise expression, cool blue-toned office lighting, modern indoor environment, wearing ${isFemale ? 'a tailored pale blue Oxford shirt' : 'a modern business casual light gray button-down with micro-check pattern'}`,
    `${baseIdentity}, front view, confident direct stare, harsh midday sunlight with soft shadows, urban street blurred backdrop, wearing ${isFemale ? 'a cropped black leather jacket over a white tank' : 'a black bomber jacket over a gray graphic tee'}`,
    `${baseIdentity}, portrait, subtle curious expression, warm candle-like indoor lighting, cozy living room setting, wearing ${isFemale ? 'a chunky cream cable-knit sweater' : 'a soft taupe merino wool crewneck'}`,
    `${baseIdentity}, front view upper chest included, soft smile, evening warm tungsten light, blurred city night background, wearing ${isFemale ? 'a silky emerald green camisole with delicate straps' : 'a fitted black turtleneck under a charcoal overcoat'}${bodyDesc}`,

    // // 3/4 and profile angles (good angular coverage)
    `${baseIdentity}, three-quarter view facing left, neutral expression, soft natural daylight from window, indoor cafe setting, wearing ${isFemale ? 'a relaxed beige trench coat over a cream turtleneck' : 'a camel overcoat layered over a white crewneck'}`,
    `${baseIdentity}, 3/4 right angle portrait, thoughtful gaze slightly away, golden hour warm side lighting, outdoor blurred nature, wearing ${isFemale ? 'a flowy terracotta midi dress with subtle puff sleeves' : 'a rust-colored chore jacket over a white tee'}`,
    `${baseIdentity}, three-quarter left, soft dramatic cinematic side lighting with rim preserving facial details, dark moody background, wearing ${isFemale ? 'a structured black blazer with strong shoulders' : 'a tailored navy suit jacket unbuttoned over white shirt'}, hyper-realistic detailed face, sharp facial features`,
    `${baseIdentity}, 3/4 facing right, relaxed neutral, cool overcast daylight, urban street environment, wearing ${isFemale ? 'oversized denim jacket in medium wash over cropped hoodie' : 'baggy cargo pants with a black tech hoodie'}`,
    `${baseIdentity}, three-quarter view, subtle surprised look with closed mouth, warm sunset backlight with front fill, park scenery, wearing ${isFemale ? 'a butter-yellow linen blazer and matching shorts' : 'a lightweight khaki utility jacket and cream chinos'}`,
    `${baseIdentity}, 3/4 angle left, calm serene face, soft indoor lamp light, home interior blurred, wearing ${isFemale ? 'a cozy oversized oatmeal cardigan' : 'a soft gray zip-up hoodie'}`,
    `${baseIdentity}, pure left side profile view exactly matching reference proportions, neutral expression with no rotation distortion, soft even side lighting gently illuminating the full clear profile silhouette, jawline, nose bridge, ear position and eye contour visible, plain background, wearing ${isFemale ? 'a high-neck ribbed black top' : 'a fitted ribbed gray long-sleeve tee'}, exact same face and identity as reference image, preserve identical side facial structure proportions bone structure and features, hyper-realistic detailed face, sharp consistent facial identity`,
    `${baseIdentity}, right side profile, looking forward, warm golden hour rim light, outdoor blurred, wearing ${isFemale ? 'a sleeveless white linen top' : 'a relaxed white linen camp-collar shirt'}`,

    // Additional profiles & dynamic head angles
    `${baseIdentity}, left profile close-up, soft dramatic low-key single source light preserving sharp features, studio dark, wearing ${isFemale ? 'a dramatic black asymmetrical top' : 'a charcoal turtleneck sweater'}, hyper-realistic detailed face, clear eyes and profile details`,
    `${baseIdentity}, side view right, relaxed face, natural window light from behind creating silhouette edge, indoor, wearing ${isFemale ? 'a sheer black mesh long-sleeve' : 'a fitted black long-sleeve compression top'}`,
    `${baseIdentity}, profile left side, evening cloudy weather, city rooftop blurred background, wearing ${isFemale ? 'a metallic silver cropped jacket' : 'a sleek black puffer vest over hoodie'}`,
    `${baseIdentity}, three-quarter right looking slightly down, soft morning light illuminating facial details, bedroom window setting, wearing ${isFemale ? 'a pastel lavender oversized button-up' : 'a soft mint green oxford shirt'}, hyper-realistic detailed face, sharp eyes and expression from reference images`,
    `${baseIdentity}, front three-quarter slight head tilt, confident expression, mixed natural + studio lighting, modern workspace, wearing ${isFemale ? 'a tailored pinstripe blazer in soft gray over white tee' : 'a modern slim-fit navy blazer with white dress shirt'}`,

    // Full-body shots — 10 total (increased diversity)
    `${baseIdentity}, full body standing front, relaxed pose hands in pockets, confident look, wearing ${isFemale ? 'high-waisted cream tailored trousers and silk blouse' : 'slim-fit dark gray chinos and white button-down'}${bodyDesc}, urban street golden hour`,
    `${baseIdentity}, full body walking pose side view, natural stride, wearing ${isFemale ? 'wide-leg black denim jeans and cropped leather jacket' : 'relaxed olive cargo pants and black tech hoodie'}${bodyDesc}, overcast daylight, city sidewalk background`,
    `${baseIdentity}, full body casual standing, looking over shoulder at camera, wearing ${isFemale ? 'flowy midi skirt in sage green with fitted tank' : 'straight-leg beige chinos and olive utility shirt'}${bodyDesc}, soft forest diffused light, outdoor nature`,
    `${baseIdentity}, full body standing barefoot on wooden floor, relaxed pose, arms at sides, visible ankles and toes, simple home interior soft light, wearing ${isFemale ? 'cozy oversized linen shirt dress in off-white' : 'relaxed gray joggers and white t-shirt'}${bodyDesc}, in the hotel room`,
    `${baseIdentity}, full body barefoot standing on beach sand, weight shifted to one leg, wearing ${isFemale ? 'a chic white one-piece swimsuit with high-cut legs' : 'navy swim trunks with side stripes'}${bodyDesc}, golden hour ocean background`,
    `${baseIdentity}, full body barefoot laying on the lounge chair on the beach, wearing ${isFemale ? 'a stylish black bikini with gold hardware' : 'charcoal swim shorts'}${bodyDesc}, golden hour ocean background`,
    `${baseIdentity}, full body walking barefoot toward camera, natural stride, visible feet and toes, tropical path soft daylight, wearing ${isFemale ? 'a breezy white cover-up dress' : 'lightweight linen shorts and open white shirt'}${bodyDesc}`,
    `${baseIdentity}, full body sitting on modern chair, legs crossed, thoughtful expression, wearing ${isFemale ? 'tailored black wide-leg trousers and silk blouse' : 'slim charcoal trousers and crisp white shirt'}${bodyDesc}, indoor cafe warm light`,
    `${baseIdentity}, full body sitting cross-legged on ground barefoot, relaxed pose, wearing ${isFemale ? 'flowy boho pants in terracotta and cropped top' : 'relaxed-fit cargo shorts and graphic tee'}${bodyDesc}, visible bare feet and toes, park grass soft daylight`,
    `${baseIdentity}, full body sitting on low wall barefoot, legs dangling, subtle smile, visible ankles and toes, urban rooftop evening light, wearing ${isFemale ? 'high-waisted denim shorts and cropped hoodie' : 'relaxed black joggers and fitted tee'}`,
    `${baseIdentity}, full body leaning against wall standing barefoot, arms crossed, confident pose, wearing ${isFemale ? 'minimalist all-black athleisure set' : 'modern all-black tracksuit with clean lines'}${bodyDesc}, studio even lighting in the hallway`,
    `${baseIdentity}, full body laying on the bed, wearing ${isFemale ? 'a soft oversized sleep shirt in pale pink' : 'gray modal lounge shorts and t-shirt'}${bodyDesc}, early morning sunrise`,

    // Upper-body & additional sitting/leaning variations
    `${baseIdentity}, upper body three-quarter pose standing, arms relaxed, neutral expression, wearing ${isFemale ? 'a cream knit polo sweater' : 'a taupe cashmere crewneck'}${bodyDesc}, soft natural park daylight`,
    `${baseIdentity}, upper body portrait leaning against wall, subtle smile, wearing ${isFemale ? 'a structured blazer in chocolate brown over white tee' : 'a slim charcoal blazer over black turtleneck'}${bodyDesc}, dramatic neon evening city lighting`,
    `${baseIdentity}, upper body three-quarter, arms crossed confident pose, wearing ${isFemale ? 'a tailored white power blazer' : 'a modern navy suit jacket'}${bodyDesc}, studio even lighting, plain background`,
    `${baseIdentity}, upper body sitting on stool, thoughtful expression, leaning forward slightly, wearing ${isFemale ? 'a soft camel knit top' : 'a fitted olive green polo'}${bodyDesc}, warm indoor lamp light`,
    `${baseIdentity}, upper body sitting on couch barefoot, legs tucked to side, relaxed pose, visible ankles, cozy living room setting, wearing ${isFemale ? 'an oversized chunky cardigan in oatmeal' : 'a soft gray hoodie'}${bodyDesc}`,
    `${baseIdentity}, upper body standing three-quarter back view turning head, wearing ${isFemale ? 'a cropped denim jacket and high-neck top' : 'a black hoodie and relaxed jeans'}${bodyDesc}, urban street golden hour`,
    `${baseIdentity}, upper body close-up sitting, arms on knees barefoot, visible feet close to camera, soft indoor natural light, wearing ${isFemale ? 'a loose white linen shirt' : 'a relaxed white camp-collar shirt'}${bodyDesc}`
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