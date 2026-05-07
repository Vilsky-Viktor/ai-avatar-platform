import { FaceExpressionTypes, InferenceJob } from "../types/job"
import { qwenEdit2511 } from "../types/image"
import { AVATAR_REFERENCE_NAME } from '../utils/trainingPhotoSetCaptions';
import { AvatarParameters, LoraConfig } from "../types/avatar";


export const genWhatsappStickersData = (lora: LoraConfig, idPhotoPaths: string[], parameters: AvatarParameters): Partial<InferenceJob>[] => {
    const squareSize = qwenEdit2511['1:1'];
    const squareDimention = `${squareSize[0]}x${squareSize[1]}`;

    return [
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `wearing dark gray t-shirt. Dark gray concrete wall`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: squareSize[0],
                    height: squareSize[1],
                    guidanceScale: 1.0,
                },
                faceExpression: { enabled: true, type: FaceExpressionTypes.sad, scale: 1.0 },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.94 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: squareDimention, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
            maxRuns: 3,
            order: 1,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `wearing crimson red t-shirt. Crimson red concrete wall`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: squareSize[0],
                    height: squareSize[1],
                    guidanceScale: 1.0,
                },
                faceExpression: { enabled: true, type: FaceExpressionTypes.angry, scale: 0.6 },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.94 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: squareDimention, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
            maxRuns: 3,
            order: 2,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `wearing mustard yellow t-shirt. Mustard yellow concrete wall`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: squareSize[0],
                    height: squareSize[1],
                    guidanceScale: 1.0, 
                },
                faceExpression: { enabled: true, type: FaceExpressionTypes.happy, scale: 0.9 },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.94 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: squareDimention, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
            maxRuns: 3,
            order: 3,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `Mouth is slightly open. wearing teal t-shirt. Teal concrete wall`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: squareSize[0],
                    height: squareSize[1],
                    guidanceScale: 1.0,
                },
                faceExpression: { enabled: true, type: FaceExpressionTypes.surprised, scale: 0.75 },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.94 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: squareDimention, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
            maxRuns: 3,
            order: 4,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `wearing burnt orange t-shirt. Burnt orange concrete wall`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: squareSize[0],
                    height: squareSize[1],
                    guidanceScale: 1.0,
                },
                faceExpression: { enabled: true, type: FaceExpressionTypes.anxious, scale: 0.9 },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.94 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: squareDimention, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
            maxRuns: 3,
            order: 5,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `wearing dusty coral t-shirt. Dusty coral concrete wall`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: squareSize[0],
                    height: squareSize[1],
                    guidanceScale: 1.0,
                },
                faceExpression: { enabled: true, type: FaceExpressionTypes.shy, scale: 0.5 },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.94 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: squareDimention, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
            maxRuns: 3,
            order: 6,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `wearing dusty lavender t-shirt. Dusty lavender concrete wall`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: squareSize[0],
                    height: squareSize[1],
                    guidanceScale: 1.0,
                },
                faceExpression: { enabled: true, type: FaceExpressionTypes.sleepy, scale: 1.0 },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.94 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: squareDimention, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
            maxRuns: 3,
            order: 7,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `wearing dark violet t-shirt. Dark violet concrete wall`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: squareSize[0],
                    height: squareSize[1],
                    guidanceScale: 1.0,
                },
                faceExpression: { enabled: true, type: FaceExpressionTypes.fear, scale: 1.1 },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.94 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: squareDimention, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
            maxRuns: 3,
            order: 8,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `wearing muted mustard t-shirt. Muted mustard concrete wall`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: squareSize[0],
                    height: squareSize[1],
                    guidanceScale: 1.0,
                },
                faceExpression: { enabled: true, type: FaceExpressionTypes.confused, scale: 1.5 },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.94 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: squareDimention, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
            maxRuns: 3,
            order: 9,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `wearing olive green t-shirt. Olive green concrete wall`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: squareSize[0],
                    height: squareSize[1],
                    guidanceScale: 1.0,
                },
                faceExpression: { enabled: true, type: FaceExpressionTypes.disgust, scale: 0.9 },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.94 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
                    { path: lora.path, scale: 0.95, filename: lora.filename },
                ],
            },
            metadata: { dimensions: squareDimention, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
            maxRuns: 3,
            order: 10,
        },
    ]
}

export const genOutfitStylesData = (lora: LoraConfig, idPhotoPaths: string[], parameters: AvatarParameters): Partial<InferenceJob>[] => {
    const { gender } = parameters;
    const isFemale = gender === 'female';

    const portraitSize = qwenEdit2511['3:4'];
    const portraitDimention = `${portraitSize[0]}x${portraitSize[1]}`;

    return [
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing business formal style ${isFemale ? 'tailored navy blazer over a white silk blouse, matching navy pencil skirt, sheer tights, and black patent leather stiletto pumps with a pointed toe' : 'tailored charcoal gray two-piece suit, crisp white dress shirt, dark silk tie, and polished black calfskin cap-toe oxford shoes with subtle brogue detailing'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 1,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing smart casual style ${isFemale ? 'a fitted cream knit sweater, dark slim-fit trousers, and camel suede Chelsea ankle boots with an elastic side panel and a low stacked heel' : 'a navy blazer over a light blue button-down shirt, dark chinos, and suede loafers'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 2,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing sport elegant style ${isFemale ? 'a fitted black athletic top, matching high-waisted leggings, a tailored cream longline cardigan, and clean white leather low-profile sneakers with a thin sole' : 'a fitted black performance polo, slim tapered jogger trousers, a lightweight gray bomber jacket, and clean white leather minimalist sneakers with a thin profile'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 3,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing streetwear style ${isFemale ? 'an oversized graphic hoodie, baggy cargo pants, a crossbody bag, and chunky triple-white platform sneakers with a thick rubber sole' : 'an oversized hoodie, baggy cargo pants, and chunky off-white sneakers'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 4,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing casual chic style ${isFemale ? 'a fitted white t-shirt tucked into high-waisted dark jeans, a tailored beige blazer draped over the shoulders, delicate gold jewelry, and ivory suede pointed-toe mule slides' : 'a fitted white t-shirt, dark well-fitted jeans, a tailored beige blazer, and suede loafers'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 5,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing athleisure style ${isFemale ? 'a fitted gray sports bra under a cropped oversized hoodie, matching gray high-waisted leggings, and slate gray technical running sneakers with neon green sole accents' : 'a fitted gray performance t-shirt, an unzipped gray track jacket, matching gray jogger sweatpants, and charcoal gray performance running sneakers with electric blue heel accents'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 6,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing business casual style ${isFemale ? 'a tucked-in light blue button-down blouse, tailored beige trousers, a thin leather belt, and blush nude leather pointed-toe flats with a delicate bow detail' : 'a light blue button-down shirt, beige chinos, a brown leather belt, and chestnut brown leather double monk strap shoes'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 7,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing evening glam style ${isFemale ? 'a fitted floor-length black sequin gown with a subtle slit, statement diamond earrings, a delicate clutch, and black satin strappy stiletto sandals with crystal embellishments on the straps' : 'a sharply tailored black tuxedo, a crisp white dress shirt, a black silk bow tie, a black silk pocket square, and polished black patent leather cap-toe oxfords with a mirror-gloss finish'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 8,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing bohemian style ${isFemale ? 'a flowing cream maxi dress with floral embroidery and lace details, layered beaded necklaces, a wide-brim tan straw hat, and rust-colored suede ankle boots with embroidered folk patterns and tassel lacing' : 'a loose cream linen button-down shirt with rolled sleeves, beige drawstring linen trousers, a layered wooden bead necklace, and dark espresso huarache sandals with hand-woven suede straps and a natural jute sole'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 9,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing minimalist style ${isFemale ? 'a fitted plain white crewneck t-shirt, tailored straight-leg black trousers, a thin silver chain necklace, and clean white leather pointed-toe flats with a barely-there sole' : 'a fitted plain white crewneck t-shirt, tailored straight-leg black trousers, and clean matte black leather loafers with a slim profile and squared toe'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 10,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing old money style ${isFemale ? 'a cream cable-knit cashmere sweater draped over the shoulders of a crisp white collared shirt, tailored beige pleated trousers, a delicate pearl necklace, and deep burgundy leather penny loafers with a gold coin detail' : 'a navy cashmere sweater over a crisp white collared shirt, tailored beige pleated trousers, a brown leather belt, and dark tan suede whole-cut penny loafers'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 11,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing preppy style ${isFemale ? 'a navy blazer with gold buttons over a white polo shirt, a pleated red and navy tartan plaid skirt, white knee-high socks, and caramel and white two-tone spectator penny loafers' : 'a navy blazer with gold buttons over a white polo shirt, beige chinos, a brown leather belt, and boat shoes with white rubber soles'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 12,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing vintage style ${isFemale ? 'a fitted red polka dot swing dress with a cinched waist and full skirt, a silk neck scarf, vintage cat-eye sunglasses, and cherry red patent leather kitten heel pumps' : 'a fitted white t-shirt tucked into high-waisted dark blue cuffed jeans, a brown leather belt, hair styled with pomade, and two-tone leather wingtip brogues'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 13,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing edgy rock style ${isFemale ? 'a black fitted band t-shirt, a black leather biker jacket with silver hardware, ripped black skinny jeans, layered silver chain necklaces, and black leather lace-up platform combat boots with silver buckle straps and a chunky lugged sole' : 'a black graphic band t-shirt, a black leather biker jacket with silver hardware, ripped black skinny jeans, a studded black leather belt, and black leather lace-up combat boots with a thick rubber sole and silver toe caps'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 14,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing, wearing beachwear style ${isFemale ? 'a white triangle bikini top, a flowing sheer white sarong tied at the hip, a wide-brim straw sun hat, and ivory braided raffia flat sandals with thin ankle-tie straps' : 'tropical patterned short-sleeve shirt, white swim trunks, and navy blue rubber flip flops with rope-textured straps'}. Gray wall background, light wooden floor, gray armchair on the right and standing mirror on the left`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.9 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView' },
            maxRuns: 3,
            order: 15,
        }, 
    ]
}

export const genTravelingAroundTheWorldData = (lora: LoraConfig, idPhotoPaths: string[], parameters: AvatarParameters): Partial<InferenceJob>[] => {
    const { gender } = parameters;
    const isFemale = gender === 'female';
    
    const portraitSize = qwenEdit2511['3:4'];
    const portraitDimention = `${portraitSize[0]}x${portraitSize[1]}`;

    return [
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} standing, looking at camera. Wearing ${isFemale ? 'a chic beige trench coat over a striped top, slim jeans' : 'a navy wool coat over a white shirt, dark trousers'}. In front of the Eiffel Tower in Paris`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 3,
            order: 1,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} standing, looking at camera. Wearing ${isFemale ? 'an elegant white linen sundress with a tan leather belt' : 'a light blue linen shirt, beige chinos'}. In front of the Colosseum in Rome, Italy`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 3,
            order: 2,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} standing, looking at camera. Wearing ${isFemale ? 'a flowy beige maxi dress, a wide-brim straw hat' : 'a beige linen shirt, khaki trousers, and a wide-brim hat'}. In front of the Pyramids of Giza in Egypt, with desert sand and camels in the background`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 3,
            order: 3,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} standing, looking at camera. Wearing ${isFemale ? 'a casual white linen blouse, light blue jeans' : 'a white t-shirt, beige cargo shorts'}. Jerusalem old city background, Israel`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 3,
            order: 4,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} standing, looking at camera. Wearing ${isFemale ? 'a tropical floral sundress' : 'a light tropical short-sleeve shirt, beige shorts'}. In front of temple in Bangkok, Thailand`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 3,
            order: 5,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} standing, looking at camera. Wearing ${isFemale ? 'a flowing earth-toned dress with a light scarf' : 'a beige linen shirt, light trousers, and a light scarf'}. In front of the rock-hewn churches of Lalibela in Ethiopia`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 3,
            order: 6,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} standing, looking at camera. Wearing ${isFemale ? 'a long boho-style dress with a light shawl' : 'a white linen shirt, beige trousers'}. In front of the Hagia Sophia in Istanbul, Turkey`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 3,
            order: 7,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} standing, looking at camera. Wearing ${isFemale ? 'a wool coat, knitted scarf' : 'a heavy wool coat, dark scarf'}. In Red Square, Moscow, Russia, with light snow on the ground`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 3,
            order: 8,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} standing, looking at camera. Wearing ${isFemale ? 'a denim jacket, white t-shirt, blue jeans' : 'a casual gray hoodie, blue jeans'}. In Times Square, New York City, USA, with bright billboards in the background`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 3,
            order: 9,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} standing, looking at camera. Wearing ${isFemale ? 'a colorful embroidered blouse, denim shorts' : 'a white embroidered linen shirt, beige shorts'}. In front of the Chichen Itza pyramid in Mexico`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 3,
            order: 10,
        },
    ]
}

export const genLuxuryLifeData = (lora: LoraConfig, idPhotoPaths: string[], parameters: AvatarParameters): Partial<InferenceJob>[] => {
    const { gender } = parameters;
    const isFemale = gender === 'female';
    
    const portraitSize = qwenEdit2511['3:4'];
    const portraitDimention = `${portraitSize[0]}x${portraitSize[1]}`;

    return [
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} sitting in a luxurious car interior, leather seats, ambient lighting. Wearing ${isFemale ? 'a sleek black turtleneck under a tailored camel wool coat, a delicate gold chain necklace, and a small Hermès Kelly bag resting on the lap' : 'a fitted deep navy turtleneck, a sharp charcoal cashmere overcoat'}`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 5,
            order: 1,
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} sitting in a private jet, cream leather seat, oval window on the left showing blue sky. Wearing ${isFemale ? 'a caramel cashmere wrap cardigan over a cream silk blouse, tailored wide-leg ivory trousers, a gold Cartier Love bracelet on the wrist, and a Hermès Birkin bag visible beside the seat' : 'a fitted off-white linen shirt with the top two buttons open, tailored sand-colored trousers'}`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 5,
            order: 2
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} sitting at a candlelit table in a fine dining restaurant, crystal glassware and white tablecloth in front, hands under the table, soft warm lighting. Wearing ${isFemale ? 'a deep emerald green silk halter dress, a delicate diamond drop necklace, diamond stud earrings, and a small black Chanel clutch resting on the table' : 'a sharply tailored midnight navy double-breasted suit, a crisp white dress shirt open at the collar, a silk pocket square'}`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 5,
            order: 3
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing at the yard of luxury villa. Wearing ${isFemale ? 'a flowing white linen wide-leg pantsuit with a deep V-neckline, layered delicate gold necklaces, a Louis Vuitton Neverfull tote over the shoulder, and white strappy flat sandals' : 'a fitted white linen shirt with rolled sleeves, tailored off-white linen trousers worn with no socks, tan suede espadrille loafers'}`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 5,
            order: 4
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} reclining on a sunbed at an overwater bungalow resort, looking at camera, turquoise ocean and palm trees in the background, tropical cocktail on the side table. Wearing ${isFemale ? 'a luxurious coral silk slip dress, and layered delicate gold necklaces' : 'a crisp white open-collar linen shirt, tailored light blue linen shorts'}`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 5,
            order: 5
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} full body standing inside a Louis Vuitton flagship boutique, iconic monogram displays and warm gold lighting in the background. Wearing ${isFemale ? 'a tailored ivory blazer over a black silk camisole, high-waisted black wide-leg trousers, black strappy heeled sandals, and a Louis Vuitton Speedy 25 bag held in the hand' : 'a fitted black ribbed turtleneck, tailored dark charcoal slim-fit trousers, polished black Chelsea boots, and a Louis Vuitton Keepall bag held in the hand'}`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 5,
            order: 6
        },
        {
            input: {
                checkDependencies: false,
                inference: {
                    prompt: `${AVATAR_REFERENCE_NAME} upper body view, sitting at work desk in a minimalist skyscraper office, floor-to-ceiling city skyline windows behind, closed-lid Macbook laptop on the table, looking towards camera. Wearing ${isFemale ? 'a perfectly tailored slate gray blazer over a white silk blouse, diamond stud earrings, and delicate reading glasses resting on the desk' : 'a fitted charcoal bespoke suit with a crisp white dress shirt, no tie'}`,
                    mediaPaths: [],
                    numSteps: 8,
                    width: portraitSize[0],
                    height: portraitSize[1],
                    guidanceScale: 1.0,
                },
                faceRecognition: { enabled: true, mediaPaths: idPhotoPaths, threshold: { min: 0.92 } },
                loras: [
                    { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
                    { path: lora.path, scale: 1.0, filename: lora.filename },
                ],
            },
            metadata: { dimensions: portraitDimention, ratio: '1:1', angle: '0:0', shotType: 'frontUpperBodyView' },
            maxRuns: 5,
            order: 7
        },
    ]
}