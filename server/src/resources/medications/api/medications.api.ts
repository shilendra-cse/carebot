import { Response } from "express";
import { db } from "@/db/index.js";
import { medications, medicationLogs } from "@/db/schema/medications-schema.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  createMedicationSchema,
  logMedicationDoseSchema,
  updateMedicationSchema,
  validate,
} from "@/lib/validation.js";

export const createMedication = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const parsed = validate(createMedicationSchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { name, dosage, frequency, times, startDate, endDate, notes } = parsed.data;

    const id = uuidv4();
    const [medication] = await db
      .insert(medications)
      .values({
        id,
        userId,
        name,
        dosage,
        frequency,
        times: times || [],
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes,
      })
      .returning();

    return {
      status: 201,
      message: "Medication added successfully",
      data: medication,
      type: "success",
    };
  } catch (error) {
    console.error("Create medication error:", error);
    return {
      status: 500,
      message: "Failed to create medication",
      type: "error",
    };
  }
};

export const getMedications = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const userMedications = await db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId))
      .orderBy(desc(medications.createdAt));

    return {
      status: 200,
      message: "Medications retrieved successfully",
      data: userMedications,
      type: "success",
    };
  } catch (error) {
    console.error("Get medications error:", error);
    return {
      status: 500,
      message: "Failed to get medications",
      type: "error",
    };
  }
};

export const getMedicationById = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [medication] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, id))
      .limit(1);

    if (!medication || medication.userId !== userId) {
      return {
        status: 404,
        message: "Medication not found",
        type: "error",
      };
    }

    return {
      status: 200,
      message: "Medication retrieved successfully",
      data: medication,
      type: "success",
    };
  } catch (error) {
    console.error("Get medication error:", error);
    return {
      status: 500,
      message: "Failed to get medication",
      type: "error",
    };
  }
};

export const updateMedication = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const parsed = validate(updateMedicationSchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { name, dosage, frequency, times, startDate, endDate, active, notes } = parsed.data;

    const [existing] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "Medication not found",
        type: "error",
      };
    }

    const [updated] = await db
      .update(medications)
      .set({
        name: name ?? existing.name,
        dosage: dosage ?? existing.dosage,
        frequency: frequency ?? existing.frequency,
        times: times ?? existing.times,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        active: active ?? existing.active,
        notes: notes ?? existing.notes,
      })
      .where(eq(medications.id, id))
      .returning();

    return {
      status: 200,
      message: "Medication updated successfully",
      data: updated,
      type: "success",
    };
  } catch (error) {
    console.error("Update medication error:", error);
    return {
      status: 500,
      message: "Failed to update medication",
      type: "error",
    };
  }
};

export const deleteMedication = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "Medication not found",
        type: "error",
      };
    }

    await db.delete(medications).where(eq(medications.id, id));

    return {
      status: 200,
      message: "Medication deleted successfully",
      type: "success",
    };
  } catch (error) {
    console.error("Delete medication error:", error);
    return {
      status: 500,
      message: "Failed to delete medication",
      type: "error",
    };
  }
};

export const logMedicationDose = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const parsed = validate(logMedicationDoseSchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { taken, takenAt, skipped, notes } = parsed.data;

    const [medication] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, id))
      .limit(1);

    if (!medication || medication.userId !== userId) {
      return {
        status: 404,
        message: "Medication not found",
        type: "error",
      };
    }

    const logId = uuidv4();
    const [log] = await db
      .insert(medicationLogs)
      .values({
        id: logId,
        medicationId: id,
        userId,
        scheduledTime: new Date(),
        takenAt: taken ? new Date(takenAt || new Date()) : null,
        skipped: skipped || false,
        notes,
      })
      .returning();

    return {
      status: 201,
      message: "Dose logged successfully",
      data: log,
      type: "success",
    };
  } catch (error) {
    console.error("Log dose error:", error);
    return {
      status: 500,
      message: "Failed to log dose",
      type: "error",
    };
  }
};

export const getTodayMedications = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userMedications = await db
      .select()
      .from(medications)
      .where(and(eq(medications.userId, userId), eq(medications.active, true)));

    const todayLogs = await db
      .select()
      .from(medicationLogs)
      .where(
        and(
          eq(medicationLogs.userId, userId),
          gte(medicationLogs.scheduledTime, today),
          lte(medicationLogs.scheduledTime, tomorrow)
        )
      );

    const medicationData = userMedications.map((med) => {
      const logs = todayLogs.filter((log) => log.medicationId === med.id);
      return {
        ...med,
        logs,
        takenCount: logs.filter((l) => l.takenAt).length,
        skippedCount: logs.filter((l) => l.skipped).length,
      };
    });

    return {
      status: 200,
      message: "Today's medications retrieved",
      data: medicationData,
      type: "success",
    };
  } catch (error) {
    console.error("Get today's medications error:", error);
    return {
      status: 500,
      message: "Failed to get today's medications",
      type: "error",
    };
  }
};
