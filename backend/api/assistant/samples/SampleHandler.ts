import { basicResponses } from "./basicResponses";
import { multilineResponses } from "./multilineResponses";
import { markdownResponses } from "./markdownResponses";
import { keywordResponses } from "./keywordResponses";

export class SampleHandler {
  static getSimulatedResponse(userMessage: string): string {
    const allResponses = [...basicResponses, ...multilineResponses, ...markdownResponses];
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      const choices = keywordResponses.greetings;
      return choices[Math.floor(Math.random() * choices.length)];
    }

    if (lowerMessage.includes('help')) {
      const choices = keywordResponses.help;
      return choices[Math.floor(Math.random() * choices.length)];
    }

    if (lowerMessage.includes('thank')) {
      const choices = keywordResponses.gratitude;
      return choices[Math.floor(Math.random() * choices.length)];
    }

    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      const choices = keywordResponses.farewell;
      return choices[Math.floor(Math.random() * choices.length)];
    }

    if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
      const choices = keywordResponses.programming;
      return choices[Math.floor(Math.random() * choices.length)];
    }

    if (lowerMessage.includes('weather')) {
      const choices = keywordResponses.weather;
      return choices[Math.floor(Math.random() * choices.length)];
    }

    return allResponses[Math.floor(Math.random() * allResponses.length)];
  }
}

