import { AvatarGender } from "../types/avatar";
import { deleteAvatarById } from "../services/apiGateway";
import type { IdPhotoJobInput, Job } from "../types/job";

export const GENERAL_STORAGE_KEY = 'avatar_general_data';
export const ID_PHOTO_STORAGE_KEY = 'avatar_id_photo_data';
export const PHOTO_SET_STORAGE_KEY = 'avatar_photo_set_data';

export const handleCancel = async (avatarId: string, setCancelLoading: Function, navigate: Function) => {
    localStorage.removeItem(GENERAL_STORAGE_KEY);
    localStorage.removeItem(ID_PHOTO_STORAGE_KEY);
    localStorage.removeItem(PHOTO_SET_STORAGE_KEY);

    if (avatarId) {
        setCancelLoading(true);
        try {
            await deleteAvatarById(avatarId);
            setCancelLoading(false);
            navigate('/');
        } catch (error: any) {
            console.log(`Failed to remove avatar`);
        } finally {
            setCancelLoading(false);
        }
        
    }
};

export type GeneralStepData = {
    name: string;
    gender: AvatarGender;
    avatarId: string;
    finished: boolean;
};

export const initialGeneralData = {
    name: '',
    gender: AvatarGender.female,
    avatarId: '',
    finished: false
};

export enum IdPhotoModes {
  generate = 'generate',
  upload = 'upload'
};

export type IdPhotoGeneratedImage = {
  url: string;
  bucketPath: string;
};

export type IdPhotoStepData = {
  mode: IdPhotoModes;
  parameters: Omit<IdPhotoJobInput, 'gender'>;
  jobs: Partial<Job>[];
  generatedImages: IdPhotoGeneratedImage[];
  selectedImage: string;
  uploadedPortrait: string | null;
  finished: boolean;
};

export const initialAvatarParameters = {
    ethnicity: '', skinColor: '', age: '', attractiveness: '', body: '', 
    face: '', hairStyle: '', hairColor: '', nose: '', eyes: '', eyeLashes: '', eyeBrows: '', 
    skin: '', facialHair: '', outfit: '', lips: '', ears: '', bustSize: ''
};

export const initialIdPhotoData = {
  mode: IdPhotoModes.generate,
  parameters: initialAvatarParameters,
  jobs: [],
  generatedImages: [],
  selectedImage: '',
  uploadedPortrait: '',
  finished: false
} as IdPhotoStepData;

export const AVATAR_PARAMETER_OPTIONS = {
    ethnicity: ["northern european", "southern european", "eastern european", "east asian", "south asian", "southeast asian", "central asian", "middle eastern", "north african", "west african", "east african", "latino", "native american", "pacific islander"],
    skinColor: ["porcelain", "fair", "ivory", "beige", "olive", "tan", "caramel", "brown", "dark-brown", "ebony"],
    age: ["child", "teenager", "20s", "30s", "40s", "50s", "60s", "70s", "80s+"],
    eyes: ["dark brown", "light brown", "amber", "hazel", "green", "blue", "gray", "violet", "two-toned"],
    eyeLashes: ["none", "short sparse", "short dense", "medium natural", "medium curled", "long wispy", "long dramatic", "tapered"],
    eyeBrows: ["thin straight", "thin arched", "medium natural", "medium rounded", "thick bushy", "thick groomed", "monobrow", "faded tail"],
    nose: ["small button", "small upturned", "medium straight", "medium roman", "large aquiline", "large bulbous", "broad flat", "crooked"],
    lips: ["full", "thin", "heart-shaped", "wide", "round", "bow-shaped", "heavy-upper", "heavy-lower", "downward-turned"],
    ears: ["attached", "detached", "petite", "protruding", "pointed", "elven", "round", "droopy"],
    bustSize: ["flat", "small", "medium", "large", "extra-large"],
    male: {
        attractiveness: ["rugged", "handsome", "pretty boy", "masculine", "scholarly", "weathered", "sharp", "soft featured", "unconventional", "intimidating", "approachable"],
        body: ["slim", "athletic", "average", "muscular", "large"],
        face: ["square", "oval", "round", "diamond", "angular"],
        hairStyle: ["short cut", "crew cut", "side part", "long straight", "man bun", "waves", "dreadlocks", "afro", "undercut", "bald", "braids"],
        hairColor: ["black", "dark brown", "light brown", "blonde", "ash blonde", "red", "platinum", "salt & pepper", "white"],
        skin: ["smooth", "freckled", "tanned", "weathered"],
        facialHair: ["clean-shaven", "stubble", "full beard", "short beard", "mustache", "goatee"],
        outfit: ["minimalist", "streetwear", "business professional", "smart casual", "rugged outdoors", "vintage 90s", "skater", "preppy", "techwear", "athleisure", "bohemian", "classic tailored", "punk rock", "avant garde", "workwear", "sport"]
    },
    female: {
        attractiveness: ["beautiful", "cute", "elegant", "androgynous", "striking", "ethereal", "youthful", "mature", "bold", "natural", "glamorous"],
        body: ["slim", "athletic", "average", "curvy", "full-figured"],
        face: ["oval", "heart", "round", "square", "diamond"],
        hairStyle: ["long straight", "long waves", "pixie cut", "ponytail", "bob cut", "curly", "afro", "box braids", "space buns", "shaved sides"],
        hairColor: ["black", "dark brown", "light brown", "honey blonde", "platinum", "auburn", "red", "silver", "pastel blue", "pastel pink"],
        skin: ["smooth", "dewy", "freckled", "matte", "sun-kissed"],
        facialHair: ["none", "full beard", "short stubble", "mustache", "light fuzz"],
        outfit: ["chic minimalist", "streetwear", "business formal", "boho artistic", "cottagecore", "vintage glamour", "athleisure", "preppy academy", "grunge", "y2k aesthetic", "high fashion", "soft girl", "cyberpunk", "classic elegant", "tomboy", "sport"]
    }
};

export type PhotoSetStepData = {
  jobs: Partial<Job>[];
  generatedImages: IdPhotoGeneratedImage[];
  finished: boolean;
};

export const initialPhotoSetData = {
  jobs: [],
  generatedImages: [],
  finished: false
} as PhotoSetStepData;