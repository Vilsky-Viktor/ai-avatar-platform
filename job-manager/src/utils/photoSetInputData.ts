import { AvatarParameters, AvatarTypes } from '../types/avatar';
import { IdPhotoSetPaths } from '../types/trainingPhotoSet';
import { InferenceJob, FaceExpressionTypes, Directions } from '../types/job';
import imageRatios from '../types/imageRatios';

export const generateTrainingPhotoSetData = (parameters: AvatarParameters, avatarType: AvatarTypes, idPhotoSet: IdPhotoSetPaths): Partial<InferenceJob>[] => {
  const { gender } = parameters;

  const trainingRatio = imageRatios.qwenEdit2511['1:1'];
  const trainingDimensions = `${trainingRatio[0]}x${trainingRatio[1]}`;

  const isFemale = gender === 'female';
  const emotionNumFrontRepetitions = avatarType === AvatarTypes.twin ? 3 : 2;

  return [
    // =================================================================
    // CLOSE-UP EMOTIONS
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to deep slate blue sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.sad, scale: 0.9 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: {
          min: AvatarTypes.twin ? 0.9 : 0.8,
          max: 0.96
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 9,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to crimson red sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.angry, scale: 0.7 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: {
          min: AvatarTypes.twin ? 0.88 : 0.8,
          max: 0.96
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 10,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to warm peach sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.happy, scale: 0.6 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: {
          min: AvatarTypes.twin ? 0.95 : 0.8,
          max: 0.96
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 11,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to bright yellow sleeveless t-shirt. Exact same teeth from input images`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.frontSmile),
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.happy, scale: 0.85 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.frontSmile!], threshold: {
          min: AvatarTypes.twin ? 0.94 : 0.9,
          max: 0.96
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 12,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to electric teal sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.surprised, scale: 0.57 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: {
          min: AvatarTypes.twin ? 0.92 : 0.9,
          max: 0.96
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 13,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to burnt orange sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.anxious, scale: 0.7 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: {
          min: AvatarTypes.twin ? 0.89 : 0.85,
          max: 0.96
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 14,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to soft rose sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.shy, scale: 0.7 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: {
          min: AvatarTypes.twin ? 0.92 : 0.8,
          max: 0.96
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 15,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to dusty lavender sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.sleepy, scale: 0.65 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: {
          min: AvatarTypes.twin ? 0.92 : 0.85,
          max: 0.96
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 16,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Change outfit to dark violet sleeveless t-shirt`,
          mediaPaths: Array(emotionNumFrontRepetitions).fill(idPhotoSet.generated.front),
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
        },
        faceExpression: { enabled: true, type: FaceExpressionTypes.fear, scale: 0.6 },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.front!], threshold: {
          min: AvatarTypes.twin ? 0.89 : 0.8,
          max: 0.96
        }},
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.5 },
          { path: "models/qwen-edit-2511/loras/Qwen-PixelSmile", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 },
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontCloseUpView' },
      maxRuns: 5,
      order: 17,
    },

    // =================================================================
    // BEST chest-up PORTRAITS (most diverse lighting/outfit combos)
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front chest-up portrait. Change outfit to ${isFemale ? 'flowy sage green midi dress with subtle puff sleeves' : 'khaki light jaket with white tee'}. Change background to outdoor park. Change light to soft golden hour`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!],
          threshold: { min: AvatarTypes.twin ? 0.94 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: AvatarTypes.twin ? 0.5 : 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 }
        ],
      },
      metadata: {
        dimensions: trainingDimensions,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontChestUpView',
      },
      maxRuns: 5,
      order: 18,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front chest-up portrait. Deep in thought, pensive expression, gaze directed upward. Change outfit to ${isFemale ? 'a chunky cream cable-knit sweater' : 'a soft taupe merino wool crewneck'}. Change background to cozy living room setting. Change light to soft warm candlelight`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!],
          threshold: { min: AvatarTypes.twin ? 0.94 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: AvatarTypes.twin ? 0.5 : 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 }
        ],
      },
      metadata: {
        dimensions: trainingDimensions,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontChestUpView',
      },
      maxRuns: 5,
      order: 19,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front chest-up portrait. Confident expression, direct stare to camera, relaxed jaw, lips lightly pressed together. Change outfit to ${isFemale ? 'a tailored pale blue Oxford shirt' : 'a modern business casual light gray button-down with micro-check pattern, light blue tie'}. Change background to modern indoor office environment. Change light to white bright office lighting`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!],
          threshold: { min: AvatarTypes.twin ? 0.94 : 0.9 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: AvatarTypes.twin ? 0.5 : 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 }
        ],
      },
      metadata: {
        dimensions: trainingDimensions,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontChestUpView',
      },
      maxRuns: 5,
      order: 20,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front chest-up portrait. Change outfit to fitted dark charcoal turtleneck. Change background to deep dark studio background. Change light to soft low-key light from the front-left, gently illuminating the face with natural shadow falloff toward the right side and edges`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!],
          threshold: { min: 0.88 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: AvatarTypes.twin ? 0.5 : 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 }
        ],
      },
      metadata: {
        dimensions: trainingDimensions,
        ratio: '1:1',
        angle: '0:0',
        shotType: 'frontChestUpView',
      },
      maxRuns: 7,
      order: 21,
    },

    // =================================================================
    // CHEST-UP ANGULAR & DYNAMIC HEAD COVERAGE
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Quarter chest-up portrait, shoulders on the edge of the frame. Change outfit to ${isFemale ? 'a cozy oversized oatmeal cardigan' : 'a soft gray zip-up hoodie'}. Change background to loft style living room interior. Change light to soft indoor lamp light`,
          mediaPaths: [idPhotoSet.generated.rightQuarter!, idPhotoSet.generated.rightQuarter!, idPhotoSet.generated.rightQuarter!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.right },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.rightQuarter!], threshold: { min: AvatarTypes.twin ? 0.94 : 0.85 } },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '45:0', shotType: 'leftQuarterChestUpView' },
      maxRuns: 5,
      order: 22,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Quarter chest-up portrait, shoulders on the edge of the frame. Change outfit to ${isFemale ? 'a relaxed beige trench coat over a cream turtleneck' : 'a camel overcoat layered over a white crewneck'}. Change background to indoor cafe with a bar. Change light to soft natural daylight from ceiling to floor windows on the right`,
          mediaPaths: [idPhotoSet.generated.leftQuarter!, idPhotoSet.generated.leftQuarter!, idPhotoSet.generated.leftQuarter!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.left },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.leftQuarter!], threshold: { min: AvatarTypes.twin ? 0.94 : 0.85 } },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '45:0', shotType: 'leftQuarterChestUpView' },
      maxRuns: 5,
      order: 23,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Side chest-up portrait, nose tip at mid-frame vertically. Change outfit to ${isFemale ? 'a light pink windbreaker' : 'a light blue windbreaker'}. Change background to urban street. Change light to very early evening`,
          mediaPaths: [idPhotoSet.generated.rightSide!, idPhotoSet.generated.rightSide!, idPhotoSet.generated.rightSide!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.right },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.rightSide!], threshold: { min: AvatarTypes.twin ? 0.92 : 0.85 } },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '90:0', shotType: 'rightSideChestUpView' },
      maxRuns: 7,
      order: 24,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Side chest-up portrait, nose tip at mid-frame vertically. Change outfit to ${isFemale ? 'a metallic silver cropped jacket' : 'a sleek black puffer vest over hoodie'}. Change background to urban street. Change light to very early evening`,
          mediaPaths: [idPhotoSet.generated.leftSide!, idPhotoSet.generated.leftSide!, idPhotoSet.generated.leftSide!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceDirection: { enabled: true, direction: Directions.left },
        faceRecognition: { enabled: true, mediaPaths: [idPhotoSet.generated.leftSide!], threshold: { min: AvatarTypes.twin ? 0.92 : 0.85 } },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject", scale: 1.0 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '90:0', shotType: 'leftSideChestUpView' },
      maxRuns: 7,
      order: 25,
    },

    // =================================================================
    // UPPER-BODY SHOTS
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front full body shot. Change outfit to ${isFemale ? 'a soft beige cashmere turtleneck sweater with high-waisted cream wool trousers' : 'an olive green henley shirt with dark charcoal slim-fit chinos'}. Change background to indoor cozy living room, softly blurred. Change light to warm natural window light from the front-right, soft shadows on right side`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.93 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontUppperBodyView' },
      maxRuns: 5,
      order: 26,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front upper body shot. Change outfit to ${isFemale ? 'a silky emerald green camisole with delicate straps and a fitted black midi skirt' : 'a fitted black turtleneck under a charcoal overcoat with tailored charcoal wool trousers'}. Change background to blurred rooftop city night background. Change light to evening warm tungsten light`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.93 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontUppperBodyView' },
      maxRuns: 5,
      order: 27,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front upper body shot, sitting at the work desk, looking towards camera. Change outfit to ${isFemale ? 'a tailored pinstripe blazer in soft gray over white tee and pants' : 'a modern slim-fit navy blazer with white dress shirt and navy pants'}. Change background to co-working space background with people working, gray cement walls style, industrial aesthetic, wooden minimalist desk and Apple Mackbook on it on the left side. Change light to office bright white light`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.93 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontUppperBodyView' },
      maxRuns: 5,
      order: 28,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Front upper body shot, standing casually. Change outfit to ${isFemale ? 'black racing-style crop jacket, gray crop top underneath' : 'black racing jacket with subtle contrast stitching, clean gray t-shirt underneath'}. Change background to garage with a fleet of luxury mix of sport and business cars. Change light to parking indoor lighting`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.93 : 0.85 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontUppperBodyView' },
      maxRuns: 5,
      order: 29,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Sitting, hands on sides supporting body. Change outfit to ${isFemale ? 'pink fitted racerback crop tank top, light gray fleece sweat shorts with elastic waistband' : 'relaxed gray joggers, white t-shirt'}. Change background to king size bed in the hotel room. Change light to simple hotel interior soft light`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.93 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontUppperBodyView' },
      maxRuns: 5,
      order: 30,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Laying on abdomen, upper body slightly lifted and supported by both elbows, legs are visible on the background, hands are resting palms down, looking towards camera. Change outfit to ${isFemale ? 'a stylish soft sleep pink pajama' : 'gray modal lounge shorts, t-shirt'}. Change background to bed in the bedroom. Change light to soft romantic bedroom light`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.93 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontUppperBodyView' },
      maxRuns: 5,
      order: 31,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Upper body extreme low-angle shot, looking directly at camera. Change outfit to blue jeans and light gray polo. Change background to blue sky with white clouds. Change light to soft diffused daylight`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.9 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:30', shotType: 'frontUppperBodyView' },
      maxRuns: 5,
      order: 32,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Upper body extreme high-angle overhead shot, looking up towards camera. Change outfit to white shorts, light gray t-shirt. Change background to sahara desert. Change light to sunny weather`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.9 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:30', shotType: 'frontUppperBodyView', },
      maxRuns: 5,
      order: 33,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Sitting, direct stare to camera, one knee bent upwards. Change outfit to ${isFemale ? 'a breezy yellow floral wrap midi dress with short puff sleeves and v-neckline' : 'pastel yellow shorts and hawaiian shirt'}. Change background to lounge chair on the beach. Change light to soft daylight`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.93 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontUppperBodyView'},
      maxRuns: 5,
      order: 34,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Sitting cross-legged, relaxed pose. Change outfit to ${isFemale ? 'flowy boho pants in terracotta and cropped top' : 'relaxed-fit dark green cargo shorts and gray tee'}, barefoot. Change background to park grass. Change light to early morning`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.92 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontUppperBodyView'},
      maxRuns: 5,
      order: 35,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Upper body standing. Change outfit to ${isFemale ? 'a breezy white cover-up dress' : 'lightweight linen shorts and sleeveless white t-shirt'}. Change background to tropical path. Change light to soft daylight`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.93 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontUppperBodyView'},
      maxRuns: 5,
      order: 36,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Upper body standing, looking directly towards camera. Change outfit to ${isFemale ? 'a structured ivory blazer worn open over a slate grey silk slip dress, delicate gold layered necklaces' : 'a oversized stone-grey wool trench coat worn open over a fine black merino crewneck and slim dark taupe trousers'}. Change background to city skyline balcony view. Change light to overcast daylight`,
          mediaPaths: [idPhotoSet.generated.body!, idPhotoSet.generated.body!, idPhotoSet.generated.front!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.88 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 0.7 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView'},
      maxRuns: 7,
      order: 37,
    },
    
    // =================================================================
    // FULL-BODY & EXTREME POSES (maximum pose/lighting/clothing diversity)
    // =================================================================

    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Walking, looking directly towards camera. Change outfit to ${isFemale ? 'a short black cocktail dress with spaghetti straps, high heels' : 'a charcoal suit with white dress shirt, no tie, loafers'}. Change background to city street sidewalk background. Change light to overcast daylight`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.88 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 1.0 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView'},
      maxRuns: 7,
      order: 38,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Jogging towards camera, looking directly towards camera. Change outfit to ${isFemale ? 'minimalist all-black athleisure set' : 'modern all-black tracksuit with clean lines, t-shirt'} and black Nike sport shoes. Change background to stadium. Change light to overcast daylight`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.88 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 1.0 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '1:1', angle: '0:0', shotType: 'frontFullBodyView'},
      maxRuns: 7,
      order: 39,
    },
    {
      input: {
        checkDependencies: true,
        inference: {
          prompt: `Dancing, looking directly towards camera. Change outfit to ${isFemale ? 'a fitted black micro mini skirt, sleeveless white bodysuit, black pointed-toe heels' : 'a black crew-neck tee, light blue jeans, white minimalist sneakers'}. Change background to street full of bars. Change light to overcast daylight`,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          numSteps: 8,
          width: trainingRatio[0],
          height: trainingRatio[1],
          guidanceScale: 1.0,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: [idPhotoSet.generated.front!, idPhotoSet.generated.body!],
          threshold: { min: AvatarTypes.twin ? 0.88 : 0.8 }
        },
        loras: [
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16", scale: 0.55 },
          { path: "models/qwen-edit-2511/loras/Qwen-Image-Edit-2509-Relight", scale: 1.0 },
          ...(AvatarTypes.synthetic ? [{ path: "models/qwen-edit-2511/loras/qwen-edit-skin", scale: 1.0 }] : []),
        ],
      },
      metadata: { dimensions: trainingDimensions, ratio: '9:16', angle: '0:0', shotType: 'frontFullBodyView' },
      maxRuns: 7,
      order: 40,
    },
  ];
};

