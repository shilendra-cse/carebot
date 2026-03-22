import express from "express";
import { wrapHandler } from "@/lib/wrapHandler";
import {
  createMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  logMedicationDose,
  getTodayMedications,
} from "./api/medications.api";

const router = express.Router();

router.post("/", wrapHandler(createMedication));
router.get("/", wrapHandler(getMedications));
router.get("/today", wrapHandler(getTodayMedications));
router.get("/:id", wrapHandler(getMedicationById));
router.put("/:id", wrapHandler(updateMedication));
router.delete("/:id", wrapHandler(deleteMedication));
router.post("/:id/log", wrapHandler(logMedicationDose));

export default router;
