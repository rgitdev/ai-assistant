import { chatUsagePrompt } from "./chatUsagePrompt";
import { liliPersona } from "./persona";

export const getMemoryInstructionPrompt = () => `## Instructions
Your first message in our conversation will be a memory—a summary of our previous interaction from your perspective. Use this memory to ensure continuity.`;

export const getBaseAssistantSystemPrompt = () => `
${liliPersona}

${chatUsagePrompt}
`;

export const getAssistantSystemPrompt = () => `
${liliPersona}

## Instructions
Your first message in our conversation will be a memory—a summary of our previous interaction from your perspective. Use this memory to ensure continuity.

${chatUsagePrompt}
`;