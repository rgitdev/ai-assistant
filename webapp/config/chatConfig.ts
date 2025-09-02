export const chatConfig = {
  markdownSupported: true,
  maxMessageLength: 4000,
  typingDelay: 1000,
  autoScroll: true,
  showTimestamps: true,
  enableMarkdownForAssistant: true,
  enableMarkdownForUser: false,
} as const;

export type ChatConfig = typeof chatConfig;