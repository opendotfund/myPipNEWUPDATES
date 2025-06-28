import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY, CLAUDE_MODEL_NAME } from '../constants';
import { ClaudeResponse } from "../types";

// Use the Claude API key
let currentApiKey: string | null = CLAUDE_API_KEY;
let anthropic: Anthropic | null = null;

const initializeClaudeClient = () => {
  console.log("Initializing Claude client...");
  console.log("API Key available:", !!currentApiKey);
  console.log("API Key length:", currentApiKey?.length || 0);
  
  if (currentApiKey && currentApiKey.trim() !== "") {
    try {
      console.log("Creating Anthropic client...");
      anthropic = new Anthropic({ 
        apiKey: currentApiKey,
        // Add timeout and other options for better reliability
        maxRetries: 3,
        timeout: 60000,
        dangerouslyAllowBrowser: true // Allow browser usage
      });
      
      // Log only the last 4 characters of the key for security reasons in console.
      const keySnippet = currentApiKey.length > 4 ? `...${currentApiKey.slice(-4)}` : '(key too short to snip)';
      console.log(`✅ Claude AI client initialized successfully with key ending: ${keySnippet}`);
      console.log("Anthropic client created:", !!anthropic);
    } catch (error) {
      console.error("❌ Failed to initialize Claude client with the current key:", error);
      anthropic = null; // Ensure anthropic is null if initialization fails
    }
  } else {
    anthropic = null; // Ensure anthropic is null if no valid key
    console.warn("⚠️ API Key is not set or is empty. Claude client not initialized.");
  }
};

// Initialize the Claude client with the API key
console.log("Starting Claude service initialization...");
initializeClaudeClient();

if (!currentApiKey) { 
  console.warn("⚠️ No API Key was available. Claude services will not function.");
} else if (currentApiKey && !anthropic) { // currentApiKey was present but client failed to initialize
  console.error("❌ CRITICAL: An API Key was provided, but the Claude client failed to initialize. Please check the key and console for errors from Anthropic constructor.");
} else {
  console.log("✅ Claude service initialization completed successfully");
}

export const setExternalApiKey = async (newApiKey: string): Promise<boolean> => {
  if (!newApiKey || typeof newApiKey !== 'string' || !newApiKey.trim()) {
    console.error("Attempted to set an empty or invalid API key. Reverting to initial env key if available, or null.");
    currentApiKey = CLAUDE_API_KEY || null; // Revert to initial state
    initializeClaudeClient(); // Re-initialize with the reverted key
    return false;
  }
  
  const trimmedNewApiKey = newApiKey.trim();
  const keySnippet = trimmedNewApiKey.length > 4 ? `...${trimmedNewApiKey.slice(-4)}` : '(key too short to snip)';
  console.log(`Attempting to set and use new API key ending: ${keySnippet}`);
  
  currentApiKey = trimmedNewApiKey; // Update currentApiKey to the new one
  initializeClaudeClient(); // Re-initialize the 'anthropic' client with the new 'currentApiKey'
  
  if (anthropic !== null) {
    console.log(`Successfully applied new API key. Claude client is now active with the new key.`);
    return true;
  } else {
    console.error(`Failed to activate Claude client with the newly provided API key (ending: ${keySnippet}). The key might be invalid or malformed.`);
    return false;
  }
};

const parseClaudeJsonResponse = (responseText: string): ClaudeResponse => {
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
    const parsedData = JSON.parse(jsonStr) as ClaudeResponse;
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

const constructInitialClaudePrompt = (userPrompt: string): string => {
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
   \`<input type="text" placeholder="Enter item name" class="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" data-action-id="inputChange" data-action-description="User typing in text field">\`

**CRITICAL REQUIREMENTS**:
- The app MUST be fully functional and interactive
- Include realistic data and content that users would expect
- Add proper form validation and error handling
- Show loading states and success/error feedback
- Make the app feel like a real, working application
- Include multiple screens or views if appropriate
- Add animations and visual feedback for interactions
- Ensure all buttons and inputs have meaningful functionality
- Make sure the HTML preview accurately represents the SwiftUI functionality

**RESPONSE FORMAT**: You must respond with ONLY a valid JSON object in this exact format:
{
  "swiftCode": "// Complete SwiftUI code here",
  "previewHtml": "<!-- Complete HTML preview here -->"
}

Do not include any other text, explanations, or formatting outside of the JSON object.`;
};

const constructRefinementClaudePrompt = (currentSwiftCode: string, currentHtmlPreview: string, refinementRequest: string): string => {
  return `You are an expert iOS app developer and UI designer. The user wants to refine their existing iOS app.

**CURRENT SWIFTUI CODE:**
\`\`\`swift
${currentSwiftCode}
\`\`\`

**CURRENT HTML PREVIEW:**
\`\`\`html
${currentHtmlPreview}
\`\`\`

**USER'S REFINEMENT REQUEST:**
"${refinementRequest}"

Based on the user's request, update both the SwiftUI code and HTML preview to implement the requested changes while maintaining all existing functionality and interactivity.

**REQUIREMENTS**:
1. **SwiftUI Code**: Update the existing SwiftUI code to implement the requested changes
2. **HTML Preview**: Update the HTML preview to match the new SwiftUI functionality
3. **Maintain Interactivity**: Keep all existing interactive elements and add new ones as needed
4. **Data Attributes**: Ensure all interactive elements have proper data-action-id and data-action-description attributes
5. **Realistic Functionality**: Make sure the app remains functional and realistic

**RESPONSE FORMAT**: You must respond with ONLY a valid JSON object in this exact format:
{
  "swiftCode": "// Updated SwiftUI code here",
  "previewHtml": "<!-- Updated HTML preview here -->"
}

Do not include any other text, explanations, or formatting outside of the JSON object.`;
};

const constructInteractionClaudePrompt = (currentSwiftCode: string, currentHtmlPreview: string, actionId: string, actionDescription: string): string => {
  return `You are an expert iOS app developer and UI designer. A user has interacted with the app preview, and you need to update both the SwiftUI code and HTML preview to reflect this interaction.

**CURRENT SWIFTUI CODE:**
\`\`\`swift
${currentSwiftCode}
\`\`\`

**CURRENT HTML PREVIEW:**
\`\`\`html
${currentHtmlPreview}
\`\`\`

**USER INTERACTION:**
- Action ID: "${actionId}"
- Action Description: "${actionDescription}"

Based on this user interaction, update both the SwiftUI code and HTML preview to implement the appropriate response to this interaction. For example:
- If the user clicked "addItem", add a new item to the list
- If the user clicked "submitForm", process the form data
- If the user clicked "toggleFeature", toggle the feature state
- If the user clicked "deleteItem", remove the item from the list

**REQUIREMENTS**:
1. **SwiftUI Code**: Update the SwiftUI code to handle this interaction properly
2. **HTML Preview**: Update the HTML preview to show the result of this interaction
3. **State Management**: Update any relevant state variables
4. **Visual Feedback**: Show appropriate visual feedback for the interaction
5. **Maintain Interactivity**: Keep all existing interactive elements functional

**RESPONSE FORMAT**: You must respond with ONLY a valid JSON object in this exact format:
{
  "swiftCode": "// Updated SwiftUI code here",
  "previewHtml": "<!-- Updated HTML preview here -->"
}

Do not include any other text, explanations, or formatting outside of the JSON object.`;
};

const callClaudeApi = async (prompt: string): Promise<ClaudeResponse> => {
  console.log("🔍 callClaudeApi called");
  console.log("Anthropic client available:", !!anthropic);
  
  if (!anthropic) {
    console.error("❌ Claude client is not initialized. Attempting to re-initialize...");
    initializeClaudeClient();
    
    if (!anthropic) {
      console.error("❌ Re-initialization failed. Claude client still not available.");
    throw new Error("Claude client is not initialized. Please check your API key.");
    }
  }

  try {
    console.log("📡 Calling Claude API...");
    console.log("Model:", CLAUDE_MODEL_NAME);
    console.log("Prompt length:", prompt.length);
    
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_NAME,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    console.log("✅ Claude API response received");
    console.log("Response content length:", response.content?.length || 0);
    
    if (!response.content || response.content.length === 0) {
      throw new Error("Empty response from Claude API");
    }

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    if (!responseText) {
      throw new Error("No text content in Claude API response");
    }

    console.log("📝 Parsing Claude response...");
    console.log("Response text length:", responseText.length);
    console.log("Response preview:", responseText.substring(0, 200) + "...");
    
    return parseClaudeJsonResponse(responseText);
    
  } catch (error) {
    console.error("❌ Error calling Claude API:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error("Invalid API key. Please check your Claude API key.");
      } else if (error.message.includes('429') || error.message.includes('Rate limit')) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      } else if (error.message.includes('500') || error.message.includes('Internal server error')) {
        throw new Error("Claude API server error. Please try again.");
      } else if (error.message.includes('timeout')) {
        throw new Error("Request timed out. Please try again.");
      }
    }
    
    throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateAppCodeAndPreview = async (userPrompt: string): Promise<ClaudeResponse> => {
  const prompt = constructInitialClaudePrompt(userPrompt);
  return await callClaudeApi(prompt);
};

export const refineAppCodeAndPreview = async (currentSwiftCode: string, currentHtmlPreview: string, refinementRequest: string): Promise<ClaudeResponse> => {
  const prompt = constructRefinementClaudePrompt(currentSwiftCode, currentHtmlPreview, refinementRequest);
  return await callClaudeApi(prompt);
};

export const handleInteractionAndUpdateCodeAndPreview = async (currentSwiftCode: string, currentHtmlPreview: string, actionId: string, actionDescription: string): Promise<ClaudeResponse> => {
  const prompt = constructInteractionClaudePrompt(currentSwiftCode, currentHtmlPreview, actionId, actionDescription);
  return await callClaudeApi(prompt);
};
