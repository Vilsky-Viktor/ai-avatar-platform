import { AvatarGender } from './avatar';

export type Voice = {
    id: string;
    name: string;
    gender: AvatarGender;
    age: string;
    category: string;
    description: string;
    language: string;
    previewUrl: string;
    useCase: string;
}
