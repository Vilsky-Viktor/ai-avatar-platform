import { AvatarParameters, AvatarGender } from '../types/avatar';
import { TrainingPhotoSetPrompts, IdPhotoSetPaths } from '../types/trainingPhotoSet';

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

export const generatePhotoSetInputs = (userId: string, avatarId: string, parameters: AvatarParameters & {gender: string}, idPhotoSet: IdPhotoSetPaths): TrainingPhotoSetPrompts[] => {
  const { gender, height, body, bodyHair, bustSize } = parameters;

  const isFemale = gender === 'female';

  const bodyHairDesc = bodyHair === 'none' ? 'no hair' : `${bodyHair} hair`;
  const bodyHairByParts = `${bodyHairDesc} on chest, ${bodyHairDesc} on abdomen, ${bodyHairDesc} on legs, ${bodyHairDesc} on arms, ${bodyHairDesc} on back`;

  const bodyDesc = `${body} body type, ${bodyHairByParts}, ${isFemale ? `${bustSize} bust` : `${bustSize} chest`}, ${height} height`;
  const qualityAddition = 'Hyperrealistic photograph, 8K detail, skin details, hair details. Sharp focus on face';

  return [
    // -----------------------------------------------------------------
    // ID photos (strong identity lock)
    // -----------------------------------------------------------------

    // Front facing ID headshot
    {
      prompt: `Keep exact facial identity and proportions from reference image. Close-up headshot. Wearing white crew-neck t-shirt. Soft diffused studio lighting. Plain light gray background. ${qualityAddition}`,
      similarityThreshold: 0.95,
      imagePaths: [idPhotoSet.front],
      idPhotoPaths: [idPhotoSet.front],
      numSteps: 50,
      order: 1,
    },
    // Front facing ID headshot
    {
      prompt: `Keep exact facial identity and proportions from reference image. Close-up headshot. Wearing white crew-neck t-shirt. Soft diffused studio lighting. Plain light gray background. ${qualityAddition}`,
      similarityThreshold: 0.95,
      imagePaths: [idPhotoSet.frontSmile],
      idPhotoPaths: [idPhotoSet.frontSmile],
      numSteps: 50,
      order: 2,
    },
    // Right quater ID headshot   
    {
      prompt: `Keep exact facial identity and proportions from reference image. Close-up headshot. Wearing white crew-neck t-shirt. Soft diffused studio lighting. Plain light gray background. ${qualityAddition}`,
      similarityThreshold: 0.95,
      imagePaths: [idPhotoSet.rightQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
      numSteps: 50,
      order: 3,
    },
    // Left quater ID headshot 
    {
      prompt: `Keep exact facial identity and proportions from reference image. Close-up headshot. Wearing white crew-neck t-shirt. Soft diffused studio lighting. Plain light gray background. ${qualityAddition}`,
      similarityThreshold: 0.95,
      imagePaths: [idPhotoSet.leftQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
      numSteps: 50,
      order: 4,
    },
    // Right side profile ID headshot
    {
      prompt: `Keep exact facial identity and proportions from reference image. 90-degree side view close-up headshot. Wearing white crew-neck t-shirt. Soft diffused studio lighting. Plain light gray background. ${qualityAddition}`,
      similarityThreshold: 0.72,
      imagePaths: [idPhotoSet.rightQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
      numSteps: 60,
      guidance: 4.5,
      order: 5,
    },
    // Left side profile ID headshot
    {
      prompt: `Keep exact facial identity and proportions from reference image. 90-degree side view close-up headshot. Wearing white crew-neck t-shirt. Soft diffused studio lighting. Plain light gray background. ${qualityAddition}`,
      similarityThreshold: 0.72,
      imagePaths: [idPhotoSet.leftQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
      numSteps: 60,
      guidance: 4.5,
      order: 6,
    },
    // Full body ID
    {
      prompt: `Full-body front view of the ${gender} from the reference image, preserving exact facial identity and head-to-body proportions. ${isFemale ? 'She' : 'He'} has ${body} body type, ${bustSize} chest, and ${height}cm height. ${bodyHair !== 'none' ? `Visible ${bodyHair} body hair covers his chest, abdomen, arms, legs` : 'No body hair'}. Wearing white ${isFemale ? 'bikini top and bottom, barefoot' : 'boxer trunks, no top, barefoot'}. Soft diffused studio lighting illuminates the subject against a plain light gray background. ${qualityAddition}`,
      similarityThreshold: 0.85,
      imagePaths: [idPhotoSet.front],
      idPhotoPaths: [idPhotoSet.front],
      numSteps: 60,
      order: 7,
    },

    // -----------------------------------------------------------------
    // Extreme close-up
    // -----------------------------------------------------------------

    {
      prompt: `Keep exact facial identity and proportions from reference image. Extreme close-up, eyes and nose filling the entire frame. Plain light gray background. ${qualityAddition}`,
      imagePaths: [idPhotoSet.front],
      idPhotoPaths: [],
      maxRuns: 1,
      numSteps: 60,
      order: 8,
    },
    
    // -----------------------------------------------------------------
    // // Chest-up portraits (strong face lock)
    // -----------------------------------------------------------------

    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a soft beige cashmere turtleneck sweater' : 'a slim-fit olive green henley shirt'}. Indoor neutral setting, softly blurred. Warm natural window light from left, soft shadows on right side. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.front],
      idPhotoPaths: [idPhotoSet.front],
      numSteps: 50,
      order: 9,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a flowy terracotta midi dress with subtle puff sleeves' : 'a rust-colored chore jacket over a white tee'}. Outdoor blurred park background. Golden hour soft side lighting. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.frontSmile],
      idPhotoPaths: [idPhotoSet.frontSmile],
      numSteps: 50,
      order: 10,
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a sleek black mock-neck top' : 'a deep charcoal slim-fit polo'}. Dark studio background. Low key lighting from camera-left, light gradually fading across the face to another side of the face. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.front],
      idPhotoPaths: [idPhotoSet.front],
      numSteps: 50,
      order: 11,
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a tailored pale blue Oxford shirt' : 'a modern business casual light gray button-down with micro-check pattern'}. Modern indoor environment. Cool blue-toned office lighting. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.front],
      idPhotoPaths: [idPhotoSet.front],
      numSteps: 50,
      order: 12,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a cropped black leather jacket over a white tank' : 'a black bomber jacket over a gray graphic tee'}. Urban street blurred backdrop. Bright outdoor daylight, soft natural shadows on face, clear even skin illumination. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.front],
      idPhotoPaths: [idPhotoSet.front],
      numSteps: 50,
      order: 13,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a chunky cream cable-knit sweater' : 'a soft taupe merino wool crewneck'}. Cozy living room setting. Soft warm candlelight. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.front],
      idPhotoPaths: [idPhotoSet.front],
      numSteps: 50,
      order: 14,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a silky emerald green camisole with delicate straps' : 'a fitted black turtleneck under a charcoal overcoat'}. Blurred rooftop city night background. Evening warm tungsten light. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.front],
      idPhotoPaths: [idPhotoSet.front],
      numSteps: 50,
      order: 15,  
    },

    // -----------------------------------------------------------------
    // Quater and side profile angles (good angular coverage)
    // -----------------------------------------------------------------

    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a relaxed beige trench coat over a cream turtleneck' : 'a camel overcoat layered over a white crewneck'}. Indoor cafe setting. Soft natural daylight from window. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.rightQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
      numSteps: 50,
      order: 16,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a flowy terracotta midi dress with subtle puff sleeves' : 'a rust-colored chore jacket over a white tee'}. Outdoor blurred nature. Golden hour warm side lighting. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.leftQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
      numSteps: 50,
      order: 17,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a structured black blazer with strong shoulders' : 'a tailored navy suit jacket unbuttoned over white shirt'}. Dark moody background. Soft dramatic cinematic side lighting with rim preserving facial details. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.rightQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
      numSteps: 50,
      order: 18,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'oversized denim jacket in medium wash over cropped hoodie' : 'black minimalist hoodie'}. Urban street environment. Cool overcast daylight. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.leftQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
      numSteps: 50,
      order: 19,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a butter-yellow linen blazer' : 'a lightweight khaki utility jacket'}. Park scenery. Warm sunset backlight with front fill. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.rightQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
      numSteps: 50,
      order: 20,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a cozy oversized oatmeal cardigan' : 'a soft gray zip-up hoodie'}. Home interior blurred. Soft indoor lamp light. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.leftQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
      numSteps: 50,
      order: 21,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. 90-degree side view chest-up portrait. Wearing ${isFemale ? 'a sleeveless white linen top' : 'a relaxed white linen camp-collar shirt'}. Outdoor blurred. Warm golden hour rim light. ${qualityAddition}`,
      similarityThreshold: 0.75,
      imagePaths: [idPhotoSet.rightQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter, idPhotoSet.rightSide],
      numSteps: 50,
      order: 22,  
    },

    // -----------------------------------------------------------------
    // Additional profiles & dynamic head angles
    // -----------------------------------------------------------------

    {
      prompt: `Keep exact facial identity and proportions from reference image. 90-degree side view chest-up portrait. Wearing ${isFemale ? 'a dramatic black asymmetrical top' : 'a charcoal turtleneck sweater'}. Studio dark. Soft dramatic low-key single source light preserving sharp facial features. ${qualityAddition}`,
      similarityThreshold: 0.75,
      imagePaths: [idPhotoSet.leftQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter, idPhotoSet.leftSide],
      numSteps: 50,
      order: 23,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. 90-degree side view chest-up portrait. Wearing ${isFemale ? 'a sheer black mesh' : 'a fitted black compression top'}. Indoor. Natural window light from behind creating silhouette edge. ${qualityAddition}`,
      similarityThreshold: 0.75,
      imagePaths: [idPhotoSet.rightQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter, idPhotoSet.rightSide],
      numSteps: 50,
      order: 24,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. 90-degree side view chest-up portrait. Wearing ${isFemale ? 'a metallic silver cropped jacket' : 'a sleek black puffer vest over hoodie'}. City rooftop blurred background. Evening cloudy weather. ${qualityAddition}`,
      similarityThreshold: 0.75,
      imagePaths: [idPhotoSet.leftQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter, idPhotoSet.leftSide],
      numSteps: 50,
      order: 25,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference image. Chest-up portrait. Wearing ${isFemale ? 'a pastel lavender oversized button-up' : 'a soft mint green oxford shirt'}. Bedroom ceiling to floor window setting. Soft morning light illuminating facial details. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.leftQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter],
      numSteps: 50,
      order: 26,  
    },
    {
      prompt: `Keep exact facial identity and proportions from reference images. Chest-up portrait, quarter 45-degree view looking at camera. Wearing ${isFemale ? 'a tailored pinstripe blazer in soft gray over white tee' : 'a modern slim-fit navy blazer with white dress shirt'}. Modern workspace. Neutral calm expression, mixed natural + studio lighting. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter],
      numSteps: 50,
      order: 27,  
    },

    // -----------------------------------------------------------------
    // Full-body shots
    // -----------------------------------------------------------------

    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body standing. ${isFemale ? 'high-waisted cream tailored trousers, silk blouse and white heels' : 'slim-fit dark gray chinos, white button-down and black oxford shoes'}. Urban street golden hour. ${qualityAddition}`,
      similarityThreshold: 0.85,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 60,
      order: 28,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body side view walking. Wearing ${isFemale ? 'a fitted short cocktail dress with spaghetti straps, high heels, sleek and elegant' : 'a slim fit charcoal suit with white dress shirt, no tie, loafers, smart casual'}. City sidewalk background. Overcast daylight. ${qualityAddition}`,
      similarityThreshold: 0.75,
      imagePaths: [idPhotoSet.rightSide, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter, idPhotoSet.rightSide],
      numSteps: 50,
      order: 29,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body casual standing, body from the back, looking over shoulder at camera. Wearing ${isFemale ? 'a flowy white broderie anglaise midi sundress with thin straps and tiered skirt' : 'straight-leg beige chinos and olive utility shirt'}. Outdoor nature. Soft forest diffused light. ${qualityAddition}`,
      similarityThreshold: 0.7,
      imagePaths: [idPhotoSet.leftQuarter, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.leftQuarter, idPhotoSet.leftSide, idPhotoSet.bodyFront],
      numSteps: 50,
      order: 30,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body sitting. Wearing ${isFemale ? 'pink fitted racerback crop tank top, light gray fleece sweat shorts with elastic waistband and hotel slippers' : 'relaxed gray joggers, white t-shirt and hotel slippers'}. On king size bed in the hotel room. Simple home interior soft light. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 50,
      order: 31,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body standing, weight shifted to one leg. Wearing ${isFemale ? 'stylish black bikini' : 'black swim shorts'}. On the beach sand, ocean background with a small sail yacht. Golden hour. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 60,
      order: 32,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body laying, head slightly lifted, looking at camera, hands clasped behind head, one knee bent upward. Wearing ${isFemale ? 'a breezy yellow floral wrap midi dress with short puff sleeves and v-neckline' : 'pastel yellow shorts and hawaiian shirt'}. On the lounge chair on the beach. Golden hour. ${qualityAddition}`,
      similarityThreshold: 0.75,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 60,
      order: 33,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body walking towards camera, visible feet and toes. Wearing ${isFemale ? 'a breezy white cover-up dress' : 'lightweight linen shorts and open white shirt'}. Tropical path. Soft daylight. ${qualityAddition}`,
      similarityThreshold: 0.8,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 50,
      order: 34,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body sitting, body three-quarter angle, head turned towards camera, one leg resting on top of another. Wearing ${isFemale ? 'tailored black wide-leg trousers, silk blouse and pointed-toe heels' : 'slim charcoal trousers, crisp white shirt and white minimalist leather sneakers'}. On modern chair in cafe. Indoor cafe warm light. ${qualityAddition}`,
      similarityThreshold: 0.85,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 50,
      order: 35,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body sitting cross-legged, relaxed pose, visible bare feet and toes. Wearing ${isFemale ? 'flowy boho pants in terracotta and cropped top' : 'relaxed-fit cargo shorts and graphic tee'}. On ground, park grass. Soft daylight. ${qualityAddition}`,
      similarityThreshold: 0.85,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 50,
      order: 36,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body sitting, legs dangling. Wearing ${isFemale ? 'high-waisted denim shorts' : 'relaxed black joggers'}, fitted tee and black sneakers. On low wall urban rooftop. Evening light. ${qualityAddition}`,
      similarityThreshold: 0.85,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 50,
      order: 37,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body leaning against wall standing, confident pose. Wearing ${isFemale ? 'minimalist all-black athleisure set' : 'modern all-black tracksuit with clean lines'} and sport shoes. Gym changing room. Studio even lighting. ${qualityAddition}`,
      similarityThreshold: 0.85,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 50,
      order: 38,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body resting, relaxed body and head. Wearing ${isFemale ? 'a stylish soft sleep pink pajama and white socks' : 'gray modal lounge shorts, t-shirt and socks'}. On the bed in the bedroom. Early morning sunrise. ${qualityAddition}`,
      similarityThreshold: 0.75,
      imagePaths: [idPhotoSet.rightQuarter, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.rightQuarter, idPhotoSet.rightSide, idPhotoSet.bodyFront],
      numSteps: 50,
      order: 39,  
    },

    // -----------------------------------------------------------------
    // Extreme angles
    // -----------------------------------------------------------------

    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body standing, extreme camera angle from the bottom, looking down into camera. Wearing blue jeans, light gray polo and navy/white Converse-style canvas sneakers. White clouds background, pebbles ground. Daylight. ${qualityAddition}`,
      similarityThreshold: 0.7,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 50,
      order: 40,  
    },
    {
      prompt: `Keep exact facial identity and proportions from image 1. Keep exact body proportions and size from image 2. Full body standing, extreme camera angle from the top, looking up into camera. Wearing white shorts, white t-shirt and orange flip flops. Sahara desert. Sunny and hot. ${qualityAddition}`,
      similarityThreshold: 0.75,
      imagePaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      idPhotoPaths: [idPhotoSet.front, idPhotoSet.bodyFront],
      numSteps: 50,
      order: 41,  
    },

    // // Back view
    // {
    //   prompt: `Keep exact body proportions and size from image 2. Full body rear view walking. ${bodyHair !== 'none' ? `Keep body hair intensity from image 2` : 'No body hair'}. Wearing ${isFemale ? 'stylish red bikini with white pareo' : 'Red swim shorts with a white towel on shoulder'}. On the beach sand towards beach bar. Golden hour. ${qualityAddition}`,
    //   imagePaths: [idPhotoSet.bodyFront],
    //   idPhotoPaths: [],
    //   numSteps: 60,
    //   maxRuns: 1,
    //   order: 42,  
    // },
    // {
    //   prompt: `Full body back view standing, head fully visible only from behind, arms relaxed at sides, city skyline balcony view, hands resting on balcony rails, wearing ${isFemale ? 'high-waisted black tailored trousers, fitted white crop top, white sneakers' : 'slim dark navy chinos, white oxford shirt, chelsea boots '}. ${bodyDesc}. ${baseIdentity}`,
    //   maxRuns: 1,
    //   similarityThreshold: 0,
    //   imagePaths: [idPhotoSet.bodyFront],
    //   idPhotoPaths: []
    //   order: 43,  
    // },
    // {
    //   prompt: `Upper body back view, head fully visible only from behind, mountain view, wearing ${isFemale ? 'a sleeveless open-back black top' : 'a relaxed gray crewneck sweatshirt'}. ${bodyDesc}. ${baseIdentity}`,
    //   maxRuns: 1,
    //   similarityThreshold: 0,
    //   imagePaths: [idPhotoSet.bodyFront],
    //   idPhotoPaths: []
    //   order: 44,  
    // },

    // // Upper-body & additional sitting/leaning variations
    // {
    //   prompt: `Upper body three-quarter pose standing, arms relaxed, neutral expression, wearing ${isFemale ? 'a cream knit polo sweater' : 'a taupe cashmere crewneck'}, soft natural park daylight. ${bodyDesc}. ${baseIdentity}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.quarter],
    //   order: 45,  
    // },
    // {
    //   prompt: `Upper body portrait leaning against wall, neutral calm expression, wearing ${isFemale ? 'a structured blazer in chocolate brown over white tee' : 'a slim charcoal blazer over black turtleneck'}, dramatic neon evening city lighting. ${bodyDesc}. ${baseIdentity}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.front],
    //   order: 46,  
    // },
    // {
    //   prompt: `Upper body three-quarter, arms crossed confident pose, wearing ${isFemale ? 'a tailored white power blazer with white t-shirt' : 'a modern navy suit jacket with white shirt'}, studio even lighting, plain background. ${bodyDesc}. ${baseIdentity}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.quarter],
    //   order: 47,  
    // },
    // {
    //   prompt: `Upper body sitting on stool, neutral calm expression, leaning forward slightly, wearing ${isFemale ? 'a soft camel knit top' : 'a fitted olive green polo'}, warm indoor lamp light. ${bodyDesc}. ${baseIdentity}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   order: 48,  
    // },
    // {
    //   prompt: `Upper body sitting on couch barefoot, legs tucked to side, relaxed pose, visible ankles, cozy living room setting, wearing ${isFemale ? 'an oversized chunky cardigan in oatmeal' : 'a soft gray hoodie'}. ${bodyDesc}. ${baseIdentity}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   order: 49,  
    // },
    // {
    //   prompt: `Upper body standing three-quarter back view turning head, wearing ${isFemale ? 'a cropped denim jacket and high-neck top' : 'a black hoodie and relaxed jeans'}, urban street golden hour. ${bodyDesc}. ${baseIdentity}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.quarter],
    //   order: 50,  
    // },
    // {
    //   prompt: `Full body close-up sitting on the floor, arms on knees barefoot, visible feet close to camera, soft indoor natural window light, wearing ${isFemale ? 'a loose white linen shirt' : 'a relaxed white camp-collar shirt'}. ${bodyDesc}. ${baseIdentity}`,
    //   similarityThreshold: 0.8,
    //   imagePaths: [idPhotoSet.front, idPhotoSet.body],
    //   order: 51,  
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