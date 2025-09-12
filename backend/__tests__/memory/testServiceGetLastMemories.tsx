import { ConversationRepositoryFactory } from "@backend/repository/ConversationRepositoryFactory";
import { MemoryService } from "@backend/services/memory/MemoryService";

const memoryService = new MemoryService();

memoryService.getMemoriesAsAssistantMessage().then(console.log);
