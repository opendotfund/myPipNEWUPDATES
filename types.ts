import React from 'react';

export enum ModelId {
  CLAUDE = 'claude-3-5-sonnet-20241022',
  GEMINI_FLASH = 'gemini-2.5-flash-preview-04-17',
  CHATGPT = 'chatgpt',
}

export interface ModelOption {
  id: ModelId;
  name: string;
  available: boolean;
}

export interface ClaudeResponse {
  swiftCode: string;
  previewHtml: string;
}

// Legacy interface for backward compatibility
export interface GeminiResponse extends ClaudeResponse {}

// If this custom element were used in multiple places, a more central location
// or a different approach to ensuring global type visibility might be needed,
// potentially involving tsconfig.json adjustments.
// The declaration for 'stripe-buy-button' is now in stripe.d.ts.
