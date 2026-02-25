import { AvatarGender } from "./avatar"

export type Voice = {
    id: string;
    name: string;
    gender: AvatarGender;
    imagePath: string;
    audioPath: string;
}