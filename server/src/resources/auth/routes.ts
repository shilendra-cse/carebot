import express from "express";
import { signup, signin, getMe } from "./api/auth.api";
import { protect } from "@/middleware/auth";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/me", protect, getMe);

export default router;
