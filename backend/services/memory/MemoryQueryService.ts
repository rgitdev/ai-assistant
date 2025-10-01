import { ConversationMessage, OpenAIService } from "@backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "@backend/client/openai/OpenAIServiceFactory";
import { ChatMessage } from "@backend/models/ChatMessage";
import { memoryQuerySystemPrompt } from "./prompts/memoryQuerySystemPrompt";
import { conversationPartner } from "./conversationPartner";
import { MemoryCategory } from "@backend/models/Memory";

export class MemoryQueryService {
    private readonly openAIService: OpenAIService;


    constructor() {
        const openAIFactory = new OpenAIServiceFactory();
        this.openAIService = openAIFactory.build();
    }

    async extractQueries(messages: ChatMessage[]): Promise<string[]> {
        try {
            const openAIMessages: ConversationMessage[] = messages.map((m) => ({
                role: m.role,
                content: m.content,
              }));

            const thinking = await this.openAIService.sendMessages(this.createQuerySystemPrompt(), openAIMessages);
            const result = JSON.parse(thinking) as {queries: string[]};

            return result.queries;

        } catch (error: any) {
            throw error;    
        }
    }

    createQuerySystemPrompt(): string {
        const categoryDescriptions = this.getCategoryDescriptions();
        const categoriesText = Object.entries(categoryDescriptions)
            .map(([category, description]) => `- ${category}: ${description}`)
            .join('\n');

        return memoryQuerySystemPrompt(categoriesText);
    }

    recallUserInfo(): string {
        return conversationPartner;
    }

    getCategoryDescriptions(): Record<MemoryCategory, string> {
        return {
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
    }
}
