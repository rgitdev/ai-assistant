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
const memoryCreator = new MemoryCreator(assistantService);

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
const userProfileMemory = await memoryCreator.createMemory(userProfileCommand);
console.log("User profile memory category:", userProfileMemory.category);

console.log("Creating assistant persona memory...");
const assistantPersonaCommand = CreateAssistantPersonaMemoryCommand("test-mapping-env-1", testMessages);
const assistantPersonaMemory = await memoryCreator.createMemory(assistantPersonaCommand);
console.log("Assistant persona memory category:", assistantPersonaMemory.category);

console.log("Creating conversation memory...");
const conversationCommand = CreateConversationMemoryCommand("test-mapping-env-1", testMessages);
const conversationMemory = await memoryCreator.createMemory(conversationCommand);
console.log("Conversation memory category:", conversationMemory.category);

console.log("=== Category Mapping Test Complete ===");
