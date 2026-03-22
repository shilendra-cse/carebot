import { Response } from "express";
import { db } from "@/db/index.js";
import { appointments } from "@/db/schema/appointments-schema.js";
import { eq, desc, and, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  addAppointmentNotesSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  validate,
} from "@/lib/validation.js";

export const createAppointment = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const parsed = validate(createAppointmentSchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { doctorName, specialty, date, time, location, reason, notes, status } =
      parsed.data;

    const id = uuidv4();
    const appointmentDate = new Date(date);

    const [appointment] = await db
      .insert(appointments)
      .values({
        id,
        userId,
        doctorName,
        specialty,
        date: appointmentDate,
        time,
        location,
        reason,
        notes,
        ...(status ? { status } : {}),
      })
      .returning();

    return {
      status: 201,
      message: "Appointment scheduled successfully",
      data: appointment,
      type: "success",
    };
  } catch (error) {
    console.error("Create appointment error:", error);
    return {
      status: 500,
      message: "Failed to create appointment",
      type: "error",
    };
  }
};

export const getAppointments = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const userAppointments = await db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.date));

    return {
      status: 200,
      message: "Appointments retrieved successfully",
      data: userAppointments,
      type: "success",
    };
  } catch (error) {
    console.error("Get appointments error:", error);
    return {
      status: 500,
      message: "Failed to get appointments",
      type: "error",
    };
  }
};

export const getUpcomingAppointments = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.status, "scheduled"),
          gte(appointments.date, now)
        )
      )
      .orderBy(appointments.date);

    return {
      status: 200,
      message: "Upcoming appointments retrieved",
      data: upcoming,
      type: "success",
    };
  } catch (error) {
    console.error("Get upcoming appointments error:", error);
    return {
      status: 500,
      message: "Failed to get upcoming appointments",
      type: "error",
    };
  }
};

export const getAppointmentById = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (!appointment || appointment.userId !== userId) {
      return {
        status: 404,
        message: "Appointment not found",
        type: "error",
      };
    }

    return {
      status: 200,
      message: "Appointment retrieved successfully",
      data: appointment,
      type: "success",
    };
  } catch (error) {
    console.error("Get appointment error:", error);
    return {
      status: 500,
      message: "Failed to get appointment",
      type: "error",
    };
  }
};

export const updateAppointment = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const parsed = validate(updateAppointmentSchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { doctorName, specialty, date, time, location, reason, notes, status } = parsed.data;

    const [existing] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "Appointment not found",
        type: "error",
      };
    }

    const [updated] = await db
      .update(appointments)
      .set({
        doctorName: doctorName ?? existing.doctorName,
        specialty: specialty ?? existing.specialty,
        date: date ? new Date(date) : existing.date,
        time: time ?? existing.time,
        location: location ?? existing.location,
        reason: reason ?? existing.reason,
        notes: notes ?? existing.notes,
        status: status ?? existing.status,
      })
      .where(eq(appointments.id, id))
      .returning();

    return {
      status: 200,
      message: "Appointment updated successfully",
      data: updated,
      type: "success",
    };
  } catch (error) {
    console.error("Update appointment error:", error);
    return {
      status: 500,
      message: "Failed to update appointment",
      type: "error",
    };
  }
};

export const deleteAppointment = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "Appointment not found",
        type: "error",
      };
    }

    await db.delete(appointments).where(eq(appointments.id, id));

    return {
      status: 200,
      message: "Appointment deleted successfully",
      type: "success",
    };
  } catch (error) {
    console.error("Delete appointment error:", error);
    return {
      status: 500,
      message: "Failed to delete appointment",
      type: "error",
    };
  }
};

export const addAppointmentNotes = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const parsed = validate(addAppointmentNotesSchema, req.body);
    if (!parsed.success) {
      return { status: 400, message: parsed.error, type: "error" as const };
    }
    const { notes } = parsed.data;

    const [existing] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return {
        status: 404,
        message: "Appointment not found",
        type: "error",
      };
    }

    const [updated] = await db
      .update(appointments)
      .set({
        notes: notes ?? existing.notes,
        status: "completed",
      })
      .where(eq(appointments.id, id))
      .returning();

    return {
      status: 200,
      message: "Notes added successfully",
      data: updated,
      type: "success",
    };
  } catch (error) {
    console.error("Add notes error:", error);
    return {
      status: 500,
      message: "Failed to add notes",
      type: "error",
    };
  }
};
