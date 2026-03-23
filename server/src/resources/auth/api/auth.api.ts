import { Request, Response } from "express";
import { db } from "@/db/index.js";
import { user } from "@/db/schema/auth-schema.js";
import { medicalHistory, allergies } from "@/db/schema/medical-history-schema.js";
import { medications } from "@/db/schema/medications-schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt.js";
import { AuthenticatedRequest } from "@/types/base.types.js";

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({
        status: 400,
        message: "Password must be at least 6 characters",
        type: "error",
      });
      return;
    }

    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existing) {
      res.status(409).json({
        status: 409,
        message: "An account with this email already exists",
        type: "error",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const [newUser] = await db
      .insert(user)
      .values({ id, name, email, password: hashedPassword })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
      });

    const token = signToken({ id: newUser.id, email: newUser.email, name: newUser.name });

    res.status(201).json({
      status: 201,
      message: "Account created successfully",
      data: { token, user: newUser },
      type: "success",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      status: 500,
      message: "Failed to create account",
      type: "error",
    });
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: 400,
        message: "Email and password are required",
        type: "error",
      });
      return;
    }

    const [found] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!found || !found.password) {
      res.status(401).json({
        status: 401,
        message: "Invalid email or password",
        type: "error",
      });
      return;
    }

    const valid = await bcrypt.compare(password, found.password);
    if (!valid) {
      res.status(401).json({
        status: 401,
        message: "Invalid email or password",
        type: "error",
      });
      return;
    }

    const token = signToken({ id: found.id, email: found.email, name: found.name });

    res.json({
      status: 200,
      message: "Signed in successfully",
      data: {
        token,
        user: {
          id: found.id,
          name: found.name,
          email: found.email,
          onboardingCompleted: found.onboardingCompleted,
        },
      },
      type: "success",
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      status: 500,
      message: "Failed to sign in",
      type: "error",
    });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [found] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!found) {
      res.status(404).json({
        status: 404,
        message: "User not found",
        type: "error",
      });
      return;
    }

    res.json({
      status: 200,
      message: "User retrieved successfully",
      data: found,
      type: "success",
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      status: 500,
      message: "Failed to get user",
      type: "error",
    });
  }
};

export const completeOnboarding = async (req: any, _res: Response): Promise<any> => {
  try {
    const userId = req.user.id;
    const { profile, conditions, meds, userAllergies } = req.body;

    const profileUpdate: Record<string, unknown> = {
      onboardingCompleted: true,
    };
    if (profile) {
      if (profile.dateOfBirth) profileUpdate.dateOfBirth = new Date(profile.dateOfBirth);
      if (profile.gender) profileUpdate.gender = profile.gender;
      if (profile.height) profileUpdate.height = profile.height;
      if (profile.weight) profileUpdate.weight = profile.weight;
      if (profile.bloodType) profileUpdate.bloodType = profile.bloodType;
    }

    await db.update(user).set(profileUpdate).where(eq(user.id, userId));

    if (Array.isArray(conditions) && conditions.length > 0) {
      const rows = conditions
        .filter((c: any) => c.condition?.trim())
        .map((c: any) => ({
          id: uuidv4(),
          userId,
          condition: c.condition.trim(),
          treatment: c.treatment?.trim() || null,
          notes: c.notes?.trim() || null,
          diagnosisDate: c.diagnosisDate ? new Date(c.diagnosisDate) : null,
        }));
      if (rows.length > 0) {
        await db.insert(medicalHistory).values(rows);
      }
    }

    if (Array.isArray(meds) && meds.length > 0) {
      const rows = meds
        .filter((m: any) => m.name?.trim() && m.dosage?.trim() && m.frequency?.trim())
        .map((m: any) => ({
          id: uuidv4(),
          userId,
          name: m.name.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim(),
          notes: m.notes?.trim() || null,
          times: [],
          active: true,
        }));
      if (rows.length > 0) {
        await db.insert(medications).values(rows);
      }
    }

    if (Array.isArray(userAllergies) && userAllergies.length > 0) {
      const rows = userAllergies
        .filter((a: any) => a.allergen?.trim())
        .map((a: any) => ({
          id: uuidv4(),
          userId,
          allergen: a.allergen.trim(),
          reaction: a.reaction?.trim() || null,
          severity: a.severity?.trim() || null,
        }));
      if (rows.length > 0) {
        await db.insert(allergies).values(rows);
      }
    }

    const [updated] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      status: 200,
      message: "Onboarding completed successfully",
      data: updated,
      type: "success",
    };
  } catch (error) {
    console.error("Onboarding error:", error);
    return {
      status: 500,
      message: "Failed to complete onboarding",
      type: "error",
    };
  }
};
