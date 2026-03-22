import { streamText, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { config } from "@/config/index.js";
import systemPrompt from "./prompt.js";
import { getUserHealthContext, formatHealthContext } from "./getHealthContext.js";
import { createHealthTools } from "./tools.js";

interface UIMessage {
  parts?: Array<{ type: string; text: string }>;
  content?: string;
  role: string;
  id?: string;
}

function convertToCoreMessage(msg: UIMessage) {
  const text = msg.content ?? msg.parts?.filter(p => p.type === 'text').map(p => p.text).join('') ?? '';
  return {
    role: msg.role as "user" | "assistant" | "system",
    content: text
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function createStreamChat(
  messages: UIMessage[],
  options: {
    temperature?: number;
    model?: string;
    userId?: string;
    onFinish?: (messages: UIMessage[]) => Promise<void>;
  } = {}
): Promise<any> {
  const { temperature = 0.7, model = "gpt-4o-mini", userId, onFinish } = options;

  const openai = createOpenAI({
    apiKey: config.security.openai.apiKey,
  });

  let healthContext = "";
  if (userId) {
    try {
      const context = await getUserHealthContext(userId);
      healthContext = formatHealthContext(context);
    } catch {
      healthContext = "\n\n(Note: Unable to fetch health data.)\n";
    }
  }

  const systemWithContext = systemPrompt + healthContext;
  const coreMessages = messages.map(convertToCoreMessage);
  const tools = userId ? createHealthTools(userId) : undefined;

  return streamText({
    model: openai.chat(model),
    system: systemWithContext,
    messages: coreMessages as any,
    temperature,
    tools,
    stopWhen: stepCountIs(3),
    onFinish: async ({ text }) => {
      if (onFinish) {
        const assistantMessage: UIMessage = {
          role: "assistant",
          content: text,
          id: `assistant-${Date.now()}`,
        };
        await onFinish([...messages, assistantMessage]);
      }
    },
  });
}
