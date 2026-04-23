export type ImagePaths = {
    front?: string;
    frontSmile?: string;
    rightQuarter?: string;
    leftQuarter?: string;
    rightSide?: string;
    leftSide?: string;
    upperBody?: string;
}

export type IdPhotoSetPaths = {
    generated: ImagePaths;
    uploaded: ImagePaths;
}

export type PhotoSetCaption = {
  caption: string;
  order: number;
}
