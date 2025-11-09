
import { ChatMessage } from "@backend/models/ChatMessage";
import { QueryService } from "@backend/services/query/QueryService";
import { MemoryCategory } from "@backend/models/Memory";


const messages: ChatMessage[] = [
  {
    "id": "dcbf4496-2b28-4f6b-af89-37fe7726b919",
    "content": "Hello Lili, how are you",
    "role": "user",
    "timestamp": "2025-09-03T21:37:34.910Z"
  },
  {
    "id": "bbed7e84-0d4f-4eea-a401-d8b816c87c36",
    "content": "Bonjour, my dear Radek! How thoughtful of you to inquire—why, I am feeling positively radiant today, surrounded by all the comforts one expects of a Rochefort and, naturellement, basking in Salt's magnificent company. His fur is simply immaculate; one might say even the finest silks would weep with envy! Oh-hohohoho!\n\nBut truly, is there not something delightfully invigorating about this hour? The day stretches before us—a blank canvas of possibility and adventure! I trust you have not allowed yourself to be tethered by anything dreadfully tiresome, such as spreadsheets or—mon Dieu—commuter trains? Do share: what little spark has found its way into your day, cher ami?",
    "role": "assistant",
    "timestamp": "2025-09-03T21:37:38.904Z"
  },
  {
    "id": "fdfc9f4d-2b03-4dd1-8945-f17c926ac55d",
    "content": "I skipped the italian lessons today, we had 2 of them this week, just was busy. for lesson 1 we had greetings etc. lesson 2 cconversation at the coffe. that quite intense. what would you suggest for lesson 3? some vocabulary useful in real life scenario... i dont know where to start.",
    "role": "user",
    "timestamp": "2025-09-03T21:39:40.581Z"
  }
];

// Updated to use new QueryService with category descriptions
const queryService = new QueryService();

const categoryDescriptions = {
  [MemoryCategory.ASSISTANT_PERSONA]: 'Personal information, characteristics, preferences, and biographical details about the assistant',
  [MemoryCategory.USER_PROFILE]: 'Personal information, characteristics, preferences, and biographical details about the user',
  [MemoryCategory.CONVERSATION]: 'Past discussions, dialogue history, and conversational context between user and assistant',
  [MemoryCategory.TASK]: 'Work items, projects, assignments, and task-related information including progress and outcomes',
  [MemoryCategory.PREFERENCE]: 'User choices, settings, likes/dislikes, and behavioral preferences across different contexts',
  [MemoryCategory.CONTEXT]: 'Environmental information, situational details, and contextual background for interactions',
  [MemoryCategory.KNOWLEDGE]: 'Facts, learned information, domain expertise, and educational content shared or discussed',
  [MemoryCategory.RELATIONSHIP]: 'Connections between people, entities, or concepts; interpersonal dynamics and associations',
  [MemoryCategory.GOAL]: 'Objectives, targets, aspirations, and desired outcomes expressed by the user',
  [MemoryCategory.OTHER]: 'Miscellaneous information that doesn\'t fit into other specific categories'
};

const queries = await queryService.extractQueries(messages, categoryDescriptions);
console.log("Extracted queries:");
console.log(queries);