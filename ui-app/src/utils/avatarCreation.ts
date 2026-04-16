import { deleteAvatarById } from "../services/apiGateway";
import { AvatarGender, AvatarTypes } from "../types/avatar";
import { IdPhotoModes, type IdPhotoStepData, type PhotoSetStepData, type GeneralStepData, type VoiceStepData } from "../types/avatarCreation";


export const GENERAL_STORAGE_KEY = 'avatar_general_data';
export const ID_PHOTO_STORAGE_KEY = 'avatar_id_photo_data';
export const PHOTO_SET_STORAGE_KEY = 'avatar_photo_set_data';
export const VOICE_STORAGE_KEY = 'avatar_voice_data';


function encodeBase64(text: string): string {
  return btoa(text);
}

function decodeBase64(base64String: string): string {
  return atob(base64String);
}

export const handleCancel = async (avatarId: string, setCancelLoading: Function, navigate: Function) => {
    localStorage.removeItem(GENERAL_STORAGE_KEY);
    localStorage.removeItem(ID_PHOTO_STORAGE_KEY);
    localStorage.removeItem(PHOTO_SET_STORAGE_KEY);

    if (avatarId) {
        setCancelLoading(true);
        try {
            await deleteAvatarById(avatarId);
        } catch (error: any) {
            console.log(`Failed to remove avatar`);
        }
    }

    setCancelLoading(false);
    navigate('/');
};

export const initialAvatarParameters = {
    gender: AvatarGender.male, ethnicity: '', skinColor: '', age: '', attractiveness: '', body: '', 
    face: '', hairStyle: '', hairColor: '', nose: '', eyes: '', eyeLashes: '', eyeBrows: '', 
    skin: '', facialHair: '', lips: '', ears: '', bustSize: '', bodyHair: '', height: ''
};

export const initialIdPhotoData = {
    jobs: [],
    finished: false
} as IdPhotoStepData;

export const initialGeneralData = {
    name: '',
    slug: '',
    type: AvatarTypes.digitalTwin,
    parameters: initialAvatarParameters,
    avatarId: '',
    finished: false
};

export const initialUploadedIdPhotoSet = [
    { photo: null, isDragging: false },
    { photo: null, isDragging: false },
    { photo: null, isDragging: false },
    { photo: null, isDragging: false },
]

export const initialPhotoSetData = {
  jobs: Array(36).fill(null),
  finished: false,
} as PhotoSetStepData;

export const initialVoiceData = {
    mediaPath: "",
    uploaded: false,
    selectedId: "",
    finished: false,
} as VoiceStepData;

export const AVATAR_PARAMETER_OPTIONS = {
    ethnicity: ["northern european", "southern european", "eastern european", "east asian", "south asian", "southeast asian", "central asian", "middle eastern", "north african", "west african", "east african", "latino", "native american", "pacific islander"],
    skinColor: ["porcelain", "fair", "ivory", "beige", "olive", "tan", "caramel", "brown", "dark-brown", "ebony"],
    age: ["teenage", "20s", "30s", "40s", "50s", "60s", "70s", "80s"],
    height: ["petite", "below average", "average", "above average", "tall", "very tall"],
    eyes: ["dark brown", "light brown", "amber", "hazel", "green", "blue", "gray", "violet", "two-toned"],
    eyeLashes: ["none", "short sparse", "short dense", "medium natural", "medium curled", "long wispy", "long dramatic", "tapered"],
    eyeBrows: ["thin straight", "thin arched", "medium natural", "medium rounded", "thick bushy", "thick groomed", "monobrow", "faded tail"],
    nose: ["small button", "small upturned", "medium straight", "medium roman", "large aquiline", "large bulbous", "broad flat", "crooked"],
    lips: ["full", "thin", "heart-shaped", "wide", "round", "bow-shaped", "heavy-upper", "heavy-lower", "downward-turned"],
    ears: ["attached", "detached", "petite", "protruding", "pointed", "elven", "round", "droopy"],
    bustSize: ["flat", "small", "medium", "large", "extra-large"],
    bodyHair: ["none", "peach fuzz", "fine light", "fine medium", "textured light", "textured medium", "dense moderate", "dense intense"],
    male: {
        attractiveness: ["rugged", "handsome", "pretty boy", "masculine", "scholarly", "weathered", "sharp", "soft featured", "unconventional", "intimidating", "approachable"],
        body: ["slim", "athletic", "average", "muscular", "large"],
        face: ["square", "oval", "round", "diamond", "angular"],
        hairStyle: ["short cut", "crew cut", "side part", "long straight", "man bun", "waves", "dreadlocks", "afro", "undercut", "bald", "braids"],
        hairColor: ["black", "dark brown", "light brown", "blonde", "ash blonde", "red", "platinum", "salt & pepper", "white"],
        skin: ["smooth", "freckled", "tanned", "weathered"],
        facialHair: ["clean-shaven", "stubble", "full beard", "short beard", "mustache", "goatee"],
    },
    female: {
        attractiveness: ["beautiful", "cute", "elegant", "androgynous", "striking", "ethereal", "youthful", "mature", "bold", "natural", "glamorous"],
        body: ["slim", "athletic", "average", "curvy", "full-figured"],
        face: ["oval", "heart", "round", "square", "diamond"],
        hairStyle: ["long straight", "long waves", "pixie cut", "ponytail", "bob cut", "curly", "afro", "box braids", "space buns", "shaved sides"],
        hairColor: ["black", "dark brown", "light brown", "honey blonde", "platinum", "auburn", "red", "silver", "pastel blue", "pastel pink"],
        skin: ["smooth", "dewy", "freckled", "matte", "sun-kissed"],
        facialHair: ["none", "full beard", "short stubble", "mustache", "light fuzz"],
    }
};

type StepData = GeneralStepData | IdPhotoStepData | PhotoSetStepData | VoiceStepData;

export const getLocalStorageData = <T extends StepData>(key: string): T => {
    const encodedData = localStorage.getItem(key);

    if (encodedData) {
        const decodedData = decodeBase64(encodedData);
        return JSON.parse(decodedData);
    }

    if (key === GENERAL_STORAGE_KEY) {
        return initialGeneralData as T;
    } else if (key === ID_PHOTO_STORAGE_KEY) {
        return initialIdPhotoData as T;
    } else if (key === PHOTO_SET_STORAGE_KEY) {
        return initialPhotoSetData as T;
    } else if (key === VOICE_STORAGE_KEY) {
        return initialVoiceData as T;
    } else {
        return {} as T
    }
}

export const saveLocalStorageData = <T extends StepData>(key: string, data: T): void => {
    const jsonData = JSON.stringify(data);
    const encodedData = encodeBase64(jsonData);
    localStorage.setItem(key, encodedData);
}