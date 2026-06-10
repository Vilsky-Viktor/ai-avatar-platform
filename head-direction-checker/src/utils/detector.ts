import * as ort from 'onnxruntime-web';
import sharp from 'sharp';
import path from 'path';
import logger from '@loom24/shared/logger';

const MODEL_PATH = '/app/models/det_10g.onnx';
const INPUT_SIZE = 640;
const SCORE_THRESHOLD = 0.3;
const NMS_THRESHOLD = 0.4;
const FACE_PADDING = 0.5;
const FRONT_RANGE:          [number, number] = [-0.1,      0.1];
const LEFT_QUARTER_RANGE:   [number, number] = [-0.9,     -0.4];
const RIGHT_QUARTER_RANGE:  [number, number] = [ 0.4,      0.9];
const LEFT_SIDE_RANGE:      [number, number] = [-Infinity, -1.3];
const RIGHT_SIDE_RANGE:     [number, number] = [ 1.3,  Infinity];
const NUM_ANCHORS = 2;
const STRIDES = [8, 16, 32];

ort.env.wasm.wasmPaths = path.resolve('node_modules/onnxruntime-web/dist/') + '/';

let session: ort.InferenceSession | null = null;

async function getSession(): Promise<ort.InferenceSession> {
  if (session) return session;
  session = await ort.InferenceSession.create(MODEL_PATH, { executionProviders: ['wasm'] });

  if (session.outputNames.length !== 9) {
    throw new Error(`SCRFD model has unexpected output count ${session.outputNames.length}, expected 9: ${session.outputNames.join(', ')}`);
  }
  return session;
}

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

function toFloat32(pixelData: Buffer): Float32Array {
  const plane = INPUT_SIZE * INPUT_SIZE;
  const float32 = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    float32[0 * plane + i] = (pixelData[i * 3 + 0] - 127.5) / 128;
    float32[1 * plane + i] = (pixelData[i * 3 + 1] - 127.5) / 128;
    float32[2 * plane + i] = (pixelData[i * 3 + 2] - 127.5) / 128;
  }
  return float32;
}

interface ScrfdResult {
  boxes: number[][];
  scores: number[];
  kps: number[][];
}

async function runScrfd(pixelData: Buffer, sess: ort.InferenceSession): Promise<ScrfdResult> {
  const float32 = toFloat32(pixelData);
  const inputName = sess.inputNames[0];
  const feeds: Record<string, ort.Tensor> = {
    [inputName]: new ort.Tensor('float32', float32, [1, 3, INPUT_SIZE, INPUT_SIZE]),
  };
  const outputs = await sess.run(feeds);

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

      const x1 = ax - bboxes[i * 4 + 0] * stride;
      const y1 = ay - bboxes[i * 4 + 1] * stride;
      const x2 = ax + bboxes[i * 4 + 2] * stride;
      const y2 = ay + bboxes[i * 4 + 3] * stride;

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

  return { boxes: allBoxes, scores: allScores, kps: allKps };
}

export const checkDirection = async (image: Buffer, requiredDirection: string): Promise<boolean> => {
  const sess = await getSession();

  const { data: rotatedBuffer, info: rotatedInfo } = await sharp(image)
    .rotate()
    .toBuffer({ resolveWithObject: true });

  const origW = rotatedInfo.width;
  const origH = rotatedInfo.height;

  const detectScale = Math.min(INPUT_SIZE / origW, INPUT_SIZE / origH);
  const scaledW = Math.round(origW * detectScale);
  const scaledH = Math.round(origH * detectScale);
  const padX = Math.round((INPUT_SIZE - scaledW) / 2);
  const padY = Math.round((INPUT_SIZE - scaledH) / 2);

  const { data: detectData } = await sharp(rotatedBuffer)
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0 } })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { boxes, scores } = await runScrfd(detectData as Buffer, sess);
  const keepIdx = nmsKeep(boxes, scores);

  if (!keepIdx.length) {
    logger.warn('No face detected for direction check — failing');
    return false;
  }

  const [x1d, y1d, x2d, y2d] = boxes[keepIdx[0]];
  const origX1 = Math.max(0, (x1d - padX) / detectScale);
  const origY1 = Math.max(0, (y1d - padY) / detectScale);
  const origX2 = Math.min(origW, (x2d - padX) / detectScale);
  const origY2 = Math.min(origH, (y2d - padY) / detectScale);

  const faceW = origX2 - origX1;
  const faceH = origY2 - origY1;
  const side = Math.max(faceW, faceH) * (1 + FACE_PADDING);
  const cx = (origX1 + origX2) / 2;
  const cy = (origY1 + origY2) / 2;

  const cropLeft   = Math.max(0, Math.round(cx - side / 2));
  const cropTop    = Math.max(0, Math.round(cy - side / 2));
  const cropRight  = Math.min(origW, Math.round(cx + side / 2));
  const cropBottom = Math.min(origH, Math.round(cy + side / 2));
  const cropW = cropRight - cropLeft;
  const cropH = cropBottom - cropTop;

  if (cropW <= 0 || cropH <= 0) {
    logger.warn({ cropW, cropH }, 'Invalid face crop dimensions — failing');
    return false;
  }

  const { data: faceData } = await sharp(rotatedBuffer)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { boxes: faceBoxes, scores: faceScores, kps: faceKps } = await runScrfd(faceData as Buffer, sess);
  const faceKeepIdx = nmsKeep(faceBoxes, faceScores);

  if (!faceKeepIdx.length) {
    logger.warn('Face not detected in cropped region — failing');
    return false;
  }

  const kps = faceKps[faceKeepIdx[0]];
  const rightEyeX = kps[0];
  const leftEyeX  = kps[2];
  const noseTipX  = kps[4];

  const midEyeX     = (rightEyeX + leftEyeX) / 2;
  const interOcular = Math.abs(rightEyeX - leftEyeX);

  if (interOcular < 1) {
    logger.warn('Inter-ocular distance too small — passing by default');
    return true;
  }

  const yawRatio = (noseTipX - midEyeX) / interOcular;

  const inRange = (value: number, [min, max]: [number, number]) => value >= min && value <= max;

  let passed: boolean;
  switch (requiredDirection) {
    case 'front':        passed = inRange(yawRatio, FRONT_RANGE);         break;
    case 'leftQuarter':  passed = inRange(yawRatio, LEFT_QUARTER_RANGE);  break;
    case 'rightQuarter': passed = inRange(yawRatio, RIGHT_QUARTER_RANGE); break;
    case 'leftSide':     passed = inRange(yawRatio, LEFT_SIDE_RANGE);     break;
    case 'rightSide':    passed = inRange(yawRatio, RIGHT_SIDE_RANGE);    break;
    default:
      logger.warn({ requiredDirection }, 'Unknown direction — passing by default');
      passed = true;
  }

  logger.info({ yawRatio: yawRatio.toFixed(3), expected: requiredDirection, passed }, 'Face direction check');
  return passed;
};
