import { Response } from "express";
import { db } from "@/db/index.js";
import { medicalHistory, allergies } from "@/db/schema/medical-history-schema.js";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  createAllergySchema,
  createHistorySchema,
  updateHistorySchema,
  validate,
} from "@/lib/validation.js";

export const createHistoryEntry = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const parsed = validate(createHistorySchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { condition, diagnosisDate, treatment, doctor, notes } = parsed.data;

    const id = uuidv4();
    const [entry] = await db
      .insert(medicalHistory)
      .values({
        id,
        userId,
        condition,
        diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : null,
        treatment,
        doctor,
        notes,
      })
      .returning();

    return {
      status: 201,
      message: "Medical history entry added successfully",
      data: entry,
      type: "success",
    };
  } catch (error) {
    console.error("Create history error:", error);
    return {
      status: 500,
      message: "Failed to create history entry",
      type: "error",
    };
  }
};

export const getHistory = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const userHistory = await db
      .select()
      .from(medicalHistory)
      .where(eq(medicalHistory.userId, userId))
      .orderBy(desc(medicalHistory.createdAt));

    return {
      status: 200,
      message: "Medical history retrieved successfully",
      data: userHistory,
      type: "success",
    };
  } catch (error) {
    console.error("Get history error:", error);
    return {
      status: 500,
      message: "Failed to get history",
      type: "error",
    };
  }
};

export const updateHistoryEntry = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const parsed = validate(updateHistorySchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { condition, diagnosisDate, treatment, doctor, notes } = parsed.data;

    const [existing] = await db
      .select()
      .from(medicalHistory)
      .where(eq(medicalHistory.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "History entry not found",
        type: "error",
      };
    }

    const [updated] = await db
      .update(medicalHistory)
      .set({
        condition: condition ?? existing.condition,
        diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : existing.diagnosisDate,
        treatment: treatment ?? existing.treatment,
        doctor: doctor ?? existing.doctor,
        notes: notes ?? existing.notes,
      })
      .where(eq(medicalHistory.id, id))
      .returning();

    return {
      status: 200,
      message: "History entry updated successfully",
      data: updated,
      type: "success",
    };
  } catch (error) {
    console.error("Update history error:", error);
    return {
      status: 500,
      message: "Failed to update history entry",
      type: "error",
    };
  }
};

export const deleteHistoryEntry = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(medicalHistory)
      .where(eq(medicalHistory.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "History entry not found",
        type: "error",
      };
    }

    await db.delete(medicalHistory).where(eq(medicalHistory.id, id));

    return {
      status: 200,
      message: "History entry deleted successfully",
      type: "success",
    };
  } catch (error) {
    console.error("Delete history error:", error);
    return {
      status: 500,
      message: "Failed to delete history entry",
      type: "error",
    };
  }
};

export const createAllergy = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const parsed = validate(createAllergySchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { allergen, reaction, severity } = parsed.data;

    const id = uuidv4();
    const [allergy] = await db
      .insert(allergies)
      .values({
        id,
        userId,
        allergen,
        reaction,
        severity,
      })
      .returning();

    return {
      status: 201,
      message: "Allergy added successfully",
      data: allergy,
      type: "success",
    };
  } catch (error) {
    console.error("Create allergy error:", error);
    return {
      status: 500,
      message: "Failed to create allergy",
      type: "error",
    };
  }
};

export const getAllergies = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const userAllergies = await db
      .select()
      .from(allergies)
      .where(eq(allergies.userId, userId))
      .orderBy(desc(allergies.createdAt));

    return {
      status: 200,
      message: "Allergies retrieved successfully",
      data: userAllergies,
      type: "success",
    };
  } catch (error) {
    console.error("Get allergies error:", error);
    return {
      status: 500,
      message: "Failed to get allergies",
      type: "error",
    };
  }
};

export const deleteAllergy = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(allergies)
      .where(eq(allergies.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "Allergy not found",
        type: "error",
      };
    }

    await db.delete(allergies).where(eq(allergies.id, id));

    return {
      status: 200,
      message: "Allergy deleted successfully",
      type: "success",
    };
  } catch (error) {
    console.error("Delete allergy error:", error);
    return {
      status: 500,
      message: "Failed to delete allergy",
      type: "error",
    };
  }
};
