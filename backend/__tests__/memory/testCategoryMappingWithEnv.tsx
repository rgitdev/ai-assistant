import { MemoryCreator } from "@backend/services/memory/MemoryCreator";
import { ChatMessage } from "@backend/models/ChatMessage";
import { CreateConversationMemoryCommand } from "@backend/services/memory/commands/CreateConversationMemoryCommand";
import { CreateUserProfileMemoryCommand } from "@backend/services/memory/commands/CreateUserProfileMemoryCommand";
import { CreateAssistantPersonaMemoryCommand } from "@backend/services/memory/commands/CreateAssistantPersonaMemoryCommand";
import { AssistantService } from "@backend/services/assistant/AssistantService";

// Set environment variable for test file
process.env.MEMORY_TEST_FILE = "backend/data/test-memories.json";

// Test category mapping directly
const assistantService = new AssistantService();
const memoryCreator = new MemoryCreator();

console.log("=== Category Mapping Test with Test File ===");
console.log("Using test file:", process.env.MEMORY_TEST_FILE);

// Test the mapping function directly (we'll need to make it public or test through reflection)
// For now, let's create memories and check their categories

const testMessages: ChatMessage[] = [
  {
    "id": "test-1",
    "content": "Test message for user profile",
    "role": "user",
    "timestamp": "2025-01-01T10:00:00.000Z"
  }
];

console.log("Creating user profile memory...");
const userProfileCommand = CreateUserProfileMemoryCommand("test-mapping-env-1", testMessages);
const userProfilePrep = await memoryCreator.prepareMemoryCreation(userProfileCommand);
if (userProfilePrep) {
  const userProfileJson = await assistantService.createMemory(userProfilePrep.systemPrompt, userProfilePrep.messages);
  const userProfileMemory = await memoryCreator.storeMemory(userProfilePrep, userProfileJson);
  console.log("User profile memory category:", userProfileMemory.category);
}

console.log("Creating assistant persona memory...");
const assistantPersonaCommand = CreateAssistantPersonaMemoryCommand("test-mapping-env-1", testMessages);
const assistantPersonaPrep = await memoryCreator.prepareMemoryCreation(assistantPersonaCommand);
if (assistantPersonaPrep) {
  const assistantPersonaJson = await assistantService.createMemory(assistantPersonaPrep.systemPrompt, assistantPersonaPrep.messages);
  const assistantPersonaMemory = await memoryCreator.storeMemory(assistantPersonaPrep, assistantPersonaJson);
  console.log("Assistant persona memory category:", assistantPersonaMemory.category);
}

console.log("Creating conversation memory...");
const conversationCommand = CreateConversationMemoryCommand("test-mapping-env-1", testMessages);
const conversationPrep = await memoryCreator.prepareMemoryCreation(conversationCommand);
if (conversationPrep) {
  const conversationJson = await assistantService.createMemory(conversationPrep.systemPrompt, conversationPrep.messages);
  const conversationMemory = await memoryCreator.storeMemory(conversationPrep, conversationJson);
  console.log("Conversation memory category:", conversationMemory.category);
}

console.log("=== Category Mapping Test Complete ===");
