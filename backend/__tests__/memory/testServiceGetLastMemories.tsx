import { ConversationRepositoryFactory } from "@backend/repository/ConversationRepositoryFactory";
import { MemoryProvider } from "@backend/services/memory/MemoryProvider";

const memoryProvider = new MemoryProvider();

memoryProvider.getFormattedMemories().then(console.log);
