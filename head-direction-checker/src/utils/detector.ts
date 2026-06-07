import * as ort from 'onnxruntime-web';
import sharp from 'sharp';
import path from 'path';
import logger from '@loom24/shared/logger';

const MODEL_PATH = '/app/models/det_10g.onnx';
const INPUT_SIZE = 640;
const SCORE_THRESHOLD = 0.3;
const NMS_THRESHOLD = 0.4;
const FRONT_MAX    = 0.15;  // |yawRatio| < 0.15         → front
const QUARTER_MIN  = 0.55;  // 0.55–0.85               → genuine 3/4 profile
const QUARTER_MAX  = 0.85;  // gap: 0.85–1.05
const SIDE_MIN     = 1.05;  // >1.05                   → genuine side profile
const NUM_ANCHORS = 2;
const STRIDES = [8, 16, 32];

// Point onnxruntime-web to the WASM files bundled in node_modules
ort.env.wasm.wasmPaths = path.resolve('node_modules/onnxruntime-web/dist/') + '/';

let session: ort.InferenceSession | null = null;

async function getSession(): Promise<ort.InferenceSession> {
  if (session) return session;
  session = await ort.InferenceSession.create(MODEL_PATH, { executionProviders: ['wasm'] });
  logger.info('SCRFD ONNX session initialized');
  return session;
}

// Generate anchor center coordinates (in pixel space) for a given stride
function generateAnchors(stride: number): Float32Array {
  const gridSize = INPUT_SIZE / stride;
  const total = gridSize * gridSize * NUM_ANCHORS;
  const anchors = new Float32Array(total * 2);
  let idx = 0;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      for (let a = 0; a < NUM_ANCHORS; a++) {
        anchors[idx++] = col * stride;
        anchors[idx++] = row * stride;
      }
    }
  }
  return anchors;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function nmsKeep(boxes: number[][], scores: number[]): number[] {
  const order = scores
    .map((_s, i) => i)
    .filter(i => scores[i] >= SCORE_THRESHOLD)
    .sort((a, b) => scores[b] - scores[a]);

  const keep: number[] = [];
  const suppressed = new Uint8Array(scores.length);

  for (const i of order) {
    if (suppressed[i]) continue;
    keep.push(i);
    const [x1, y1, x2, y2] = boxes[i];
    const areaI = (x2 - x1) * (y2 - y1);
    for (const j of order) {
      if (suppressed[j] || j === i) continue;
      const [x1j, y1j, x2j, y2j] = boxes[j];
      const interW = Math.max(0, Math.min(x2, x2j) - Math.max(x1, x1j));
      const interH = Math.max(0, Math.min(y2, y2j) - Math.max(y1, y1j));
      const iou = (interW * interH) / (areaI + (x2j - x1j) * (y2j - y1j) - interW * interH);
      if (iou > NMS_THRESHOLD) suppressed[j] = 1;
    }
  }
  return keep;
}

export const checkDirection = async (image: Buffer, requiredDirection: string): Promise<boolean> => {
  const sess = await getSession();

  // Resize to 640x640 (letterbox), remove alpha, get raw RGB pixels
  const { data } = await sharp(image)
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0 } })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // HWC RGB → CHW float32, normalize: (pixel - 127.5) / 128
  const float32 = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
  const plane = INPUT_SIZE * INPUT_SIZE;
  for (let i = 0; i < plane; i++) {
    float32[0 * plane + i] = (data[i * 3 + 0] - 127.5) / 128; // R
    float32[1 * plane + i] = (data[i * 3 + 1] - 127.5) / 128; // G
    float32[2 * plane + i] = (data[i * 3 + 2] - 127.5) / 128; // B
  }

  const inputName = sess.inputNames[0];
  const feeds: Record<string, ort.Tensor> = {
    [inputName]: new ort.Tensor('float32', float32, [1, 3, INPUT_SIZE, INPUT_SIZE]),
  };
  const outputs = await sess.run(feeds);

  // Output order: scores×3, bboxes×3, kps×3 (one per stride)
  const outputVals = sess.outputNames.map(n => outputs[n].data as Float32Array);
  const [sc8, sc16, sc32, bb8, bb16, bb32, kp8, kp16, kp32] = outputVals;

  const allScores: number[] = [];
  const allBoxes: number[][] = [];
  const allKps: number[][] = [];

  for (let si = 0; si < STRIDES.length; si++) {
    const stride = STRIDES[si];
    const scores = [sc8, sc16, sc32][si];
    const bboxes = [bb8, bb16, bb32][si];
    const kps    = [kp8, kp16, kp32][si];
    const anchors = generateAnchors(stride);
    const n = anchors.length / 2;

    for (let i = 0; i < n; i++) {
      const ax = anchors[i * 2];
      const ay = anchors[i * 2 + 1];

      // Decode bbox: anchor_center + distance * stride (distance2bbox)
      const x1 = ax - bboxes[i * 4 + 0] * stride;
      const y1 = ay - bboxes[i * 4 + 1] * stride;
      const x2 = ax + bboxes[i * 4 + 2] * stride;
      const y2 = ay + bboxes[i * 4 + 3] * stride;

      // Decode 5 keypoints: anchor_center + offset * stride (distance2kps)
      const pts: number[] = [];
      for (let k = 0; k < 5; k++) {
        pts.push(ax + kps[i * 10 + k * 2 + 0] * stride);
        pts.push(ay + kps[i * 10 + k * 2 + 1] * stride);
      }

      allScores.push(sigmoid(scores[i]));
      allBoxes.push([x1, y1, x2, y2]);
      allKps.push(pts);
    }
  }

  const keepIdx = nmsKeep(allBoxes, allScores);

  if (!keepIdx.length) {
    logger.warn('No face detected for direction check — passing by default');
    return true;
  }

  // Best detection — keypoint layout: [rightEye_x, rightEye_y, leftEye_x, leftEye_y, nose_x, nose_y, ...]
  const kps = allKps[keepIdx[0]];
  const rightEyeX = kps[0];
  const leftEyeX  = kps[2];
  const noseTipX  = kps[4];

  const midEyeX     = (rightEyeX + leftEyeX) / 2;
  const interOcular = Math.abs(rightEyeX - leftEyeX);

  if (interOcular < 1) {
    logger.warn('Inter-ocular distance too small — passing by default');
    return true;
  }

  // viewer's left  → nose shifts left  in frame → yawRatio < 0
  // viewer's right → nose shifts right in frame → yawRatio > 0
  // front          → nose centered              → |yawRatio| < FRONT_THRESHOLD
  const yawRatio = (noseTipX - midEyeX) / interOcular;

  let passed: boolean;
  switch (requiredDirection) {
    case 'front':
      passed = Math.abs(yawRatio) < FRONT_MAX;
      break;
    case 'leftQuarter':
      passed = yawRatio <= -QUARTER_MIN && yawRatio > -QUARTER_MAX;
      break;
    case 'rightQuarter':
      passed = yawRatio >= QUARTER_MIN && yawRatio < QUARTER_MAX;
      break;
    case 'leftSide':
      passed = yawRatio <= -SIDE_MIN;
      break;
    case 'rightSide':
      passed = yawRatio >= SIDE_MIN;
      break;
    default:
      logger.warn({ requiredDirection }, 'Unknown direction — passing by default');
      passed = true;
  }

  logger.info({ yawRatio: yawRatio.toFixed(3), expected: requiredDirection, passed }, 'Face direction check');
  return passed;
};
