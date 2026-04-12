export type ImagePaths = {
    microPortrait?: string;
    front?: string;
    frontSmile?: string;
    rightQuarter?: string;
    leftQuarter?: string;
    rightSide?: string;
    leftSide?: string;
    back?: string;
    body?: string;
}

export type IdPhotoSetPaths = {
    generated: ImagePaths;
    uploaded: ImagePaths;
}
