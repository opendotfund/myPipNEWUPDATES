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
  console.log('Parsing Claude response:', responseText.substring(0, 200) + '...');
  
  // First, try to extract JSON from the response
  let jsonStr = responseText.trim();
  
  // Remove any markdown code blocks
  jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  
  // Try to find JSON object boundaries
  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
  }
  
  // Clean up common JSON issues
  jsonStr = jsonStr
    .replace(/\\n/g, '\\n')
    .replace(/\\r/g, '\\r')
    .replace(/\\t/g, '\\t')
    .replace(/\\"/g, '\\"')
    .replace(/\\\\/g, '\\\\')
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
    
    // Ensure the preview HTML has proper structure
    if (!parsedData.previewHtml.includes('<div') && !parsedData.previewHtml.includes('<html')) {
        parsedData.previewHtml = `<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div class="max-w-xs">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">App Preview</h3>
                <p class="text-sm text-gray-600">Your app preview will appear here</p>
            </div>
        </div>`;
    }
    if (parsedData.swiftCode.trim() === "") {
        parsedData.swiftCode = "// AI returned empty code. Try adjusting your prompt.";
    }
    return parsedData;
  } catch(e) {
    console.error("Failed to parse JSON string:", jsonStr.substring(0, 500) + '...', e);
    
    // Try multiple fallback extraction methods
    console.log("Attempting fallback extraction methods...");
    
    // Method 1: Try to extract using regex with better handling of escaped quotes
    try {
      const swiftMatch = jsonStr.match(/"swiftCode"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const htmlMatch = jsonStr.match(/"previewHtml"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      
      if (swiftMatch && htmlMatch) {
        const swiftCode = swiftMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\');
        const previewHtml = htmlMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\');
        
        console.log("Fallback extraction method 1 successful");
        return {
          swiftCode: swiftCode || "// Fallback: Could not extract SwiftUI code",
          previewHtml: previewHtml || '<div class="p-4 text-center text-neutral-500">Fallback: Could not extract HTML preview</div>'
        };
      }
    } catch (fallbackError) {
      console.error("Fallback extraction method 1 failed:", fallbackError);
    }
    
    // Method 2: Try to find code blocks in the response
    try {
      const swiftBlockMatch = responseText.match(/```swift\s*([\s\S]*?)\s*```/);
      const htmlBlockMatch = responseText.match(/```html\s*([\s\S]*?)\s*```/);
      
      if (swiftBlockMatch || htmlBlockMatch) {
        const swiftCode = swiftBlockMatch ? swiftBlockMatch[1].trim() : "// No Swift code found";
        const previewHtml = htmlBlockMatch ? htmlBlockMatch[1].trim() : '<div class="p-4 text-center text-neutral-500">No HTML preview found</div>';
        
        console.log("Fallback extraction method 2 successful");
        return {
          swiftCode: swiftCode,
          previewHtml: previewHtml
        };
      }
    } catch (fallbackError) {
      console.error("Fallback extraction method 2 failed:", fallbackError);
    }
    
    // Method 3: Try to extract from the original response text
    try {
      // Look for JSON-like structure in the original text
      const jsonLikeMatch = responseText.match(/\{[^{}]*"swiftCode"[^{}]*"previewHtml"[^{}]*\}/);
      if (jsonLikeMatch) {
        const partialJson = jsonLikeMatch[0];
        // Try to fix common issues
        const fixedJson = partialJson
          .replace(/([^\\])"/g, '$1\\"') // Escape unescaped quotes
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
        
        const parsed = JSON.parse(fixedJson);
        if (parsed.swiftCode || parsed.previewHtml) {
          console.log("Fallback extraction method 3 successful");
          return {
            swiftCode: parsed.swiftCode || "// Fallback: Could not extract SwiftUI code",
            previewHtml: parsed.previewHtml || '<div class="p-4 text-center text-neutral-500">Fallback: Could not extract HTML preview</div>'
          };
        }
      }
    } catch (fallbackError) {
      console.error("Fallback extraction method 3 failed:", fallbackError);
    }
    
    // Final fallback: return a basic structure
    console.log("Using final fallback - returning basic structure");
    return {
      swiftCode: "// Error: Could not parse AI response. Please try again.\n\nimport SwiftUI\n\nstruct ContentView: View {\n    var body: some View {\n        Text(\"Error loading app code\")\n    }\n}",
      previewHtml: '<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-red-50"><div class="max-w-xs"><h3 class="text-lg font-semibold text-red-800 mb-2">Error</h3><p class="text-sm text-red-600">Could not parse AI response. Please try again.</p></div></div>'
    };
  }
};

const constructInitialClaudePrompt = (userPrompt: string): string => {
  return `You are an expert iOS app developer and UI designer. The user wants to build an interactive iOS app that users can actually interact with in a preview.

Based on the following user prompt:
"${userPrompt}"

Generate the following:
1. **SwiftUI Code**: Complete, functional SwiftUI code for an iOS application that implements the user's request with FULL INTERACTIVITY. The code should include:
   - Multiple screens or views when appropriate (e.g., main screen, detail screen, settings, profile, etc.)
   - Navigation between screens using NavigationView, NavigationLink, or TabView
   - Working buttons that perform actual actions
   - Text inputs that users can type in
   - State management (@State variables)
   - Logic that responds to user interactions
   - Data persistence or temporary storage
   - Form validation where appropriate
   - Animations and visual feedback
   - Error handling for user inputs
   
   **MULTI-PAGE REQUIREMENTS**:
   - If the app concept naturally supports multiple screens, create 2-4 different screens
   - Common multi-page patterns: Home/List + Detail, Main + Settings, Dashboard + Profile, etc.
   - Use NavigationView with NavigationLink for screen transitions
   - Each screen should have distinct functionality and purpose
   - Include navigation buttons or tabs to move between screens
   
   The SwiftUI code should be a complete, runnable app that users can interact with. Include realistic functionality that makes sense for the app type.

2. **HTML Preview**: A highly interactive HTML snippet using Tailwind CSS that accurately represents the SwiftUI app and allows users to interact with it in the preview. This HTML should:
   - Include working form inputs (text fields, textareas, selects)
   - Have functional buttons that trigger actions
   - Show state changes when users interact
   - Include realistic data and content
   - Use proper form validation
   - Show loading states and feedback
   - Include multiple interactive elements (at least 3-5)
   - If the app has multiple screens, show navigation elements (tabs, buttons, etc.)
   
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
   - Navigation buttons: \`data-action-id="navigateTo" data-action-description="Navigate to different screen"\`
   
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
- **PREFER MULTI-PAGE APPS**: Create 2-4 screens when the app concept supports it
- Include navigation between screens (tabs, buttons, or navigation links)
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
  if (!anthropic) {
    console.error('Claude client not initialized. Attempting to re-initialize...');
    initializeClaudeClient();
    
    if (!anthropic) {
      throw new Error('Claude client not initialized. Please check your API key.');
    }
  }

  console.log('Calling Claude API with prompt length:', prompt.length);
  console.log('Prompt preview:', prompt.substring(0, 200) + '...');

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_NAME,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
    console.log('Claude API response received, length:', responseText.length);
    console.log('Response preview:', responseText.substring(0, 500) + '...');
    
    if (!responseText) {
      throw new Error('Empty response from Claude API');
    }

    // Check if response contains JSON
    if (!responseText.includes('{') || !responseText.includes('}')) {
      console.error('Response does not contain JSON structure:', responseText);
      throw new Error('Invalid response format from Claude API - no JSON found');
    }

    // Check for common JSON structure issues
    const hasSwiftCode = responseText.includes('"swiftCode"');
    const hasPreviewHtml = responseText.includes('"previewHtml"');
    
    if (!hasSwiftCode || !hasPreviewHtml) {
      console.error('Response missing required fields:', { hasSwiftCode, hasPreviewHtml });
      console.error('Response content:', responseText);
      throw new Error('Invalid response structure from Claude API - missing required fields');
    }

    const parsedResponse = parseClaudeJsonResponse(responseText);
    
    console.log('Successfully parsed Claude response:', {
      swiftCodeLength: parsedResponse.swiftCode.length,
      previewHtmlLength: parsedResponse.previewHtml.length
    });
    
    return parsedResponse;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Invalid Claude API key. Please check your API key in the settings.');
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message.includes('500')) {
        throw new Error('Claude API server error. Please try again in a moment.');
      }
    }
    
    throw error;
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
