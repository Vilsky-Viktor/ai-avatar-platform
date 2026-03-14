import os
from typing import Any

from openai import OpenAI
from PIL import Image

from gen_text_image_to_image_service.utils import image_to_base64

DEFAULT_SAMPLING_PARAMS = {
    "mistralai/pixtral-large-2411": dict(temperature=0.15),
    "qwen/qwen3.5-plus-02-15": dict(temperature=0.7)
}

SYSTEM_MESSAGE_UPSAMPLING_T2I = """You are an expert prompt engineer for FLUX.2 by Black Forest Labs. Rewrite user prompts to be more descriptive while strictly preserving their core subject and intent.

Guidelines:
1. Structure: Keep structured inputs structured (enhance within fields). Convert natural language to detailed paragraphs.
2. Details: Add concrete visual specifics - form, scale, textures, materials, lighting (quality, direction, color), shadows, spatial relationships, and environmental context.
3. Text in Images: Put ALL text in quotation marks, matching the prompt's language. Always provide explicit quoted text for objects that would contain text in reality (signs, labels, screens, etc.) - without it, the model generates gibberish.

Output only the revised prompt and nothing else."""

SYSTEM_MESSAGE_UPSAMPLING_I2I = """You are FLUX.2 by Black Forest Labs, an image-editing expert. You convert editing requests into one concise instruction, simple scenes in ~80 words, complex scenes up to ~250 words.

Rules:
- HIGHEST PRIORITY: Preserve subject identity exactly — face, body proportions, distinguishing features must remain unchanged unless explicitly asked to change them
- The TEXT PROMPT defines what to change and is the source of truth for the output
- The REFERENCE IMAGE is used only to preserve identity, lighting, and composition — do NOT carry over background or scene details from it unless the text prompt instructs you to
- No commentary or explanation, output the prompt only
- Use clear, analytical language (avoid vague words like "whimsical", "ethereal", "cascading")
- Explicitly state what changes AND what must be preserved (identity, lighting, composition, background)
- Reference actual elements visible in the image
- Turn negatives into positives ("don't change X" → "keep X exactly as is")
- Make abstractions concrete ("futuristic" → "glowing cyan neon lights, brushed metallic panels")

Output only the final text prompt. Nothing else."""


class OpenRouterAPIClient:
    """Client for OpenRouter API-based prompt upsampling."""

    def __init__(
        self,
        sampling_params: dict[str, Any],
        model: str = "mistralai/pixtral-large-2411",
        max_tokens: int = 512,
    ):
        """
        Initialize the OpenRouter API client.

        Args:
            model: Model name to use for upsampling. Defaults to "mistralai/pixtral-large-2411".
                   Can be any OpenRouter model (e.g., "mistralai/pixtral-large-2411",
                   "qwen/qwen3-vl-235b-a22b-instruct", etc.)
        """

        self.api_key = os.environ["OPENROUTER_API_KEY"]
        self.client = OpenAI(api_key=self.api_key, base_url="https://openrouter.ai/api/v1")
        self.model = model
        self.sampling_params = sampling_params
        self.max_tokens = max_tokens

    def _format_messages(
        self,
        prompt: str,
        system_message: str,
        images: list[Image.Image] | None = None,
    ) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = [
            {"role": "system", "content": system_message},
        ]

        if images:
            content = []

            for img in images:
                img_base64 = image_to_base64(img)
                content.append(
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{img_base64}",
                        },
                    }
                )
            content.append({"type": "text", "text": prompt})
            messages.append({"role": "user", "content": content})
        else:
            messages.append({"role": "user", "content": prompt})

        return messages

    def upsample_prompt(
        self,
        txt: list[str],
        img: list[Image.Image] | list[list[Image.Image]] | None = None,
    ) -> list[str]:
        """
        Upsample prompts using OpenRouter API.

        Args:
            txt: List of input prompts to upsample
            img: Optional list of images or list of lists of images.
                 If None or empty, uses t2i mode, otherwise i2i mode.

        Returns:
            List of upsampled prompts
        """
        # Determine system message based on whether images are provided
        has_images = img is not None and len(img) > 0
        if has_images and isinstance(img[0], list):
            has_images = len(img[0]) > 0

        if has_images:
            system_message = SYSTEM_MESSAGE_UPSAMPLING_I2I
        else:
            system_message = SYSTEM_MESSAGE_UPSAMPLING_T2I

        upsampled_prompts = []

        # Process each prompt (potentially with images)
        for i, prompt in enumerate(txt):
            # Get images for this prompt
            prompt_images: list[Image.Image] | None = None
            if img is not None and len(img) > i:
                if isinstance(img[i], list):
                    prompt_images = img[i] if len(img[i]) > 0 else None
                elif isinstance(img[i], Image.Image):
                    prompt_images = [img[i]]

            # Format messages
            messages = self._format_messages(
                prompt=prompt,
                system_message=system_message,
                images=prompt_images,
            )

            # Call API
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=self.max_tokens,
                    **self.sampling_params,
                )

                upsampled = response.choices[0].message.content.strip()
                upsampled_prompts.append(upsampled)
            except Exception as e:
                print(f"Error upsampling prompt via OpenRouter API: {e}, returning original prompt")
                upsampled_prompts.append(prompt)

        return upsampled_prompts
