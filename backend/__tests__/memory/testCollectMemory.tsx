import { ConversationRepositoryFactory } from "@backend/repository/ConversationRepositoryFactory";
import { MemoryService } from "@backend/services/memory/MemoryService";

const memoryService = new MemoryService();
const conversationRepository = new ConversationRepositoryFactory().build();
const messages = await conversationRepository.getConversationMessages("conv_mfbmdwx8fbao052155");
const memory = await memoryService.createMemoryForCollectingUserInformation("conv_mfbmdwx8fbao052155", messages);
console.log(memory);
