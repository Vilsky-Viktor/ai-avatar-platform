import { AvatarParameters } from '../types/avatar';
import { PhotoSetCaption } from '../types/trainingPhotoSet';

export const AVATAR_REFERENCE_NAME = '<loom24>';

export const generatePhotoSetCaptions = (parameters: AvatarParameters): PhotoSetCaption[] => {
  const { gender } = parameters;
  const isFemale = gender === 'female';

  return [
    // --- ID reference angles (orders 1–8) ---
    { order: 1, caption: `${AVATAR_REFERENCE_NAME} front headshot, neutral relaxed expression, ${isFemale ? 'white strapless top' : 'white sleeveless shirt'}, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 2, caption: `${AVATAR_REFERENCE_NAME} front headshot, gentle smile, dark gray sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 3, caption: `${AVATAR_REFERENCE_NAME} front-right 45-degree quarter-view headshot, dark blue t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 4, caption: `${AVATAR_REFERENCE_NAME} front-left 45-degree quarter-view headshot, dark green t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 5, caption: `${AVATAR_REFERENCE_NAME} right-side 90-degree profile headshot, dark red t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 6, caption: `${AVATAR_REFERENCE_NAME} left-side 90-degree profile headshot, dark brown t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 7, caption: `${AVATAR_REFERENCE_NAME} micro portrait, gray concrete studio wall, soft diffused studio lighting` },
    { order: 8, caption: `${AVATAR_REFERENCE_NAME} front view standing, ${isFemale ? 'white strapless top and white running shorts' : 'white sleeveless t-shirt and white shorts'}, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 9, caption: `${AVATAR_REFERENCE_NAME} front view standing, ${isFemale ? 'white strapless top and white running shorts' : 'white sleeveless t-shirt and white shorts'}, gray concrete studio wall, even soft diffused studio lighting` },

    // --- Close-up emotions (orders 9–17) ---
    { order: 10,  caption: `${AVATAR_REFERENCE_NAME} close-up portrait, sad expression, deep slate blue sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 11, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, angry expression, crimson red sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 12, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, happy expression, warm peach sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 13, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, laughing expression, bright yellow sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 14, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, surprised expression, electric teal sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 15, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, anxious expression, burnt orange sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 16, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, shy expression, soft rose sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 17, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, sleepy expression, dusty lavender sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting` },
    { order: 18, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, fear expression, dark violet sleeveless t-shirt, gray concrete studio wall, even soft diffused studio lighting` },

    // --- Front chest-up portraits (orders 18–21) ---
    { order: 19, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, ${isFemale ? 'flowy sage green midi dress with puff sleeves' : 'khaki jacket over white t-shirt'}, outdoor park setting, soft golden hour sunlight` },
    { order: 20, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, thinking and pensive expression, ${isFemale ? 'chunky cream cable-knit sweater' : 'soft taupe merino wool crewneck'}, cozy living room setting, soft warm candlelight` },
    { order: 21, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, confident expression, ${isFemale ? 'tailored pale blue Oxford shirt' : 'light gray button-down shirt with light blue tie'}, modern office interior, bright overhead white lighting` },
    { order: 22, caption: `${AVATAR_REFERENCE_NAME} close-up portrait, fitted dark charcoal turtleneck, deep dark studio background, soft low-key dramatic side lighting` },

    // --- Quarter and side chest-up portraits (orders 22–25) ---
    { order: 23, caption: `${AVATAR_REFERENCE_NAME} front-right 45-degree quarter-view close-up portrait, ${isFemale ? 'oversized oatmeal cardigan' : 'soft gray zip-up hoodie'}, loft-style living room interior, warm indoor lamp light` },
    { order: 24, caption: `${AVATAR_REFERENCE_NAME} front-left 45-degree quarter-view close-up portrait, ${isFemale ? 'beige trench coat over cream turtleneck' : 'camel overcoat over white crewneck'}, indoor cafe setting, soft natural daylight` },
    { order: 25, caption: `${AVATAR_REFERENCE_NAME} right-side profile close-up portrait, ${isFemale ? 'light pink windbreaker jacket' : 'light blue windbreaker jacket'}, urban city street background, early evening ambient light` },
    { order: 26, caption: `${AVATAR_REFERENCE_NAME} left-side profile close-up portrait, ${isFemale ? 'metallic silver cropped jacket' : 'black puffer vest over hoodie'}, urban city street background, early evening ambient light` },

    // --- Upper body shots (orders 26–36) ---
    { order: 27, caption: `${AVATAR_REFERENCE_NAME} front portrait standing, ${isFemale ? 'soft beige cashmere turtleneck with cream wool trousers' : 'olive green henley with dark charcoal chinos'}, cozy indoor living room, warm natural window light` },
    { order: 28, caption: `${AVATAR_REFERENCE_NAME} front portrait standing, ${isFemale ? 'silky emerald green camisole with fitted black midi skirt' : 'fitted black turtleneck under charcoal overcoat'}, blurred rooftop city night background, warm tungsten evening light` },
    { order: 29, caption: `${AVATAR_REFERENCE_NAME} front portrait sitting at work desk looking at camera, ${isFemale ? 'tailored pinstripe blazer in soft gray over white tee' : 'slim-fit navy blazer with white dress shirt'}, co-working space with industrial aesthetic, bright overhead office lighting` },
    { order: 30, caption: `${AVATAR_REFERENCE_NAME} front portrait standing, ${isFemale ? 'black racing-style crop jacket with gray crop top' : 'black racing jacket with gray t-shirt'}, luxury car garage interior, even overhead indoor lighting` },
    { order: 31, caption: `${AVATAR_REFERENCE_NAME} sitting on hotel bed, ${isFemale ? 'pink fitted racerback crop tank top with light gray fleece shorts' : 'relaxed gray joggers and white t-shirt'}, hotel room interior, soft ambient light` },
    { order: 32, caption: `${AVATAR_REFERENCE_NAME} lying slightly lifted, ${isFemale ? 'soft pink sleep pajama' : 'gray modal lounge shorts and t-shirt'}, bedroom interior, soft romantic light` },
    { order: 33, caption: `${AVATAR_REFERENCE_NAME} extreme low-angle upward shot, blue jeans and light gray polo shirt, blue sky with white clouds, soft natural daylight` },
    { order: 34, caption: `${AVATAR_REFERENCE_NAME} extreme high-angle overhead downward shot, white shorts and light gray t-shirt, Sahara desert terrain, bright sunny daylight` },
    { order: 35, caption: `${AVATAR_REFERENCE_NAME} sitting on beach lounge chair one knee bent up, ${isFemale ? 'breezy yellow floral wrap midi dress' : 'pastel yellow shorts and Hawaiian shirt'}, beach setting, soft natural daylight` },
    { order: 36, caption: `${AVATAR_REFERENCE_NAME} sitting cross-legged outdoors barefoot, ${isFemale ? 'flowy boho pants in terracotta with cropped top' : 'relaxed dark green cargo shorts with gray t-shirt'}, park grass, early morning light` },
    { order: 37, caption: `${AVATAR_REFERENCE_NAME} standing upright outdoors, ${isFemale ? 'breezy white cover-up dress' : 'lightweight linen shorts and sleeveless white t-shirt'}, tropical path with greenery, soft natural daylight` },

    // --- Full body and dynamic poses (orders 37–40) ---
    { order: 38, caption: `${AVATAR_REFERENCE_NAME} walking, ${isFemale ? 'short black cocktail dress with spaghetti straps and high heels' : 'charcoal suit with white dress shirt and loafers'}, city street sidewalk` },
    { order: 39, caption: `${AVATAR_REFERENCE_NAME} jogging, ${isFemale ? 'minimalist all-black athleisure set' : 'all-black tracksuit'} with black sport shoes, stadium` },
    { order: 40, caption: `${AVATAR_REFERENCE_NAME} dancing, ${isFemale ? 'fitted black micro mini skirt with sleeveless white bodysuit and pointed-toe heels' : 'black crew-neck t-shirt with light blue jeans and white sneakers'}, city street with bars` },
    
  ];
};
