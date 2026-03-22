import { Response } from "express";
import { db } from "@/db/index.js";
import { moodLogs } from "@/db/schema/mood-schema.js";
import { eq, desc, and, gte, avg, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  createMoodLogSchema,
  updateMoodLogSchema,
  validate,
} from "@/lib/validation.js";

export const createMoodLog = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const parsed = validate(createMoodLogSchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { moodScore, anxietyLevel, journalEntry, triggers } = parsed.data;

    const id = uuidv4();
    const [mood] = await db
      .insert(moodLogs)
      .values({
        id,
        userId,
        moodScore,
        anxietyLevel,
        journalEntry,
        triggers: triggers || [],
      })
      .returning();

    return {
      status: 201,
      message: "Mood logged successfully",
      data: mood,
      type: "success",
    };
  } catch (error) {
    console.error("Create mood log error:", error);
    return {
      status: 500,
      message: "Failed to create mood log",
      type: "error",
    };
  }
};

export const getMoodLogs = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const userMoodLogs = await db
      .select()
      .from(moodLogs)
      .where(eq(moodLogs.userId, userId))
      .orderBy(desc(moodLogs.createdAt));

    return {
      status: 200,
      message: "Mood logs retrieved successfully",
      data: userMoodLogs,
      type: "success",
    };
  } catch (error) {
    console.error("Get mood logs error:", error);
    return {
      status: 500,
      message: "Failed to get mood logs",
      type: "error",
    };
  }
};

export const getMoodTrends = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    startDate.setHours(0, 0, 0, 0);

    const trends = await db
      .select({
        date: sql`DATE(${moodLogs.createdAt})`,
        avgMood: avg(moodLogs.moodScore),
        avgAnxiety: avg(moodLogs.anxietyLevel),
        count: sql`COUNT(*)`,
      })
      .from(moodLogs)
      .where(
        and(
          eq(moodLogs.userId, userId),
          gte(moodLogs.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${moodLogs.createdAt})`)
      .orderBy(sql`DATE(${moodLogs.createdAt})`);

    const [overallAvg] = await db
      .select({
        avgMood: avg(moodLogs.moodScore),
        avgAnxiety: avg(moodLogs.anxietyLevel),
        totalLogs: sql`COUNT(*)`,
      })
      .from(moodLogs)
      .where(eq(moodLogs.userId, userId));

    return {
      status: 200,
      message: "Mood trends retrieved successfully",
      data: {
        dailyTrends: trends,
        overall: overallAvg,
      },
      type: "success",
    };
  } catch (error) {
    console.error("Get mood trends error:", error);
    return {
      status: 500,
      message: "Failed to get mood trends",
      type: "error",
    };
  }
};

export const getLatestMood = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;

    const [latestMood] = await db
      .select()
      .from(moodLogs)
      .where(eq(moodLogs.userId, userId))
      .orderBy(desc(moodLogs.createdAt))
      .limit(1);

    return {
      status: 200,
      message: "Latest mood retrieved",
      data: latestMood || null,
      type: "success",
    };
  } catch (error) {
    console.error("Get latest mood error:", error);
    return {
      status: 500,
      message: "Failed to get latest mood",
      type: "error",
    };
  }
};

export const updateMoodLog = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const parsed = validate(updateMoodLogSchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { moodScore, anxietyLevel, journalEntry, triggers } = parsed.data;

    const [existing] = await db
      .select()
      .from(moodLogs)
      .where(eq(moodLogs.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "Mood log not found",
        type: "error",
      };
    }

    const [updated] = await db
      .update(moodLogs)
      .set({
        moodScore: moodScore ?? existing.moodScore,
        anxietyLevel: anxietyLevel ?? existing.anxietyLevel,
        journalEntry: journalEntry ?? existing.journalEntry,
        triggers: triggers ?? existing.triggers,
      })
      .where(eq(moodLogs.id, id))
      .returning();

    return {
      status: 200,
      message: "Mood log updated successfully",
      data: updated,
      type: "success",
    };
  } catch (error) {
    console.error("Update mood log error:", error);
    return {
      status: 500,
      message: "Failed to update mood log",
      type: "error",
    };
  }
};

export const deleteMoodLog = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(moodLogs)
      .where(eq(moodLogs.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "Mood log not found",
        type: "error",
      };
    }

    await db.delete(moodLogs).where(eq(moodLogs.id, id));

    return {
      status: 200,
      message: "Mood log deleted successfully",
      type: "success",
    };
  } catch (error) {
    console.error("Delete mood log error:", error);
    return {
      status: 500,
      message: "Failed to delete mood log",
      type: "error",
    };
  }
};
