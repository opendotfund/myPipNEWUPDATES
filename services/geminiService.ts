import { GeminiResponse } from "../types";

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyB3D9sUIrwAK4ItMti3ROr--h_Qr-GblBQ'; // User-provided Gemini API key
const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent';

let currentApiKey: string | null = GEMINI_API_KEY;

const initializeGeminiClient = () => {
  console.log("Initializing Gemini client...");
  console.log("API Key available:", !!currentApiKey);
  console.log("API Key length:", currentApiKey?.length || 0);
  
  if (currentApiKey && currentApiKey.trim() !== "") {
    const keySnippet = currentApiKey.length > 4 ? `...${currentApiKey.slice(-4)}` : '(key too short to snip)';
    console.log(`✅ Gemini AI client initialized successfully with key ending: ${keySnippet}`);
  } else {
    console.warn("⚠️ API Key is not set or is empty. Gemini client not initialized.");
  }
};

// Initialize the Gemini client with the API key
console.log("Starting Gemini service initialization...");
initializeGeminiClient();

if (!currentApiKey) { 
  console.warn("⚠️ No API Key was available. Gemini services will not function.");
} else {
  console.log("✅ Gemini service initialization completed successfully");
}

export const setExternalApiKey = async (newApiKey: string): Promise<boolean> => {
  if (!newApiKey || typeof newApiKey !== 'string' || !newApiKey.trim()) {
    console.error("Attempted to set an empty or invalid API key. Reverting to initial env key if available, or null.");
    currentApiKey = GEMINI_API_KEY || null;
    initializeGeminiClient();
    return false;
  }
  
  const trimmedNewApiKey = newApiKey.trim();
  const keySnippet = trimmedNewApiKey.length > 4 ? `...${trimmedNewApiKey.slice(-4)}` : '(key too short to snip)';
  console.log(`Attempting to set and use new API key ending: ${keySnippet}`);
  
  currentApiKey = trimmedNewApiKey;
  initializeGeminiClient();
  
  console.log(`Successfully applied new API key. Gemini client is now active with the new key.`);
  return true;
};

// Test function to verify Gemini API connectivity
export const testGeminiApiConnection = async (): Promise<boolean> => {
  if (!currentApiKey) {
    console.error("No Gemini API key available for testing");
    return false;
  }

  try {
    console.log("Testing Gemini API connection...");
    console.log("API Key available:", !!currentApiKey);
    console.log("API Key length:", currentApiKey.length);
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for test

    const response = await fetch(`${GEMINI_API_URL}?key=${currentApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello, this is a test message. Please respond with 'API is working'."
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50,
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API test failed:', response.status, errorText);
      
      if (response.status === 400) {
        console.error('❌ Invalid request format');
        return false;
      } else if (response.status === 401) {
        console.error('❌ Invalid API key');
        return false;
      } else if (response.status === 429) {
        console.error('❌ Rate limit exceeded');
        return false;
      } else if (response.status >= 500) {
        console.error('❌ Server error');
        return false;
      }
      
      return false;
    }

    const data = await response.json();
    console.log("✅ Gemini API test successful:", data);
    return true;
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Gemini API test timed out');
    } else if (error instanceof Error && error.message.includes('fetch')) {
      console.error('❌ Network error - check your internet connection');
    }
    
    return false;
  }
};

const parseGeminiJsonResponse = (responseText: string): GeminiResponse => {
  let jsonStr = responseText.trim();
    
  // First, try to extract JSON from code fences
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  // If no code fences, try to find JSON object boundaries
  if (!jsonStr.startsWith('{')) {
    const jsonStart = jsonStr.indexOf('{');
    if (jsonStart !== -1) {
      jsonStr = jsonStr.substring(jsonStart);
    }
  }

  // Find the end of the JSON object
  let braceCount = 0;
  let jsonEnd = -1;
  for (let i = 0; i < jsonStr.length; i++) {
    if (jsonStr[i] === '{') braceCount++;
    if (jsonStr[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        jsonEnd = i + 1;
        break;
      }
    }
  }
  
  if (jsonEnd > 0) {
    jsonStr = jsonStr.substring(0, jsonEnd);
  }

  // Clean up common escape sequence issues
  jsonStr = jsonStr.replace(/\\\\n/g, "\\n")  // Fix double-escaped newlines
                   .replace(/\\\\"/g, '\\"')  // Fix double-escaped quotes
                   .replace(/\\n/g, "\\n")
                   .replace(/\\'/g, "\\'")
                   .replace(/\\"/g, '\\"')
                   .replace(/\\&/g, "\\&")
                   .replace(/\\r/g, "\\r")
                   .replace(/\\t/g, "\\t")
                   .replace(/\\b/g, "\\b")
                   .replace(/\\f/g, "\\f");
  
  try {
    const parsedData = JSON.parse(jsonStr) as GeminiResponse;
    if (!parsedData.swiftCode || !parsedData.previewHtml) {
      console.error("Parsed data missing swiftCode or previewHtml", parsedData);
      throw new Error("Invalid response structure from AI. Missing swiftCode or previewHtml.");
    }
    if (parsedData.previewHtml.trim() === "") {
        parsedData.previewHtml = '<div class="p-4 text-center text-neutral-500">AI returned an empty preview. Try adjusting your prompt.</div>';
    }
    if (parsedData.swiftCode.trim() === "") {
        parsedData.swiftCode = "// AI returned empty code. Try adjusting your prompt.";
    }
    return parsedData;
  } catch(e) {
    console.error("Direct JSON parse failed, attempting cleanup...");
    
    // Second attempt: clean up common JSON issues
    try {
      // Fix common escape sequence issues
      let cleanedJson = jsonStr
        // Fix newlines in strings
        .replace(/(?<!\\)"/g, '"') // Replace unescaped quotes
        .replace(/\\n/g, '\\n') // Ensure newlines are properly escaped
        .replace(/\\"/g, '\\"') // Ensure quotes are properly escaped
        .replace(/\\\\/g, '\\\\') // Ensure backslashes are properly escaped
        // Remove any trailing commas
        .replace(/,(\s*[}\]])/g, '$1');
      
      const parsedData = JSON.parse(cleanedJson) as GeminiResponse;
      if (!parsedData.swiftCode || !parsedData.previewHtml) {
        throw new Error("Invalid response structure from AI. Missing swiftCode or previewHtml.");
      }
      if (parsedData.previewHtml.trim() === "") {
          parsedData.previewHtml = '<div class="p-4 text-center text-neutral-500">AI returned an empty preview. Try adjusting your prompt.</div>';
      }
      if (parsedData.swiftCode.trim() === "") {
          parsedData.swiftCode = "// AI returned empty code. Try adjusting your prompt.";
      }
      return parsedData;
    } catch(cleanupError) {
      console.error("JSON cleanup also failed, attempting manual extraction...");
      
      // Third attempt: manual extraction using regex
      try {
        // Extract swiftCode and previewHtml using more robust regex
        const swiftCodeMatch = jsonStr.match(/"swiftCode"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const previewHtmlMatch = jsonStr.match(/"previewHtml"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        
        if (swiftCodeMatch && previewHtmlMatch) {
          let swiftCode = swiftCodeMatch[1]
            .replace(/\\\\n/g, '\n')  // Fix double-escaped newlines
            .replace(/\\\\"/g, '"')   // Fix double-escaped quotes
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          
          let previewHtml = previewHtmlMatch[1]
            .replace(/\\\\n/g, '\n')  // Fix double-escaped newlines
            .replace(/\\\\"/g, '"')   // Fix double-escaped quotes
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          
          console.log("Manual extraction successful");
          return {
            swiftCode: swiftCode || "// Manual extraction: Could not extract SwiftUI code",
            previewHtml: previewHtml || '<div class="p-4 text-center text-neutral-500">Manual extraction: Could not extract HTML preview</div>'
          };
        }
      } catch (extractionError) {
        console.error("Manual extraction also failed:", extractionError);
      }
      
      // Final fallback: create a basic response
      console.log("Using final fallback response");
      
      // Try to extract any partial content from the malformed JSON
      let partialSwiftCode = "";
      let partialHtml = "";
      
      // Look for any SwiftUI code patterns
      const swiftMatches = jsonStr.match(/import SwiftUI[\s\S]*?struct[\s\S]*?View[\s\S]*?}/);
      if (swiftMatches) {
        partialSwiftCode = swiftMatches[0]
          .replace(/\\\\n/g, '\n')  // Fix double-escaped newlines
          .replace(/\\\\"/g, '"')   // Fix double-escaped quotes
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"');
      }
      
      // Look for any HTML patterns
      const htmlMatches = jsonStr.match(/<div[\s\S]*?<\/div>/);
      if (htmlMatches) {
        partialHtml = htmlMatches[0]
          .replace(/\\\\n/g, '\n')  // Fix double-escaped newlines
          .replace(/\\\\"/g, '"')   // Fix double-escaped quotes
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"');
      }
      
      return {
        swiftCode: partialSwiftCode || `// Error parsing AI response. Raw response was too malformed to parse.
// Please try regenerating your app with a different prompt.

import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Text("Error: Could not parse AI response")
                .foregroundColor(.red)
            Text("Please try again with a different prompt")
                .font(.caption)
        }
    }
}`,
        previewHtml: partialHtml || `<div class="p-4 text-center">
    <p class="text-red-600 font-semibold">Error: Could not parse AI response</p>
    <p class="text-sm text-gray-600 mt-2">Please try again with a different prompt</p>
</div>`
      };
    }
  }
};

const constructInitialGeminiPrompt = (userPrompt: string): string => {
  return `Create an iOS app for: "${userPrompt}"

Return ONLY valid JSON with these exact fields:
{
  "swiftCode": "your SwiftUI code here",
  "previewHtml": "your HTML preview here"
}

Requirements:
- SwiftUI code must be complete and runnable
- HTML preview must use Tailwind CSS
- Add data-action-id and data-action-description to interactive elements
- Escape all quotes and newlines properly (\\", \\n)
- No markdown formatting, only pure JSON`;
};

const constructRefinementGeminiPrompt = (currentSwiftCode: string, currentHtmlPreview: string, refinementRequest: string): string => {
  return `Refine this iOS app based on: "${refinementRequest}"

Current code:
SwiftUI: ${currentSwiftCode.substring(0, 500)}...
HTML: ${currentHtmlPreview.substring(0, 500)}...

Return ONLY valid JSON with these exact fields:
{
  "swiftCode": "updated SwiftUI code here",
  "previewHtml": "updated HTML preview here"
}

Requirements:
- Update both SwiftUI and HTML to match the refinement request
- Keep all existing functionality
- Escape all quotes and newlines properly (\\", \\n)
- No markdown formatting, only pure JSON`;
};

const constructInteractionGeminiPrompt = (currentSwiftCode: string, currentHtmlPreview: string, actionId: string, actionDescription: string): string => {
  return `Handle user interaction: "${actionId}" - "${actionDescription}"

Current code:
SwiftUI: ${currentSwiftCode.substring(0, 500)}...
HTML: ${currentHtmlPreview.substring(0, 500)}...

Return ONLY valid JSON with these exact fields:
{
  "swiftCode": "updated SwiftUI code here",
  "previewHtml": "updated HTML preview here"
}

Requirements:
- Update code to handle the user interaction
- Show appropriate visual feedback
- Escape all quotes and newlines properly (\\", \\n)
- No markdown formatting, only pure JSON`;
};

const callGeminiApi = async (prompt: string): Promise<GeminiResponse> => {
  if (!currentApiKey) {
    throw new Error("Gemini API key is not configured. Please set up your API key.");
  }

  // Retry mechanism with exponential backoff
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Gemini API attempt ${attempt + 1}/${maxRetries}`);
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(`${GEMINI_API_URL}?key=${currentApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 16384, // Increased token limit
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        
        // Handle specific error codes
        if (response.status === 400) {
          throw new Error('Invalid request to Gemini API. Please check your prompt.');
        } else if (response.status === 401) {
          throw new Error('Invalid Gemini API key. Please check your API key.');
        } else if (response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error('Gemini API server error. Please try again.');
        } else {
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('Unexpected Gemini API response structure:', data);
        throw new Error('Unexpected response structure from Gemini API');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      console.log('Raw Gemini response:', responseText);
      
      return parseGeminiJsonResponse(responseText);
      
    } catch (error) {
      console.error(`Gemini API attempt ${attempt + 1} failed:`, error);
      
      // Handle timeout specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request timed out, retrying...');
        if (attempt === maxRetries - 1) {
          throw new Error('Request timed out after multiple attempts. Please try again.');
        }
      } else if (error instanceof Error && error.message.includes('rate limit')) {
        // Don't retry rate limit errors
        throw error;
      } else if (error instanceof Error && error.message.includes('Invalid Gemini API key')) {
        // Don't retry invalid key errors
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('All Gemini API attempts failed');
};

export const generateAppCodeAndPreview = async (userPrompt: string): Promise<GeminiResponse> => {
  const prompt = constructInitialGeminiPrompt(userPrompt);
  return await callGeminiApi(prompt);
};

export const refineAppCodeAndPreview = async (currentSwiftCode: string, currentHtmlPreview: string, refinementRequest: string): Promise<GeminiResponse> => {
  const prompt = constructRefinementGeminiPrompt(currentSwiftCode, currentHtmlPreview, refinementRequest);
  return await callGeminiApi(prompt);
};

export const handleInteractionAndUpdateCodeAndPreview = async (currentSwiftCode: string, currentHtmlPreview: string, actionId: string, actionDescription: string): Promise<GeminiResponse> => {
  const prompt = constructInteractionGeminiPrompt(currentSwiftCode, currentHtmlPreview, actionId, actionDescription);
  return await callGeminiApi(prompt);
}; 