import express from "express";
import { chatApi } from "./api/chat.api";

const router = express.Router();

// Direct route registration for streaming endpoints
router.post('/chat', (req, res, next) => {
  console.log('🔥 Chat route hit!', req.path, req.method);
  next();
}, chatApi);

export default router;