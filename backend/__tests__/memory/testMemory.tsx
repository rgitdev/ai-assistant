import { ConversationRepositoryFactory } from "@backend/repository/ConversationRepositoryFactory";
import { MemoryCreator } from "@backend/services/memory/MemoryCreator";

const memoryCreator = new MemoryCreator();
const conversationRepository = new ConversationRepositoryFactory().build();
const messages = await conversationRepository.getConversationMessages("conv_mfbmdwx8fbao052155");
const memory = await memoryCreator.createMemoryForConversation("conv_mfbmdwx8fbao052155", messages);
console.log(memory);
