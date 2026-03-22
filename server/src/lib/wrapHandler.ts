import { Response } from "express";
import { ApiResponse } from "@/types/base.types";

type HandlerFn = (req: any, res: Response) => Promise<ApiResponse>;

export function wrapHandler(fn: HandlerFn) {
  return async (req: any, res: Response) => {
    try {
      const result = await fn(req, res);
      res.status(result.status).json(result);
    } catch (error) {
      console.error("Handler error:", error);
      res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        type: "error",
      });
    }
  };
}
