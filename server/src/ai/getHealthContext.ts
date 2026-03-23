import { db } from "@/db/index.js";
import { user } from "@/db/schema/auth-schema.js";
import { symptoms } from "@/db/schema/symptoms-schema.js";
import { medications } from "@/db/schema/medications-schema.js";
import { appointments } from "@/db/schema/appointments-schema.js";
import { moodLogs } from "@/db/schema/mood-schema.js";
import { medicalHistory, allergies } from "@/db/schema/medical-history-schema.js";
import { eq, desc, and, gte } from "drizzle-orm";

export interface UserProfile {
  dateOfBirth: Date | null;
  gender: string | null;
  height: string | null;
  weight: string | null;
  bloodType: string | null;
}

export interface HealthContext {
  profile: UserProfile | null;
  symptoms: any[];
  medications: any[];
  appointments: any[];
  mood: any[];
  history: any[];
  allergies: any[];
}

export async function getUserHealthContext(userId: string): Promise<HealthContext> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [userProfile, userSymptoms, userMedications, userAppointments, userMood, userHistory, userAllergies] = await Promise.all([
    db.select({
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      bloodType: user.bloodType,
    }).from(user).where(eq(user.id, userId)).limit(1),
    db.select().from(symptoms).where(eq(symptoms.userId, userId)).orderBy(desc(symptoms.createdAt)).limit(20),
    db.select().from(medications).where(eq(medications.userId, userId)).orderBy(desc(medications.createdAt)),
    db.select().from(appointments).where(
      and(
        eq(appointments.userId, userId),
        gte(appointments.date, thirtyDaysAgo)
      )
    ).orderBy(desc(appointments.date)),
    db.select().from(moodLogs).where(eq(moodLogs.userId, userId)).orderBy(desc(moodLogs.createdAt)).limit(30),
    db.select().from(medicalHistory).where(eq(medicalHistory.userId, userId)).orderBy(desc(medicalHistory.createdAt)),
    db.select().from(allergies).where(eq(allergies.userId, userId)),
  ]);

  return {
    profile: userProfile[0] || null,
    symptoms: userSymptoms,
    medications: userMedications,
    appointments: userAppointments,
    mood: userMood,
    history: userHistory,
    allergies: userAllergies,
  };
}

export function formatHealthContext(context: HealthContext): string {
  let contextText = "\n\n=== USER HEALTH DATA ===\n";

  if (context.profile) {
    const p = context.profile;
    const parts: string[] = [];
    if (p.gender) parts.push(`Gender: ${p.gender}`);
    if (p.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      parts.push(`Age: ${age}`);
    }
    if (p.height) parts.push(`Height: ${p.height}`);
    if (p.weight) parts.push(`Weight: ${p.weight}`);
    if (p.bloodType) parts.push(`Blood Type: ${p.bloodType}`);
    if (parts.length > 0) {
      contextText += "\nPATIENT PROFILE:\n";
      parts.forEach(part => { contextText += `- ${part}\n`; });
    }
  }

  if (context.allergies.length > 0) {
    contextText += "\nALLERGIES:\n";
    context.allergies.forEach(a => {
      contextText += `- ${a.allergen} (${a.severity || 'unknown severity'}) - ${a.reaction || 'no reaction details'}\n`;
    });
  }

  if (context.medications.length > 0) {
    contextText += "\nCURRENT MEDICATIONS:\n";
    context.medications.filter(m => m.active).forEach(m => {
      contextText += `- ${m.name} ${m.dosage} (${m.frequency})\n`;
    });
  }

  if (context.symptoms.length > 0) {
    contextText += "\nRECENT SYMPTOMS (last 30 days):\n";
    context.symptoms.slice(0, 10).forEach(s => {
      contextText += `- ${s.name} - Severity: ${s.severity || 'not specified'}/10, Duration: ${s.duration || 'not specified'}\n`;
    });
  }

  if (context.mood.length > 0) {
    contextText += "\nMOOD RECENT ENTRIES:\n";
    context.mood.slice(0, 7).forEach(m => {
      contextText += `- ${new Date(m.createdAt).toLocaleDateString()}: Mood ${m.moodScore || 'N/A'}/10, Anxiety: ${m.anxietyLevel || 'N/A'}/10\n`;
    });
  }

  if (context.history.length > 0) {
    contextText += "\nMEDICAL HISTORY:\n";
    context.history.forEach(h => {
      contextText += `- ${h.condition} (${h.diagnosisDate ? new Date(h.diagnosisDate).toLocaleDateString() : 'date unknown'})\n`;
    });
  }

  if (context.appointments.length > 0) {
    contextText += "\nUPCOMING/PRECEDING APPOINTMENTS:\n";
    context.appointments.slice(0, 5).forEach(a => {
      contextText += `- ${a.doctorName} (${a.specialty || 'General'}) on ${new Date(a.date).toLocaleDateString()}\n`;
    });
  }

  contextText += "\n=== END HEALTH DATA ===\n";

  if (context.allergies.length === 0 && context.medications.length === 0 && 
      context.symptoms.length === 0 && context.mood.length === 0) {
    contextText = "\n\n(No health data recorded yet. User is new.)\n";
  }

  return contextText;
}
