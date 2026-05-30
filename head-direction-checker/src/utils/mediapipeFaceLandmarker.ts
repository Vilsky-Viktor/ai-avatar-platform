import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import sharp from 'sharp';
import path from 'path';
import logger from '../logger';

const FACE_LANDMARKER_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const WASM_PATH = path.resolve('node_modules/@mediapipe/tasks-vision/wasm');
const FRONT_THRESHOLD = 0.15;

let landmarker: FaceLandmarker | null = null;

async function getLandmarker(): Promise<FaceLandmarker> {
  if (landmarker) return landmarker;

  const filesetResolver = await FilesetResolver.forVisionTasks(WASM_PATH);
  landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: 'CPU' },
    runningMode: 'IMAGE',
    numFaces: 1,
  });

  logger.info('MediaPipe FaceLandmarker initialized');
  return landmarker;
}

export const checkDirection = async (image: Buffer, requiredDirection: string): Promise<boolean> => {
  const detector = await getLandmarker();

  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const imageData = { data: new Uint8ClampedArray(data), width: info.width, height: info.height } as ImageData;

  const result = detector.detect(imageData);

  if (!result.faceLandmarks?.length) {
    logger.warn('No face detected for direction check — passing by default');
    return true;
  }

  const landmarks = result.faceLandmarks[0];

  // MediaPipe 478-point mesh (normalized 0-1): 1=nose tip, 33=right eye outer, 263=left eye outer
  const noseTip  = landmarks[1];
  const rightEye = landmarks[33];
  const leftEye  = landmarks[263];

  const midEyeX     = (rightEye.x + leftEye.x) / 2;
  const interOcular = Math.abs(rightEye.x - leftEye.x);

  if (interOcular < 0.01) {
    logger.warn('Inter-ocular distance too small — passing by default');
    return true;
  }

  // avatar's right → nose shifts left  → yawRatio < 0
  // avatar's left  → nose shifts right → yawRatio > 0
  // front          → nose centered     → |yawRatio| < FRONT_THRESHOLD
  const yawRatio = (noseTip.x - midEyeX) / interOcular;

  let passed: boolean;
  if (requiredDirection === 'front') {
    passed = Math.abs(yawRatio) < FRONT_THRESHOLD;
  } else if (requiredDirection === 'right') {
    passed = yawRatio < -FRONT_THRESHOLD;
  } else {
    passed = yawRatio > FRONT_THRESHOLD;
  }

  logger.info(`Face direction: yawRatio=${yawRatio.toFixed(3)}, expected=${requiredDirection} → ${passed ? 'ok' : 'FAIL'}`);
  return passed;
};
