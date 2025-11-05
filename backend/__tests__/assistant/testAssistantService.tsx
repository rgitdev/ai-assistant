import { AssistantService, SendConversationRequest } from "@backend/services/assistant/AssistantService";
import { ConversationMessage } from "@backend/client/openai/OpenAIService";
import { getBaseAssistantSystemPrompt, getMemoryInstructionPrompt } from "backend/assistant/prompts/systemPrompt";

const assistantService = new AssistantService();

const messages: ConversationMessage[] = [
  {
    role: "user",
    content: "Hello, how are you? what we discussed last time? what you remember?",
  },
];

const request = new SendConversationRequest(
  getBaseAssistantSystemPrompt(),
  getMemoryInstructionPrompt(),
  messages
);

const response = await assistantService.sendConversationWithMemory(request);
console.log(response);