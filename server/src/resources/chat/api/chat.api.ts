import { Response } from "express";
import { AuthenticatedRequest } from "@/types/base.types";
import { createStreamChat } from "@/ai/streamChat";
import { db } from "@/db/index.js";
import { chats } from "@/db/schema/chat-schema.js";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

function generateTitle(messages: any[]): string {
  const firstUserMsg = messages.find(
    (m: any) => m.role === "user"
  );
  if (!firstUserMsg) return "New Chat";
  const text =
    firstUserMsg.content ??
    firstUserMsg.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("") ??
    "";
  if (!text) return "New Chat";
  return text.length > 60 ? text.slice(0, 57) + "..." : text;
}

export const chatApi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { messages, id: incomingChatId } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({
        status: 400,
        message: "Messages are required and must be an array",
        type: "error",
      });
      return;
    }

    const userId = req.user?.id;
    let chatId = incomingChatId as string | undefined;

    if (chatId) {
      const [existing] = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, userId!)))
        .limit(1);

      if (!existing) {
        chatId = undefined;
      }
    }

    if (!chatId) {
      chatId = uuidv4();
      await db.insert(chats).values({
        id: chatId,
        userId: userId!,
        title: generateTitle(messages),
        messages: [],
      });
    }

    res.setHeader("X-Chat-Id", chatId);

    const result = await createStreamChat(messages, {
      userId,
      onFinish: async (finishedMessages: any[]) => {
        try {
          const title = generateTitle(finishedMessages);
          await db
            .update(chats)
            .set({
              messages: finishedMessages as any,
              title,
              updatedAt: new Date(),
            })
            .where(eq(chats.id, chatId!));
        } catch (err) {
          console.error("Failed to persist chat:", err);
        }
      },
    });

    result.pipeUIMessageStreamToResponse(res);
  } catch (error) {
    console.error("Chat API error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        status: 500,
        message: "Internal server error",
        type: "error",
      });
    }
  }
};

export const listChats = async (req: AuthenticatedRequest, _res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const userChats = await db
      .select({
        id: chats.id,
        title: chats.title,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));

    return {
      status: 200,
      data: userChats,
      type: "success",
    };
  } catch (error) {
    console.error("List chats error:", error);
    return { status: 500, message: "Failed to list chats", type: "error" };
  }
};

export const getChatById = async (req: AuthenticatedRequest, _res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.userId, userId)))
      .limit(1);

    if (!chat) {
      return { status: 404, message: "Chat not found", type: "error" };
    }

    return {
      status: 200,
      data: chat,
      type: "success",
    };
  } catch (error) {
    console.error("Get chat error:", error);
    return { status: 500, message: "Failed to get chat", type: "error" };
  }
};

export const deleteChat = async (req: AuthenticatedRequest, _res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.userId, userId)))
      .limit(1);

    if (!existing) {
      return { status: 404, message: "Chat not found", type: "error" };
    }

    await db.delete(chats).where(eq(chats.id, id));

    return { status: 200, message: "Chat deleted", type: "success" };
  } catch (error) {
    console.error("Delete chat error:", error);
    return { status: 500, message: "Failed to delete chat", type: "error" };
  }
};
