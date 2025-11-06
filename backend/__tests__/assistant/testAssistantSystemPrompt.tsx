import { AssistantPromptBuilder } from "backend/assistant/AssistantPromptBuilder";

console.log("Testing Assistant System Prompt:");
const promptBuilder = new AssistantPromptBuilder();
console.log(promptBuilder.buildSystemPrompt());  