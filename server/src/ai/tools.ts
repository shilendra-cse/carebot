import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db/index.js";
import { symptoms } from "@/db/schema/symptoms-schema.js";
import { medications } from "@/db/schema/medications-schema.js";
import { appointments } from "@/db/schema/appointments-schema.js";
import { moodLogs } from "@/db/schema/mood-schema.js";
import { allergies } from "@/db/schema/medical-history-schema.js";
import { v4 as uuidv4 } from "uuid";

const symptomInput = z.object({
  name: z.string().describe("Name of the symptom (e.g. headache, sore throat, nausea)"),
  severity: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("Severity on a 1-10 scale. Infer from context if not stated explicitly."),
  duration: z
    .string()
    .optional()
    .describe("How long the user has had the symptom (e.g. '2 days', 'since morning')"),
  bodyPart: z
    .string()
    .optional()
    .describe("Body part affected (e.g. head, chest, abdomen)"),
  notes: z.string().optional().describe("Any additional details from the conversation"),
});

const moodInput = z.object({
  moodScore: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("Overall mood score 1-10 (1=very low, 10=excellent). Infer from context."),
  anxietyLevel: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("Anxiety level 1-10 (1=calm, 10=severe anxiety). Infer from context."),
  journalEntry: z
    .string()
    .optional()
    .describe("Brief summary of what the user shared about their emotional state"),
  triggers: z
    .array(z.string())
    .optional()
    .describe("What triggered the mood (e.g. 'work stress', 'lack of sleep')"),
});

const medicationInput = z.object({
  name: z.string().describe("Medication name (e.g. Paracetamol, Amoxicillin)"),
  dosage: z.string().describe("Dosage (e.g. '500mg', '10ml')"),
  frequency: z.string().describe("How often to take it (e.g. 'twice daily', 'every 8 hours')"),
  notes: z.string().optional().describe("Usage instructions or precautions"),
});

const appointmentInput = z.object({
  doctorName: z
    .string()
    .describe("Doctor name or type (e.g. 'Dr. Smith', 'General Physician')"),
  specialty: z
    .string()
    .optional()
    .describe("Medical specialty (e.g. Dermatologist, Cardiologist, General)"),
  date: z.string().describe("Appointment date in ISO format (YYYY-MM-DD)"),
  time: z.string().optional().describe("Appointment time (e.g. '10:00', '14:30')"),
  reason: z.string().optional().describe("Reason for the visit"),
});

const allergyInput = z.object({
  allergen: z.string().describe("What they are allergic to (e.g. Penicillin, Peanuts, Dust)"),
  reaction: z
    .string()
    .optional()
    .describe("What reaction occurs (e.g. rash, swelling, anaphylaxis)"),
  severity: z
    .enum(["mild", "moderate", "severe"])
    .optional()
    .describe("Severity of the allergic reaction"),
});

export function createHealthTools(userId: string) {
  return {
    log_symptom: tool({
      description:
        "Log a symptom the user describes. Use when the user mentions any symptom, pain, discomfort, or physical complaint during conversation.",
      inputSchema: symptomInput,
      execute: async (input) => {
        const id = uuidv4();
        const [symptom] = await db
          .insert(symptoms)
          .values({ id, userId, name: input.name, severity: input.severity, duration: input.duration, bodyPart: input.bodyPart, notes: input.notes })
          .returning();
        return {
          success: true,
          type: "symptom" as const,
          message: `Logged symptom: ${input.name}`,
          data: { id: symptom.id, name: input.name, severity: input.severity, duration: input.duration, bodyPart: input.bodyPart },
        };
      },
    }),

    log_mood: tool({
      description:
        "Log the user's current mood and mental state. Use when the user talks about how they feel emotionally, their stress, anxiety, or general mood.",
      inputSchema: moodInput,
      execute: async (input) => {
        const id = uuidv4();
        const [mood] = await db
          .insert(moodLogs)
          .values({ id, userId, moodScore: input.moodScore, anxietyLevel: input.anxietyLevel, journalEntry: input.journalEntry, triggers: input.triggers || [] })
          .returning();
        return {
          success: true,
          type: "mood" as const,
          message: `Logged mood${input.moodScore ? `: ${input.moodScore}/10` : ""}`,
          data: { id: mood.id, moodScore: input.moodScore, anxietyLevel: input.anxietyLevel },
        };
      },
    }),

    log_medication: tool({
      description:
        "Add a medication the user is taking or that you are prescribing/recommending. Use when the user mentions they are on a medication or when you recommend one.",
      inputSchema: medicationInput,
      execute: async (input) => {
        const id = uuidv4();
        const [med] = await db
          .insert(medications)
          .values({ id, userId, name: input.name, dosage: input.dosage, frequency: input.frequency, notes: input.notes, active: true })
          .returning();
        return {
          success: true,
          type: "medication" as const,
          message: `Added medication: ${input.name} ${input.dosage}`,
          data: { id: med.id, name: input.name, dosage: input.dosage, frequency: input.frequency },
        };
      },
    }),

    schedule_appointment: tool({
      description:
        "Schedule a doctor appointment for the user. Use when the user wants to book a visit or you recommend they see a specialist.",
      inputSchema: appointmentInput,
      execute: async (input) => {
        const id = uuidv4();
        const [appt] = await db
          .insert(appointments)
          .values({
            id,
            userId,
            doctorName: input.doctorName,
            specialty: input.specialty,
            date: new Date(input.date),
            time: input.time,
            reason: input.reason,
            status: "scheduled",
          })
          .returning();
        return {
          success: true,
          type: "appointment" as const,
          message: `Scheduled appointment with ${input.doctorName} on ${input.date}`,
          data: { id: appt.id, doctorName: input.doctorName, specialty: input.specialty, date: input.date, time: input.time },
        };
      },
    }),

    record_allergy: tool({
      description:
        "Record an allergy the user mentions. Use when the user says they are allergic to something.",
      inputSchema: allergyInput,
      execute: async (input) => {
        const id = uuidv4();
        const [allergy] = await db
          .insert(allergies)
          .values({ id, userId, allergen: input.allergen, reaction: input.reaction, severity: input.severity })
          .returning();
        return {
          success: true,
          type: "allergy" as const,
          message: `Recorded allergy: ${input.allergen}`,
          data: { id: allergy.id, allergen: input.allergen, reaction: input.reaction, severity: input.severity },
        };
      },
    }),
  };
}
