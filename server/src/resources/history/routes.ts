import express from "express";
import { wrapHandler } from "@/lib/wrapHandler";
import {
  createHistoryEntry,
  getHistory,
  updateHistoryEntry,
  deleteHistoryEntry,
  createAllergy,
  getAllergies,
  deleteAllergy,
} from "./api/history.api";

const router = express.Router();

router.post("/", wrapHandler(createHistoryEntry));
router.get("/", wrapHandler(getHistory));
router.put("/:id", wrapHandler(updateHistoryEntry));
router.delete("/:id", wrapHandler(deleteHistoryEntry));

export default router;

export const allergyRoutes = express.Router();

allergyRoutes.post("/", wrapHandler(createAllergy));
allergyRoutes.get("/", wrapHandler(getAllergies));
allergyRoutes.delete("/:id", wrapHandler(deleteAllergy));
