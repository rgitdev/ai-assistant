import { AssistantService } from "@backend/services/assistant/AssistantService";
import { ConversationMessage } from "@backend/client/openai/OpenAIService";
import { getBaseAssistantSystemPrompt } from "backend/assistant/prompts/systemPrompt";

const assistantService = new AssistantService();

const messages: ConversationMessage[] = [
  {
    role: "user",
    content: "Hello, how are you?",
  },
];

// AssistantService now only handles OpenAI communication
// Memory orchestration is handled by the Assistant class
const response = await assistantService.sendConversation(
  getBaseAssistantSystemPrompt(),
  messages
);
console.log(response);