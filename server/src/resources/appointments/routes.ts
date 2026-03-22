import express from "express";
import { wrapHandler } from "@/lib/wrapHandler";
import {
  createAppointment,
  getAppointments,
  getUpcomingAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  addAppointmentNotes,
} from "./api/appointments.api";

const router = express.Router();

router.post("/", wrapHandler(createAppointment));
router.get("/", wrapHandler(getAppointments));
router.get("/upcoming", wrapHandler(getUpcomingAppointments));
router.get("/:id", wrapHandler(getAppointmentById));
router.put("/:id", wrapHandler(updateAppointment));
router.delete("/:id", wrapHandler(deleteAppointment));
router.post("/:id/notes", wrapHandler(addAppointmentNotes));

export default router;
