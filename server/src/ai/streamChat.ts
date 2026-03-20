import { convertToModelMessages, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import systemPrompt from "./prompt";

export interface StreamChatOptions {
  temperature?: number;
  model?: string;
}

export const createStreamChat = (messages: any[], options: StreamChatOptions = {}) => {
  const { temperature = 0.7, model = "glm-4.6" } = options;

  const glm = createOpenAI({
    apiKey: process.env.ZAI_API_KEY!,
    baseURL: "https://api.z.ai/api/coding/paas/v4/",
  });

  
  return streamText({
    model: glm.chat(model),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    temperature,
  });
};