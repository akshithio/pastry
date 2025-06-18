interface UserPreferences {
  userName?: string;
  userRole?: string;
  traits?: string[];
  additionalInfo?: string;
  disableComments?: boolean;
}

export const DEFAULT_SYSTEM_PROMPT = `You are Pastry, a helpful AI assistant. You are knowledgeable, friendly, and aim to provide accurate and useful information while being conversational and engaging.`;

export function generatePersonalizedSystemPrompt(
  preferences?: UserPreferences,
  basePrompt: string = DEFAULT_SYSTEM_PROMPT,
): string {
  if (!preferences) {
    return basePrompt;
  }

  let personalizedPrompt = basePrompt;

  if (preferences.userName) {
    personalizedPrompt += `\n\nThe user's name is ${preferences.userName}. You can address them by their first name if available when appropriate. This should not be overdone in any manner.`;
  }

  if (preferences.userRole) {
    personalizedPrompt += `\n\nThe user works as: ${preferences.userRole}. Keep this context in mind when providing relevant advice or examples.`;
  }

  if (preferences.traits && preferences.traits.length > 0) {
    const traitsText = preferences.traits.join(", ");
    personalizedPrompt += `\n\nPlease embody these personality traits in your responses: ${traitsText}. Let these traits guide your communication style and approach.`;
  }

  if (preferences.additionalInfo) {
    personalizedPrompt += `\n\nAdditional context about the user: ${preferences.additionalInfo}`;
  }

  if (preferences.disableComments) {
    console.log("hello");
    personalizedPrompt += `\n\nIMPORTANT: When providing code examples or solutions, do not include any comments in the code. Provide clean, comment-free code only. You can explain the code separately if needed, but the actual code blocks should contain no comments whatsoever.`;
  } else {
    console.log("test");
  }

  return personalizedPrompt;
}
