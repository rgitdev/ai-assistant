// src/services/chatService.ts

// The function expects a 'string' and returns a 'Promise<string>'.
export const getAiResponse = async (userMessage: string): Promise<string> => {
  console.log("Sending to AI:", userMessage);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const aiMessage = `This is a simulated TS response to: "${userMessage}"`;
  
  return aiMessage;
};