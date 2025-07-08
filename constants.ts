import { ModelId, ModelOption } from './types';

export const APP_TITLE = 'myPip';

export const API_KEY_ENV_VAR = 'CLAUDE_API_KEY'; // To make it clear where the API key comes from
export const MAX_FREE_PROMPTS = 3;
export const CONTACT_EMAIL = 'm3stastn@uwaterloo.ca';

// Claude API key
export const CLAUDE_API_KEY = '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';

// Early bird code that grants unlimited access
export const EARLY_BIRD_CODE = 'EARLYBIRD2024';

export const AI_MODELS: ModelOption[] = [
  { id: ModelId.GEMINI_FLASH, name: 'Gemini 2.5 Flash', available: true },
  { id: ModelId.CLAUDE, name: 'Claude 3.5 Sonnet', available: true },
  { id: ModelId.CHATGPT, name: 'ChatGPT + Custom LangChain', available: false },
];

export const CLAUDE_MODEL_NAME = 'claude-3-5-sonnet-20241022';