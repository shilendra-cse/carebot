import { z } from "zod";

const score1to10 = z.number().int().min(1).max(10);

export const createSymptomSchema = z.object({
  name: z.string().min(1),
  severity: score1to10.optional(),
  duration: z.string().optional(),
  bodyPart: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSymptomSchema = z.object({
  name: z.string().optional(),
  severity: score1to10.optional(),
  duration: z.string().optional(),
  bodyPart: z.string().optional(),
  notes: z.string().optional(),
  analyzed: z.boolean().optional(),
  analysisResult: z.string().optional(),
});

export const createMedicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  times: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateMedicationSchema = z.object({
  name: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  times: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});

export const logMedicationDoseSchema = z.object({
  taken: z.boolean().optional(),
  takenAt: z.string().optional(),
  skipped: z.boolean().optional(),
  notes: z.string().optional(),
});

export const createAppointmentSchema = z.object({
  doctorName: z.string().min(1),
  specialty: z.string().optional(),
  date: z.string().min(1),
  time: z.string().optional(),
  location: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
});

export const updateAppointmentSchema = z.object({
  doctorName: z.string().optional(),
  specialty: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

export const addAppointmentNotesSchema = z.object({
  notes: z.string().optional(),
});

export const createMoodLogSchema = z.object({
  moodScore: score1to10.optional(),
  anxietyLevel: score1to10.optional(),
  journalEntry: z.string().optional(),
  triggers: z.array(z.string()).optional(),
});

export const updateMoodLogSchema = z.object({
  moodScore: score1to10.optional(),
  anxietyLevel: score1to10.optional(),
  journalEntry: z.string().optional(),
  triggers: z.array(z.string()).optional(),
});

export const createHistorySchema = z.object({
  condition: z.string().min(1),
  diagnosisDate: z.string().optional(),
  treatment: z.string().optional(),
  doctor: z.string().optional(),
  notes: z.string().optional(),
});

export const updateHistorySchema = z.object({
  condition: z.string().optional(),
  diagnosisDate: z.string().optional(),
  treatment: z.string().optional(),
  doctor: z.string().optional(),
  notes: z.string().optional(),
});

export const createAllergySchema = z.object({
  allergen: z.string().min(1),
  reaction: z.string().optional(),
  severity: z.string().optional(),
});

export function validate<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const error = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return { success: false, error };
  }
  return { success: true, data: result.data };
}
