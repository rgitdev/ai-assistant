import { AssistantService } from "@backend/services/assistant/AssistantService";
import { ConversationMessage } from "@backend/client/openai/OpenAIService";
import { getAssistantSystemPrompt } from "backend/assistant/prompts/systemPrompt";

const assistantService = new AssistantService();

const messages: ConversationMessage[] = [
  {
    role: "user",
    content: "Hello, how are you? what we discussed last time? what you remember?",
  },
];  

const response = await assistantService.sendConversation(getAssistantSystemPrompt(), messages);
console.log(response);