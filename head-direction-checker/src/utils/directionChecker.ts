import Human, { Config } from '@vladmandic/human';
import logger from '../logger';

const config: Partial<Config> = {
  modelBasePath: process.env.HUMAN_MODEL_PATH || 'file:///workspace/models/human',
  face: { enabled: true, detector: { enabled: true }, mesh: { enabled: true } },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  debug: false,
};

const human = new Human(config);

export const checkDirection = async (image: Buffer, requiredDirection: string): Promise<boolean> => {
  const tensor = human.tf.node.decodeImage(image, 3);
  const result = await human.detect(tensor as any);
  human.tf.dispose(tensor);

  if (!result.face || result.face.length === 0) {
    logger.warn('No face detected for direction check — passing by default');
    return true;
  }

  const face = result.face[0];

  if (!face.mesh || face.mesh.length < 264) {
    logger.warn('Insufficient face mesh points — passing by default');
    return true;
  }

  // MediaPipe 468-point mesh: 1=nose tip, 33=right eye outer, 263=left eye outer
  const noseTip  = face.mesh[1];
  const rightEye = face.mesh[33];
  const leftEye  = face.mesh[263];

  const midEyeX    = (rightEye[0] + leftEye[0]) / 2;
  const interOcular = Math.abs(rightEye[0] - leftEye[0]);

  if (interOcular < 1) {
    logger.warn('Inter-ocular distance near zero — cannot determine direction, passing by default');
    return true;
  }

  // avatar's right → viewer sees left cheek  → nose shifts left  → yawRatio < 0
  // avatar's left  → viewer sees right cheek → nose shifts right → yawRatio > 0
  // front          → nose centered between eyes                  → |yawRatio| < FRONT_THRESHOLD
  const FRONT_THRESHOLD = 0.15;
  const yawRatio = (noseTip[0] - midEyeX) / interOcular;

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
