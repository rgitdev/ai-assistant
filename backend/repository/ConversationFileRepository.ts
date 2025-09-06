import { IConversationRepository } from "./IConversationRepository";
import { ChatMessage, Conversation } from "../models/ChatMessage";
import * as fs from "fs";
import * as path from "path";

interface StoredConversation {
  messages: ChatMessage[];
  metadata: Conversation;
}

interface ConversationStorage {
  [conversationId: string]: StoredConversation;
}

export class ConversationFileRepository implements IConversationRepository {
  private filePath: string;

  constructor(filePath: string = "backend/data/conversations.json") {
    this.filePath = filePath;
    this.ensureFileExists();
  }

  private ensureFileExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}));
    }
  }

  private async readStorage(): Promise<ConversationStorage> {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  private async writeStorage(storage: ConversationStorage): Promise<void> {
    fs.writeFileSync(this.filePath, JSON.stringify(storage, null, 2));
  }

  async addMessage(conversationId: string, message: ChatMessage): Promise<void> {
    const storage = await this.readStorage();
    
    if (!storage[conversationId]) {
      storage[conversationId] = {
        messages: [],
        metadata: {
          id: conversationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
    }

    storage[conversationId].messages.push(message);
    storage[conversationId].metadata.updatedAt = new Date().toISOString();

    await this.writeStorage(storage);
  }


  async createConversation(): Promise<string> {
    return 'conv_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async getConversations(): Promise<Conversation[]> {
    const storage = await this.readStorage();
    return Object.values(storage).map(conv => conv.metadata);
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const storage = await this.readStorage();
    return storage[conversationId]?.messages || [];
  }

  async updateConversationName(conversationId: string, name: string): Promise<void> {
    const storage = await this.readStorage();
    
    if (!storage[conversationId]) {
      throw new Error('Conversation not found');
    }

    storage[conversationId].metadata.name = name;
    storage[conversationId].metadata.updatedAt = new Date().toISOString();

    await this.writeStorage(storage);
  }

  async updateMessage(messageId: string, content: string): Promise<void> {
    const storage = await this.readStorage();
    let found = false;
    for (const convId of Object.keys(storage)) {
      const conv = storage[convId];
      const index = conv.messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        conv.messages[index].content = content;
        conv.messages[index].timestamp = new Date().toISOString();
        conv.metadata.updatedAt = new Date().toISOString();
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error('Message not found');
    }
    await this.writeStorage(storage);
  }

  async deleteMessagesAfter(conversationId: string, messageId: string): Promise<void> {
    const storage = await this.readStorage();
    const conv = storage[conversationId];
    if (!conv) {
      throw new Error('Conversation not found');
    }
    const index = conv.messages.findIndex(m => m.id === messageId);
    if (index === -1) {
      throw new Error('Message not found');
    }
    conv.messages = conv.messages.slice(0, index + 1);
    conv.metadata.updatedAt = new Date().toISOString();
    await this.writeStorage(storage);
  }
}