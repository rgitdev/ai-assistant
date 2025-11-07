import { SystemPromptComponent } from "./interfaces";
import { chatUsagePrompt } from "../chatUsagePrompt";

/**
 * System component that provides formatting and chat usage instructions.
 * This is a system-only component (no associated messages).
 * Contains instructions about available formatting capabilities.
 */
export class ChatUsageComponent implements SystemPromptComponent {
  getLabel(): string {
    return "CHAT_USAGE";
  }

  getInstruction(): string {
    return chatUsagePrompt;
  }
}
