import { AiModelGateway, JobMetadata, JobStatuses, Models, Platforms, Services, AvatarParameters, ImageRatios } from "@loom24/shared/types";
import uuid from 'uuid';
import { IdPhotoSetPaths } from "../types/idPhotoSet";


export const genWhatsappStickersData = (userId: string, avatarId: string, parameters: AvatarParameters, idPhotoSet: IdPhotoSetPaths): {
    imageGenerator: AiModelGateway, order: number
}[] => {
    const ratio = ImageRatios['1:1'];

    return [
        {
            imageGenerator: {
                prompt: `Subtle sad expression. Preserve exact identity from image 1. Gray studio background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!],
                temperature: 0,
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 1,
        },
        {
            imageGenerator: {
                prompt: `Subtle angry expression. Preserve exact identity from image 1. Gray studio background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!],
                temperature: 0,
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 2,
        },
        {
            imageGenerator: {
                prompt: `Gentle closed-mouth smile. Preserve exact identity from image 1. Gray studio background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!],
                temperature: 0,
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 3,
        },
        {
            imageGenerator: {
                prompt: `Subtle laughing expression. Preserve exact identity from image 1. Gray studio background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.frontSmile!, idPhotoSet.front!],
                temperature: 0,
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 4,
        },
        {
            imageGenerator: {
                prompt: `Subtle surprised expression. Preserve exact identity from image 1. Gray studio background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!, idPhotoSet.frontSmile!],
                temperature: 0,
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 5,
        },
        {
            imageGenerator: {
                prompt: `Subtle shy expression. Preserve exact identity from image 1. Gray studio background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!],
                temperature: 0,
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 6,
        },
        {
            imageGenerator: {
                prompt: `Subtle sleepy expression. Preserve exact identity from image 1. Gray studio background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!],
                temperature: 0,
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 7,
        },
        {
            imageGenerator: {
                prompt: `Subtle scared expression. Preserve exact identity from image 1. Gray studio background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!, idPhotoSet.frontSmile!],
                temperature: 0,
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 8,
        },
        {
            imageGenerator: {
                prompt: `Subtle confused expression. Preserve exact identity from image 1. Gray studio background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!],
                temperature: 0,
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 9,
        },
        {
            imageGenerator: {
                prompt: `Subtle disgusted expression. Preserve exact identity from image 1. Gray studio background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!, idPhotoSet.frontSmile!],
                temperature: 0,
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 10,
        },
    ]
}


export const genOutfitStylesData = (userId: string, avatarId: string, parameters: AvatarParameters, idPhotoSet: IdPhotoSetPaths): {
    imageGenerator: AiModelGateway, order: number
}[] => {
    const { gender } = parameters;
    const isFemale = gender === 'female';
    const ratio = ImageRatios['3:4'];

    return [
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing business formal style ${isFemale ? 'tailored navy blazer over a white silk blouse, matching navy pencil skirt, sheer tights, and black patent leather stiletto pumps with a pointed toe' : 'tailored charcoal gray two-piece suit, crisp white dress shirt, dark silk tie, and polished black calfskin cap-toe oxford shoes with subtle brogue detailing'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 1,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing smart casual style ${isFemale ? 'a fitted cream knit sweater, dark slim-fit trousers, and camel suede Chelsea ankle boots with an elastic side panel and a low stacked heel' : 'a navy blazer over a light blue button-down shirt, dark chinos, and suede loafers'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 2,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing sport elegant style ${isFemale ? 'a fitted black athletic top, matching high-waisted leggings, a tailored cream longline cardigan, and clean white leather low-profile sneakers with a thin sole' : 'a fitted black performance polo, slim tapered jogger trousers, a lightweight gray bomber jacket, and clean white leather minimalist sneakers with a thin profile'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 3,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing streetwear style ${isFemale ? 'an oversized graphic hoodie, baggy cargo pants, a crossbody bag, and chunky off-white sneakers' : 'an oversized hoodie, baggy cargo pants, and chunky off-white sneakers'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 4,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing casual chic style ${isFemale ? 'a fitted white t-shirt tucked into high-waisted dark jeans, a tailored beige blazer draped over the shoulders, delicate gold jewelry, and ivory suede pointed-toe mule slides' : 'a fitted white t-shirt, dark well-fitted jeans, a tailored beige blazer, and suede loafers'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 5,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing athleisure style ${isFemale ? 'a fitted gray sports bra under a cropped oversized hoodie, matching gray high-waisted leggings, and slate gray technical running sneakers with neon green sole accents' : 'a fitted gray performance t-shirt, an unzipped gray track jacket, matching gray jogger sweatpants, and charcoal gray performance running sneakers with electric blue heel accents'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 6,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing business casual style ${isFemale ? 'a tucked-in light blue button-down blouse, tailored beige trousers, a thin leather belt, and blush nude leather pointed-toe flats with a delicate bow detail' : 'a light blue button-down shirt, beige chinos, a brown leather belt, and chestnut brown leather double monk strap shoes'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 7,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing evening glam style ${isFemale ? 'a fitted floor-length black sequin gown with a subtle slit, statement diamond earrings, a delicate clutch, and black satin strappy stiletto sandals with crystal embellishments on the straps' : 'a sharply tailored black tuxedo, a crisp white dress shirt, a black silk bow tie, a black silk pocket square, and polished black patent leather cap-toe oxfords with a mirror-gloss finish'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 8,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing bohemian style ${isFemale ? 'a flowing cream maxi dress with floral embroidery and lace details, layered beaded necklaces, a wide-brim tan straw hat, and rust-colored suede ankle boots with embroidered folk patterns and tassel lacing' : 'a loose cream linen button-down shirt with rolled sleeves, beige drawstring linen trousers, a layered wooden bead necklace, and dark espresso huarache sandals with hand-woven suede straps and a natural jute sole'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 9,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing minimalist style ${isFemale ? 'a fitted plain white crewneck t-shirt, tailored straight-leg black trousers, a thin silver chain necklace, and clean white leather pointed-toe flats with a barely-there sole' : 'a fitted plain white crewneck t-shirt, tailored straight-leg black trousers, and clean matte black leather loafers with a slim profile and squared toe'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 10,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing old money style ${isFemale ? 'a cream cable-knit cashmere sweater draped over the shoulders of a crisp white collared shirt, tailored beige pleated trousers, a delicate pearl necklace, and deep burgundy leather penny loafers with a gold coin detail' : 'a navy cashmere sweater over a crisp white collared shirt, tailored beige pleated trousers, a brown leather belt, and dark tan suede whole-cut penny loafers'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 11,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing preppy style ${isFemale ? 'a navy blazer with gold buttons over a white polo shirt, a pleated red and navy tartan plaid skirt, white knee-high socks, and caramel and white two-tone spectator penny loafers' : 'a navy blazer with gold buttons over a white polo shirt, beige chinos, a brown leather belt, and boat shoes with white rubber soles'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 12,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing vintage style ${isFemale ? 'a fitted red polka dot swing dress with a cinched waist and full skirt, a silk neck scarf, and cherry red patent leather kitten heel pumps' : 'a fitted white t-shirt tucked into high-waisted dark blue cuffed jeans, a brown leather belt, hair styled with pomade, and two-tone leather wingtip brogues'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 13,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing edgy rock style ${isFemale ? 'a black fitted band t-shirt, a black leather biker jacket with silver hardware, ripped black skinny jeans, layered silver chain necklaces, and black leather lace-up platform combat boots with silver buckle straps and a chunky lugged sole' : 'a black graphic band t-shirt, a black leather biker jacket with silver hardware, ripped black skinny jeans, a studded black leather belt, and black leather lace-up combat boots with a thick rubber sole and silver toe caps'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 14,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing beachwear style ${isFemale ? 'a white triangle bikini top, a flowing sheer white sarong tied at the hip, a wide-brim straw sun hat, and ivory braided raffia flat sandals with thin ankle-tie straps' : 'tropical patterned short-sleeve shirt, white swim trunks, and navy blue rubber flip flops with rope-textured straps'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 15,
        },
    ]
}

export const genTravelingAroundTheWorldData = (userId: string, avatarId: string, parameters: AvatarParameters, idPhotoSet: IdPhotoSetPaths): {
    imageGenerator: AiModelGateway, order: number
}[] => {
    const { gender } = parameters;
    const isFemale = gender === 'female';
    const ratio = ImageRatios['3:4'];

    return [
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing ${isFemale ? 'a chic beige trench coat over a striped top, slim jeans, and tan leather ankle boots' : 'a navy wool coat over a white shirt, dark trousers, and dark leather oxford shoes'}. In front of the Eiffel Tower in Paris`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 1,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing ${isFemale ? 'an elegant white linen sundress with a tan leather belt, and strappy tan leather sandals' : 'a light blue linen shirt, beige chinos, and brown leather loafers'}. In front of the Colosseum in Rome, Italy`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 2,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing ${isFemale ? 'a flowy beige maxi dress, a wide-brim straw hat, and tan flat leather sandals' : 'a beige linen shirt, khaki trousers, a wide-brim hat, and brown leather sandals'}. In front of the Pyramids of Giza in Egypt, with desert sand and camels in the background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 3,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing ${isFemale ? 'a casual white linen blouse, light blue jeans, and white leather sneakers' : 'a white t-shirt, beige cargo shorts, and white sneakers'}. Jerusalem old city background, Israel`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 4,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing ${isFemale ? 'a tropical floral sundress and flat woven sandals' : 'a light tropical short-sleeve shirt, beige shorts, and casual leather sandals'}. In front of temple in Bangkok, Thailand`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 5,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing ${isFemale ? 'a flowing earth-toned dress with a light scarf, and flat leather sandals' : 'a beige linen shirt, light trousers, a light scarf, and sturdy brown leather sandals'}. In front of the rock-hewn churches of Lalibela in Ethiopia`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 6,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing ${isFemale ? 'a long boho-style dress with a light shawl, and flat tan leather sandals' : 'a white linen shirt, beige trousers, and tan leather loafers'}. In front of the Hagia Sophia in Istanbul, Turkey`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 7,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing ${isFemale ? 'a wool coat, knitted scarf, and black leather knee-high boots' : 'a heavy wool coat, dark scarf, and dark leather lace-up boots'}. In Red Square, Moscow, Russia, with light snow on the ground`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 8,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing ${isFemale ? 'a denim jacket, white t-shirt, blue jeans, and classic white sneakers' : 'a casual gray hoodie, blue jeans, and white sneakers'}. In Times Square, New York City, USA, with bright billboards in the background`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 9,
        },
        {
            imageGenerator: {
                prompt: `Front full body standing. Preserve exact identity from image 1, wearing ${isFemale ? 'a colorful embroidered blouse, denim shorts, and comfortable white sneakers' : 'a white embroidered linen shirt, beige shorts, and tan suede desert boots'}. In front of the Chichen Itza pyramid in Mexico`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 10,
        },
    ]
}

export const genLuxuryLifeData = (userId: string, avatarId: string, parameters: AvatarParameters, idPhotoSet: IdPhotoSetPaths): {
    imageGenerator: AiModelGateway, order: number
}[] => {
    const { gender } = parameters;
    const isFemale = gender === 'female';
    const ratio = ImageRatios['3:4'];

    return [
        {
            imageGenerator: {
                prompt: `Three quarter to the right. Preserve exact identity from image 1, sitting on the back seat of a luxurious car with leather seats. Photo taken from the front passenger seat. Wearing ${isFemale ? 'a sleek black turtleneck under a tailored camel wool coat, a delicate gold chain necklace, and a small Hermès Kelly bag resting on the lap' : 'a fitted deep navy turtleneck, a sharp charcoal cashmere overcoat'}. Overcast daylight`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.rightQuarter!, idPhotoSet.body!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 1,
        },
        {
            imageGenerator: {
                prompt: `Front full body. Preserve exact identity from image 1, sitting in a private jet, cream leather seat, oval window on the left showing blue sky. Wearing ${isFemale ? 'a caramel cashmere wrap cardigan over a cream silk blouse, tailored wide-leg ivory trousers, a gold Cartier Love bracelet on the wrist, and a Hermès Birkin bag visible beside the seat' : 'a fitted off-white linen shirt with the top two buttons open, tailored sand-colored trousers'}`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!, idPhotoSet.body!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 2,
        },
        {
            imageGenerator: {
                prompt: `Front upper body. Preserve exact identity from image 1, sitting at a candlelit table in a fine dining restaurant, looking at camera, crystal glassware and white tablecloth in front, hands under the table, soft warm lighting. Wearing ${isFemale ? 'a deep emerald green silk halter dress, a delicate diamond drop necklace, diamond stud earrings, and a small black Chanel clutch resting on the table' : 'a sharply tailored midnight navy double-breasted suit, a crisp white dress shirt open at the collar, a silk pocket square'}`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!, idPhotoSet.body!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 3,
        },
        {
            imageGenerator: {
                prompt: `Front full body. Preserve exact identity from image 1, standing at the yard of luxury villa. Wearing ${isFemale ? 'a fitted ribbed white tank top tucked into high-waisted wide-leg tailored trousers in cream, pointed-toe slingback heels in nude, a structured mini shoulder bag in soft beige, delicate layered gold jewelry' : 'a white cotton t-shirt, white shorts, clean white minimalist leather sneakers, and a matte silver watch'}`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!, idPhotoSet.frontSmile!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 4,
        },
        {
            imageGenerator: {
                prompt: `Full body front shot. Preserve exact identity from image 1, reclining on a sunbed at an overwater bungalow resort, turquoise ocean and palm trees in the background, tropical cocktail on the side table. Wearing ${isFemale ? 'a luxurious coral silk slip dress, and layered delicate gold necklaces' : 'a crisp white open-collar linen shirt, tailored light blue linen shorts'}`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!, idPhotoSet.frontSmile!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 5,
        },
        {
            imageGenerator: {
                prompt: `Front full body. Preserve exact identity from image 1, standing inside a Louis Vuitton flagship boutique, neutral expression, iconic monogram displays. Wearing ${isFemale ? 'a tailored ivory blazer over a black silk camisole, high-waisted black wide-leg trousers, black strappy heeled sandals, and a Louis Vuitton Speedy 25 bag held in the hand' : 'a fitted black ribbed turtleneck, tailored dark charcoal slim-fit trousers, polished black Chelsea boots, and a Louis Vuitton Keepall bag held in the hand'}`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.body!, idPhotoSet.front!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 6,
        },
        {
            imageGenerator: {
                prompt: `Front upper body. Preserve exact identity from image 1, sitting relaxed in a leather boss chair at work desk in a minimalist skyscraper office, floor-to-ceiling city skyline windows behind, closed-lid Macbook laptop on the table, looking towards camera. Wearing ${isFemale ? 'a perfectly tailored slate gray blazer over a white silk blouse, diamond stud earrings, and delicate reading glasses resting on the desk' : 'a fitted charcoal bespoke suit with a crisp white dress shirt, no tie'}`,
                negativePrompt: '',
                ratio,
                imagePaths: [idPhotoSet.front!, idPhotoSet.body!],
                uploadPath: `media/${userId}-user/avatars/${avatarId}-avatar/images/${uuid.v4()}.png`,
                temperature: 0,
                status: JobStatuses.pending,
                model: Models.geminiImage3Pro,
                platform: Platforms.google,
                service: Services.aiModelGateway
            },
            order: 7,
        },
    ]
}