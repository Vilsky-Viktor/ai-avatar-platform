import { qwenEdit2511 } from "../types/image";

export const buildQwenImageEditToolkitConfig = (numImages: number) => ({
  job: 'extension',
  config: {
    process: [{
      type: 'sd_trainer',
      device: 'cuda:0',
      network: { type: 'lora', linear: 32, linear_alpha: 32 },
      save: { dtype: 'float16', save_every: 1000, max_step_saves_to_keep: 4 },
      datasets: [{ caption_ext: 'txt', resolution: [qwenEdit2511['1:1T'][0]], caption_dropout_rate: 0.05, cache_latents_to_disk: true }],
      train: {
        batch_size: 1,
        steps: numImages * 200,
        gradient_accumulation: 1,
        train_unet: true,
        train_text_encoder: false,
        gradient_checkpointing: true,
        noise_scheduler: 'flowmatch',
        optimizer: 'adamw8bit',
        lr: 2e-4,
        lr_scheduler: 'constant',
        dtype: 'bf16',
        cache_text_embeddings: true,
        timestep_type: 'sigmoid',
      },
      model: {
        arch: 'qwen_image_edit',
      },
    }],
  },
});
