import express from "express";
import { chatApi, listChats, getChatById, deleteChat } from "./api/chat.api";
import { wrapHandler } from "@/lib/wrapHandler.js";

const router = express.Router();

router.get("/", wrapHandler(listChats));
router.get("/:id", wrapHandler(getChatById));
router.post("/", chatApi);
router.delete("/:id", wrapHandler(deleteChat));

export default router;
