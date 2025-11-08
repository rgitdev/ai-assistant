import { ConversationRepositoryFactory } from "@backend/repository/ConversationRepositoryFactory";
import { MemoryCreator } from "@backend/services/memory/MemoryCreator";
import { CreateAssistantPersonaMemoryCommand } from "@backend/services/memory/commands/CreateAssistantPersonaMemoryCommand";
import { AssistantService } from "@backend/services/assistant/AssistantService";

const assistantService = new AssistantService();
const memoryCreator = new MemoryCreator(assistantService);
const conversationRepository = new ConversationRepositoryFactory().build();
const messages = await conversationRepository.getConversationMessages("conv_mfbmdwx8fbao052155");
const command = CreateAssistantPersonaMemoryCommand("conv_mfbmdwx8fbao052155", messages);
const memory = await memoryCreator.createMemory(command);
console.log(memory);
