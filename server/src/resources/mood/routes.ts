import express from "express";
import { wrapHandler } from "@/lib/wrapHandler";
import {
  createMoodLog,
  getMoodLogs,
  getMoodTrends,
  getLatestMood,
  updateMoodLog,
  deleteMoodLog,
} from "./api/mood.api";

const router = express.Router();

router.post("/", wrapHandler(createMoodLog));
router.get("/", wrapHandler(getMoodLogs));
router.get("/trends", wrapHandler(getMoodTrends));
router.get("/latest", wrapHandler(getLatestMood));
router.put("/:id", wrapHandler(updateMoodLog));
router.delete("/:id", wrapHandler(deleteMoodLog));

export default router;
