import { deleteAvatarById } from "../services/apiGateway";
import { AvatarGender, AvatarTypes, type Avatar } from "../types/avatar";
import { type NewAvatarData } from "../types/avatarCreation";
import { decode, encode } from "./encoder";

export const NEW_AVATAR_DATA = 'new_avatar_data';

export const NUM_ID_PHOTOS = 9;
export const NUM_PHOTO_SET_PHOTOS = 34;


export const handleCancel = async (avatarId: string, setCancelLoading: Function, navigate: Function) => {
    localStorage.removeItem(NEW_AVATAR_DATA);

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

export const initialNewAvatarData = {
    avatarId: "",
    groupId: ""
} as NewAvatarData;

export const initialAvatarParameters = {
    gender: AvatarGender.male, ethnicity: '', skinColor: '', age: '', attractiveness: '', body: '', 
    face: '', hairStyle: '', hairColor: '', nose: '', eyes: '', eyeLashes: '', eyeBrows: '', 
    skin: '', facialHair: '', lips: '', ears: '', bustSize: '', bodyHair: '', height: ''
};

export const initialAvatarData = {
    name: "",
    slug: "",
    type: AvatarTypes.synthetic,
    parameters: initialAvatarParameters
} as Avatar;

export const initialUploadedIdPhotoSet = [
    { photo: null, isDragging: false },
    { photo: null, isDragging: false },
    { photo: null, isDragging: false },
    { photo: null, isDragging: false },
]

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
    hairColor: ["black", "dark brown", "light brown", "blonde", "honey blonde", "ash blonde", "platinum", "auburn", "red", "silver", "salt & pepper", "white", "gray", "pastel blue", "pastel green", "pastel pink"],
    male: {
        attractiveness: ["rugged", "handsome", "pretty boy", "masculine", "scholarly", "weathered", "sharp", "soft featured", "unconventional", "intimidating", "approachable"],
        body: ["slim", "athletic", "average", "muscular", "large", "dad bod"],
        face: ["square", "oval", "round", "diamond", "angular"],
        hairStyle: ["short cut", "crew cut", "side part", "long straight", "man bun", "waves", "dreadlocks", "afro", "undercut", "bald", "braids"],
        skin: ["smooth", "freckled", "tanned", "weathered"],
        facialHair: ["clean-shaven", "stubble", "full beard", "short beard", "mustache", "goatee"],
    },
    female: {
        attractiveness: ["beautiful", "cute", "elegant", "androgynous", "striking", "ethereal", "youthful", "mature", "bold", "natural", "glamorous"],
        body: ["slim", "athletic", "average", "curvy", "full-figured"],
        face: ["oval", "heart", "round", "square", "diamond"],
        hairStyle: ["long straight", "long waves", "pixie cut", "ponytail", "bob cut", "curly", "afro", "box braids", "space buns", "shaved sides"],
        skin: ["smooth", "dewy", "freckled", "matte", "sun-kissed"],
        facialHair: ["none", "full beard", "short stubble", "mustache", "light fuzz"],
    }
};

export const getAvatarData = (): NewAvatarData => {
    const encodedData = localStorage.getItem(NEW_AVATAR_DATA);

    if (encodedData) {
        const decodedData = decode(encodedData);
        return JSON.parse(decodedData);
    }

    return initialNewAvatarData;
}

export const saveAvatarData = (data: NewAvatarData): void => {
    const jsonData = JSON.stringify(data);
    const encodedData = encode(jsonData);
    localStorage.setItem(NEW_AVATAR_DATA, encodedData);
}
