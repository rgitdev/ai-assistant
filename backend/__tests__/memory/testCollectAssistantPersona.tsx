import { Assistant } from "@backend/assistant/Assistant";
import { MemoryCategory } from "@backend/models/Memory";

const assistant = new Assistant();
const memory = await assistant.createMemoryForConversation(
  "conv_mfbmdwx8fbao052155",
  MemoryCategory.ASSISTANT_PERSONA
);
console.log(memory);
