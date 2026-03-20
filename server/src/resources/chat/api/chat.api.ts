import { Response } from "express";
import { createStreamChat } from "@/ai/streamChat";

export const chatApi = async (req: any, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({
        status: 400,
        message: "Messages are required and must be an array",
        type: "error",
      });
      return;
    }

    // Set up streaming response using the abstracted function
    const result = createStreamChat(messages);

    // Set headers for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Stream the response
    const response = await result.toUIMessageStreamResponse();

    // Handle the streaming response properly
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const streamData = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            if (!res.destroyed) {
              res.write(chunk);
            }
          }
          if (!res.destroyed) {
            res.end();
          }
        } catch (error) {
          console.error("Streaming error:", error);
          if (!res.destroyed) {
            res.end();
          }
        }
      };

      streamData();
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Chat API error:", error);
    if (!res.destroyed) {
      res.status(500).json({
        status: 500,
        message: "Internal server error",
        type: "error",
      });
    }
  }
};
