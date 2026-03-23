import express from "express";
import { signup, signin, getMe, completeOnboarding } from "./api/auth.api";
import { protect } from "@/middleware/auth";
import { wrapHandler } from "@/lib/wrapHandler";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/me", protect, getMe);
router.post("/onboarding", protect, wrapHandler(completeOnboarding));

export default router;
