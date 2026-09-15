import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  stableDiffusionApiKey: process.env.STABLE_DIFFUSION_API_KEY,
  removeBgApiKey: process.env.REMOVE_BG_API_KEY,
}));
