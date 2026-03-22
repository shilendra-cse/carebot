import axios from "axios";

export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (typeof msg === "string" && msg) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
