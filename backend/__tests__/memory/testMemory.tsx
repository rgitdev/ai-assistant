import { ConversationRepositoryFactory } from "@backend/repository/ConversationRepositoryFactory";
import { MemoryCreator } from "@backend/services/memory/MemoryCreator";
import { CreateConversationMemoryCommand } from "@backend/services/memory/commands/CreateConversationMemoryCommand";

const memoryCreator = new MemoryCreator();
const conversationRepository = new ConversationRepositoryFactory().build();
const messages = await conversationRepository.getConversationMessages("conv_mfbmdwx8fbao052155");
const command = CreateConversationMemoryCommand("conv_mfbmdwx8fbao052155", messages);
const memory = await memoryCreator.createMemory(command);
console.log(memory);
