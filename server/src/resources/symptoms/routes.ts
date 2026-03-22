import express from "express";
import { wrapHandler } from "@/lib/wrapHandler";
import {
  createSymptom,
  getSymptoms,
  getSymptomById,
  updateSymptom,
  deleteSymptom,
  analyzeSymptom,
} from "./api/symptoms.api";

const router = express.Router();

router.post("/", wrapHandler(createSymptom));
router.get("/", wrapHandler(getSymptoms));
router.get("/:id", wrapHandler(getSymptomById));
router.put("/:id", wrapHandler(updateSymptom));
router.delete("/:id", wrapHandler(deleteSymptom));
router.post("/:id/analyze", wrapHandler(analyzeSymptom));

export default router;
