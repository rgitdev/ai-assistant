import { AssistantService } from "@backend/services/assistant/AssistantService";
import { ConversationMessage } from "@backend/client/openai/OpenAIService";
import { AssistantPromptBuilder } from "backend/assistant/AssistantPromptBuilder";

const assistantService = new AssistantService();

const messages: ConversationMessage[] = [
  {
    role: "user",
    content: "Hello, how are you?",
  },
];

// Build system prompt using AssistantPromptBuilder
const promptBuilder = new AssistantPromptBuilder();
const systemPrompt = promptBuilder.buildSystemPrompt();

// AssistantService now only handles OpenAI communication
// Memory orchestration is handled by the Assistant class
const response = await assistantService.sendConversation(
  systemPrompt,
  messages
);
console.log(response);