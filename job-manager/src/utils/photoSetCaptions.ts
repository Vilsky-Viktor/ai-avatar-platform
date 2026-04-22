import { AvatarParameters } from '../types/avatar';
import { PhotoSetCaption } from '../types/trainingPhotoSet';
import { AVATAR_REFERENCE_NAME } from './photoSetInputData';

export const generatePhotoSetCaptions = (parameters: AvatarParameters): PhotoSetCaption[] => {
  const { gender } = parameters;
  const isFemale = gender === 'female';

  return [
    // --- ID reference angles (orders 1–9) ---
    { order: 1, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, neutral relaxed expression, ${isFemale ? 'white strapless top' : 'white sleeveless shirt'}, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 2, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, gentle smile with teeth showing, dark gray sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 3, caption: `${AVATAR_REFERENCE_NAME} front-right 45-degree quarter-view portrait, dark blue t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 4, caption: `${AVATAR_REFERENCE_NAME} front-left 45-degree quarter-view portrait, dark green t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 5, caption: `${AVATAR_REFERENCE_NAME} pure right-side 90-degree profile portrait, dark red t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 6, caption: `${AVATAR_REFERENCE_NAME} pure left-side 90-degree profile portrait, dark brown t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 7, caption: `${AVATAR_REFERENCE_NAME} 180-degree rear view portrait, gray concrete studio wall, soft diffused studio lighting` },
    { order: 8, caption: `${AVATAR_REFERENCE_NAME} extreme tight portrait filling the entire frame, gray concrete studio wall, soft diffused studio lighting` },
    { order: 9, caption: `${AVATAR_REFERENCE_NAME} upright standing pose, ${isFemale ? 'white strapless top and white running shorts' : 'white sleeveless shirt and white running shorts'}, barefoot on light wooden floor, gray concrete studio wall, even soft diffused studio lighting` },

    // --- Close-up emotions (orders 10–18) ---
    { order: 10, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, sad expression, deep slate blue sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 11, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, angry expression, crimson red sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 12, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, happy expression, warm peach sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 13, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, laughing expression, bright yellow sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 14, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, surprised expression, electric teal sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 15, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, anxious expression, burnt orange sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 16, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, shy expression, soft rose sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 17, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, sleepy expression, dusty lavender sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },
    { order: 18, caption: `${AVATAR_REFERENCE_NAME} straight-on eye-level portrait, fear expression, dark violet sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting, head and shoulders in frame` },

    // --- Front chest-up portraits (orders 19–24) ---
    { order: 19, caption: `${AVATAR_REFERENCE_NAME} straight-on chest-up portrait, ${isFemale ? 'soft beige cashmere turtleneck' : 'olive green henley'}, cozy indoor living room setting, warm natural window light from the side` },
    { order: 20, caption: `${AVATAR_REFERENCE_NAME} straight-on chest-up portrait, ${isFemale ? 'flowy sage green midi dress' : 'khaki jacket over white t-shirt'}, outdoor park setting, warm golden hour sunlight` },
    { order: 21, caption: `${AVATAR_REFERENCE_NAME} straight-on chest-up portrait, ${isFemale ? 'silky emerald green camisole' : 'fitted black turtleneck with charcoal overcoat'}, city rooftop at night, warm tungsten ambient light` },
    { order: 22, caption: `${AVATAR_REFERENCE_NAME} chest-up portrait with gaze directed upward, ${isFemale ? 'chunky cream cable-knit sweater' : 'soft taupe merino crewneck'}, cozy indoor living room setting, warm candlelight` },
    { order: 23, caption: `${AVATAR_REFERENCE_NAME} chest-up portrait with direct forward stare, ${isFemale ? 'tailored pale blue Oxford shirt' : 'light gray button-down shirt with light blue tie'}, modern office interior, bright overhead white lighting` },
    { order: 24, caption: `${AVATAR_REFERENCE_NAME} straight-on chest-up portrait, fitted dark charcoal turtleneck, deep dark studio environment, soft low-key dramatic side lighting` },

    // --- Quarter chest-up portraits (orders 25–26) ---
    { order: 25, caption: `${AVATAR_REFERENCE_NAME} front-right 45-degree quarter-view chest-up portrait, ${isFemale ? 'oversized oatmeal cardigan' : 'soft gray zip-up hoodie'}, loft-style living room interior, warm indoor lamp light` },
    { order: 26, caption: `${AVATAR_REFERENCE_NAME} front-left 45-degree quarter-view chest-up portrait, ${isFemale ? 'beige trench coat over cream turtleneck' : 'camel overcoat over white crewneck'}, indoor cafe setting, soft natural daylight` },

    // --- Side chest-up portraits (orders 27–28) ---
    { order: 27, caption: `${AVATAR_REFERENCE_NAME} right-side profile chest-up portrait, ${isFemale ? 'light pink windbreaker jacket' : 'light blue windbreaker jacket'}, urban city street background, early evening ambient light` },
    { order: 28, caption: `${AVATAR_REFERENCE_NAME} left-side profile chest-up portrait, ${isFemale ? 'metallic silver cropped jacket' : 'black puffer vest over gray hoodie'}, urban city street background, early evening ambient light` },

    // --- Upper body / waist-up (orders 29–30) ---
    { order: 29, caption: `${AVATAR_REFERENCE_NAME} waist-up portrait sitting at a desk, ${isFemale ? 'soft gray tailored blazer' : 'slim-fit navy blazer with white dress shirt'}, modern co-working office space, bright overhead office lighting` },
    { order: 30, caption: `${AVATAR_REFERENCE_NAME} waist-up portrait standing upright, ${isFemale ? 'black racing-style crop jacket' : 'black racing jacket with gray t-shirt'}, luxury car garage interior, even overhead indoor lighting` },

    // --- Full body diverse poses (orders 31–40) ---
    { order: 31, caption: `${AVATAR_REFERENCE_NAME} walking forward, ${isFemale ? 'black cocktail dress with high heels' : 'charcoal suit with white dress shirt'}, city sidewalk, overcast diffused daylight` },
    { order: 32, caption: `${AVATAR_REFERENCE_NAME} sitting on a hotel bed, ${isFemale ? 'pink racerback crop tank and gray fleece shorts' : 'relaxed gray joggers and white t-shirt'}, hotel room interior, soft ambient light` },
    { order: 33, caption: `${AVATAR_REFERENCE_NAME} standing barefoot, ${isFemale ? 'breezy floral sundress' : 'red shorts and sleeveless black t-shirt'}, sandy beach with ocean in background, warm golden hour sunlight` },
    { order: 34, caption: `${AVATAR_REFERENCE_NAME} jogging on a path, ${isFemale ? 'breezy white cover-up dress' : 'linen shorts and sleeveless white t-shirt'}, tropical path with greenery, soft natural daylight` },
    { order: 35, caption: `${AVATAR_REFERENCE_NAME} leaning against gym lockers, ${isFemale ? 'all-black athleisure set' : 'all-black tracksuit'}, gym changing room interior, even overhead indoor lighting` },
    { order: 36, caption: `${AVATAR_REFERENCE_NAME} lying on abdomen on a bed, ${isFemale ? 'soft pink sleep pajama' : 'gray modal lounge shorts and t-shirt'}, bedroom interior, soft warm romantic light` },
    { order: 37, caption: `${AVATAR_REFERENCE_NAME} dancing on a street at night, ${isFemale ? 'black micro mini skirt and sleeveless white bodysuit' : 'black crew-neck t-shirt and black trousers'}, city street with colorful lights in background` },
    { order: 38, caption: `${AVATAR_REFERENCE_NAME} extreme low-angle upward shot, blue jeans and light gray polo shirt, white clouds and pebbled ground in background, soft natural daylight` },
    { order: 39, caption: `${AVATAR_REFERENCE_NAME} extreme high-angle overhead downward shot, white shorts and light gray t-shirt with orange flip flops, sahara desert terrain, bright sunny daylight` },
    { order: 40, caption: `${AVATAR_REFERENCE_NAME} rear view standing on a balcony, ${isFemale ? 'high-waisted black trousers and white crop top' : 'slim navy chinos and white oxford shirt'}, city skyline background, natural daylight` },
  ];
};
