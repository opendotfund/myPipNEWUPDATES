import { GeminiResponse } from "../types";

// Gemini API configuration
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // This should be set in environment variables
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

  // Clean up common escape sequences
  jsonStr = jsonStr.replace(/\\n/g, "\\n")
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
    console.error("Failed to parse JSON string:", jsonStr, e);
    
    // Try to provide more helpful error information
    const errorMessage = e instanceof Error ? e.message : 'Unknown parsing error';
    const jsonPreview = jsonStr.length > 500 ? jsonStr.substring(0, 500) + '...' : jsonStr;
    
    // Fallback: try to extract SwiftUI code and HTML manually
    console.log("Attempting fallback extraction...");
    try {
      const swiftMatch = jsonStr.match(/"swiftCode"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
      const htmlMatch = jsonStr.match(/"previewHtml"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
      
      if (swiftMatch && htmlMatch) {
        const swiftCode = swiftMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        const previewHtml = htmlMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        
        console.log("Fallback extraction successful");
        return {
          swiftCode: swiftCode || "// Fallback: Could not extract SwiftUI code",
          previewHtml: previewHtml || '<div class="p-4 text-center text-neutral-500">Fallback: Could not extract HTML preview</div>'
        };
      }
    } catch (fallbackError) {
      console.error("Fallback extraction also failed:", fallbackError);
    }
    
    throw new Error(`Failed to parse AI's JSON response. Error: ${errorMessage}. Raw preview: ${jsonPreview}`);
  }
};

const constructInitialGeminiPrompt = (userPrompt: string): string => {
  return `You are an expert iOS app developer and UI designer. The user wants to build an interactive iOS app that users can actually interact with in a preview.

Based on the following user prompt:
"${userPrompt}"

Generate the following:
1. **SwiftUI Code**: Complete, functional SwiftUI code for a single-screen iOS application that implements the user's request with FULL INTERACTIVITY. The code must include:
   - Working buttons that perform actual actions
   - Text inputs that users can type in
   - State management (@State variables)
   - Logic that responds to user interactions
   - Navigation or view transitions
   - Data persistence or temporary storage
   - Form validation where appropriate
   - Animations and visual feedback
   - Error handling for user inputs
   
   The SwiftUI code should be a complete, runnable app that users can interact with. Include realistic functionality that makes sense for the app type.

2. **HTML Preview**: A highly interactive HTML snippet using Tailwind CSS that accurately represents the SwiftUI app and allows users to interact with it in the preview. This HTML should:
   - Include working form inputs (text fields, textareas, selects)
   - Have functional buttons that trigger actions
   - Show state changes when users interact
   - Include realistic data and content
   - Use proper form validation
   - Show loading states and feedback
   - Include multiple interactive elements (at least 3-5)
   
   **CRITICAL**: For EVERY interactive element in the HTML preview, you MUST add these exact data attributes:
   - \`data-action-id="UNIQUE_ACTION_IDENTIFIER"\`: A unique identifier for the action
   - \`data-action-description="User-friendly description of the action"\`: What the button/input does
   
   **REQUIRED Interactive Elements** (include at least 3-5 of these):
   - Submit buttons: \`data-action-id="submitForm" data-action-description="Submit form data"\`
   - Add buttons: \`data-action-id="addItem" data-action-description="Add new item to list"\`
   - Delete buttons: \`data-action-id="deleteItem" data-action-description="Remove item from list"\`
   - Edit buttons: \`data-action-id="editItem" data-action-description="Edit selected item"\`
   - Save buttons: \`data-action-id="saveData" data-action-description="Save current data"\`
   - Cancel buttons: \`data-action-id="cancelAction" data-action-description="Cancel current action"\`
   - Toggle buttons: \`data-action-id="toggleFeature" data-action-description="Toggle feature on/off"\`
   - View buttons: \`data-action-id="viewDetails" data-action-description="View item details"\`
   - Search buttons: \`data-action-id="searchItems" data-action-description="Search for items"\`
   - Filter buttons: \`data-action-id="filterResults" data-action-description="Filter results"\`
   - Checkbox/Complete: \`data-action-id="markComplete" data-action-description="Mark item as complete"\`
   - Uncheck/Incomplete: \`data-action-id="markIncomplete" data-action-description="Mark item as incomplete"\`
   - Toggle items: \`data-action-id="toggleItem" data-action-description="Toggle item state"\`
   
   **IMPORTANT**: Make all interactive elements clearly clickable with these Tailwind classes: \`cursor-pointer hover:opacity-80 transition-opacity active:scale-95\`
   
   **Example Interactive Button**: 
   \`<button data-action-id="addItem" data-action-description="Add new item to list" class="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity active:scale-95">Add Item</button>\`
   
   **Example Interactive Input**:
   \`<input type="text" data-action-id="searchItems" data-action-description="Search for items" class="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search...">\`

**CRITICAL REQUIREMENTS:**
- Return ONLY a valid JSON object with exactly these two fields: "swiftCode" and "previewHtml"
- The JSON must be properly escaped and valid
- Do not include any markdown formatting, code fences, or additional text
- The response must be parseable by JSON.parse()
- Both swiftCode and previewHtml must contain meaningful, functional content

**Example Response Format:**
\`\`\`json
{
  "swiftCode": "import SwiftUI\\n\\nstruct ContentView: View {\\n    @State private var text = \\"\\"\\n    \\n    var body: some View {\\n        VStack {\\n            TextField(\\"Enter text\\", text: $text)\\n                .textFieldStyle(RoundedBorderTextFieldStyle())\\n                .padding()\\n            \\n            Button(\\"Submit\\") {\\n                // Action here\\n            }\\n            .padding()\\n        }\\n    }\\n}",
  "previewHtml": "<div class=\\"p-4\\"><input type=\\"text\\" data-action-id=\\"submitForm\\" data-action-description=\\"Submit form data\\" class=\\"border border-gray-300 rounded-lg px-3 py-2 w-full mb-4\\" placeholder=\\"Enter text\\"><button data-action-id=\\"submitForm\\" data-action-description=\\"Submit form data\\" class=\\"bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity active:scale-95\\">Submit</button></div>"
}
\`\`\`

Remember: Return ONLY the JSON object, no additional text or formatting.`;
};

const constructRefinementGeminiPrompt = (currentSwiftCode: string, currentHtmlPreview: string, refinementRequest: string): string => {
  return `You are an expert iOS app developer and UI designer. The user wants to refine their existing iOS app.

Current SwiftUI Code:
\`\`\`swift
${currentSwiftCode}
\`\`\`

Current HTML Preview:
\`\`\`html
${currentHtmlPreview}
\`\`\`

User's Refinement Request:
"${refinementRequest}"

Please update both the SwiftUI code and HTML preview to implement the requested changes while maintaining all existing functionality and interactivity.

**CRITICAL REQUIREMENTS:**
- Return ONLY a valid JSON object with exactly these two fields: "swiftCode" and "previewHtml"
- The JSON must be properly escaped and valid
- Do not include any markdown formatting, code fences, or additional text
- The response must be parseable by JSON.parse()
- Both swiftCode and previewHtml must contain meaningful, functional content
- Maintain all existing interactive elements and their data-action-id attributes

**Example Response Format:**
\`\`\`json
{
  "swiftCode": "updated SwiftUI code here",
  "previewHtml": "updated HTML preview here"
}
\`\`\`

Remember: Return ONLY the JSON object, no additional text or formatting.`;
};

const constructInteractionGeminiPrompt = (currentSwiftCode: string, currentHtmlPreview: string, actionId: string, actionDescription: string): string => {
  return `You are an expert iOS app developer and UI designer. A user has interacted with your app preview and you need to update the code to reflect their action.

Current SwiftUI Code:
\`\`\`swift
${currentSwiftCode}
\`\`\`

Current HTML Preview:
\`\`\`html
${currentHtmlPreview}
\`\`\`

User Action:
- Action ID: "${actionId}"
- Action Description: "${actionDescription}"

Please update both the SwiftUI code and HTML preview to implement the appropriate response to this user action. The action should:
- Update the app's state appropriately
- Show visual feedback to the user
- Maintain all existing functionality
- Add realistic data or content changes
- Provide meaningful interaction results

**CRITICAL REQUIREMENTS:**
- Return ONLY a valid JSON object with exactly these two fields: "swiftCode" and "previewHtml"
- The JSON must be properly escaped and valid
- Do not include any markdown formatting, code fences, or additional text
- The response must be parseable by JSON.parse()
- Both swiftCode and previewHtml must contain meaningful, functional content
- Maintain all existing interactive elements and their data-action-id attributes

**Example Response Format:**
\`\`\`json
{
  "swiftCode": "updated SwiftUI code here",
  "previewHtml": "updated HTML preview here"
}
\`\`\`

Remember: Return ONLY the JSON object, no additional text or formatting.`;
};

const callGeminiApi = async (prompt: string): Promise<GeminiResponse> => {
  if (!currentApiKey) {
    throw new Error("Gemini API key is not configured. Please set up your API key.");
  }

  try {
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
          maxOutputTokens: 8192,
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
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
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
    console.error('Error calling Gemini API:', error);
    throw error;
  }
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