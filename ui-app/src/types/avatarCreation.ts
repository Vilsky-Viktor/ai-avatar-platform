export type NewAvatarData = {
  avatarId: string;
  groupId: string;
}

export type UploadedIdPhoto = {
  photo: string | null;
  mediaUrl?: string;
  isDragging: boolean;
}
