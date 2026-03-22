import { Response } from "express";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@/db/index.js";
import { symptoms } from "@/db/schema/symptoms-schema.js";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { config } from "@/config/index.js";
import { getUserHealthContext, formatHealthContext } from "@/ai/getHealthContext.js";
import {
  createSymptomSchema,
  updateSymptomSchema,
  validate,
} from "@/lib/validation.js";

export const createSymptom = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const parsed = validate(createSymptomSchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { name, severity, duration, bodyPart, notes } = parsed.data;

    const id = uuidv4();
    const [symptom] = await db
      .insert(symptoms)
      .values({
        id,
        userId,
        name,
        severity,
        duration,
        bodyPart,
        notes,
      })
      .returning();

    return {
      status: 201,
      message: "Symptom logged successfully",
      data: symptom,
      type: "success",
    };
  } catch (error) {
    console.error("Create symptom error:", error);
    return {
      status: 500,
      message: "Failed to create symptom",
      type: "error",
    };
  }
};

export const getSymptoms = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const userSymptoms = await db
      .select()
      .from(symptoms)
      .where(eq(symptoms.userId, userId))
      .orderBy(desc(symptoms.createdAt));

    return {
      status: 200,
      message: "Symptoms retrieved successfully",
      data: userSymptoms,
      type: "success",
    };
  } catch (error) {
    console.error("Get symptoms error:", error);
    return {
      status: 500,
      message: "Failed to get symptoms",
      type: "error",
    };
  }
};

export const getSymptomById = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [symptom] = await db
      .select()
      .from(symptoms)
      .where(eq(symptoms.id, id))
      .limit(1);

    if (!symptom || symptom.userId !== userId) {
      return {
        status: 404,
        message: "Symptom not found",
        type: "error",
      };
    }

    return {
      status: 200,
      message: "Symptom retrieved successfully",
      data: symptom,
      type: "success",
    };
  } catch (error) {
    console.error("Get symptom error:", error);
    return {
      status: 500,
      message: "Failed to get symptom",
      type: "error",
    };
  }
};

export const updateSymptom = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const parsed = validate(updateSymptomSchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { name, severity, duration, bodyPart, notes, analyzed, analysisResult } = parsed.data;

    const [existing] = await db
      .select()
      .from(symptoms)
      .where(eq(symptoms.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "Symptom not found",
        type: "error",
      };
    }

    const [updated] = await db
      .update(symptoms)
      .set({
        name: name ?? existing.name,
        severity: severity ?? existing.severity,
        duration: duration ?? existing.duration,
        bodyPart: bodyPart ?? existing.bodyPart,
        notes: notes ?? existing.notes,
        analyzed: analyzed ?? existing.analyzed,
        analysisResult: analysisResult ?? existing.analysisResult,
      })
      .where(eq(symptoms.id, id))
      .returning();

    return {
      status: 200,
      message: "Symptom updated successfully",
      data: updated,
      type: "success",
    };
  } catch (error) {
    console.error("Update symptom error:", error);
    return {
      status: 500,
      message: "Failed to update symptom",
      type: "error",
    };
  }
};

export const deleteSymptom = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(symptoms)
      .where(eq(symptoms.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "Symptom not found",
        type: "error",
      };
    }

    await db.delete(symptoms).where(eq(symptoms.id, id));

    return {
      status: 200,
      message: "Symptom deleted successfully",
      type: "success",
    };
  } catch (error) {
    console.error("Delete symptom error:", error);
    return {
      status: 500,
      message: "Failed to delete symptom",
      type: "error",
    };
  }
};

export const analyzeSymptom = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [symptom] = await db
      .select()
      .from(symptoms)
      .where(eq(symptoms.id, id))
      .limit(1);

    if (!symptom || symptom.userId !== userId) {
      return { status: 404, message: "Symptom not found", type: "error" };
    }

    let healthContext = "";
    try {
      const ctx = await getUserHealthContext(userId);
      healthContext = formatHealthContext(ctx);
    } catch {
      healthContext = "(Unable to fetch health context)";
    }

    const openai = createOpenAI({ apiKey: config.security.openai.apiKey });

    const symptomSummary = [
      `Symptom: ${symptom.name}`,
      symptom.severity != null ? `Severity: ${symptom.severity}/10` : null,
      symptom.duration ? `Duration: ${symptom.duration}` : null,
      symptom.bodyPart ? `Body part: ${symptom.bodyPart}` : null,
      symptom.notes ? `Notes: ${symptom.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const { text } = await generateText({
      model: openai.chat("gpt-4o-mini"),
      system: `You are CareBot, a knowledgeable and empathetic virtual doctor. Analyze the following symptom and provide a concise medical assessment. Use markdown formatting. Be warm but professional.

Structure your response with these sections:
### Possible Causes
2-3 most likely causes, most probable first.

### Severity Assessment
Brief assessment of how concerning this symptom is given the details.

### Recommended Action
What the patient should do — home remedies, OTC medications with dosages, or see a doctor.

### When to Seek Urgent Care
Red flags that would warrant immediate medical attention.

Keep the total response under 300 words. Consider the patient's health context below when making your assessment.
${healthContext}`,
      prompt: symptomSummary,
      temperature: 0.4,
    });

    const [updated] = await db
      .update(symptoms)
      .set({ analyzed: true, analysisResult: text })
      .where(eq(symptoms.id, id))
      .returning();

    return {
      status: 200,
      message: "Symptom analyzed successfully",
      data: updated,
      type: "success",
    };
  } catch (error) {
    console.error("Analyze symptom error:", error);
    return {
      status: 500,
      message: "Failed to analyze symptom",
      type: "error",
    };
  }
};
