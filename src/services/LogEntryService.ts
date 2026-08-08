import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { logEntryRepository } from "@/repositories/LogEntryRepository";
import type { LogType } from "@/lib/types";

interface LogParams {
  category: string;
  message: string;
  userId?: string | null;
  realtorId?: string | null;
  dataFrom?: Record<string, unknown> | null;
  dataTo?: Record<string, unknown> | null;
}

/**
 * Writes a LogEntry for an action. See CLAUDE.md → "Logging (LogEntry)" — every route that
 * mutates data or handles auth is expected to call one of these. Logging is best-effort: a
 * failure here is caught and swallowed so it can never break the action being logged.
 */
export class LogEntryService {
  static async list(page = 1, pageSize = 100) {
    await connectDB();
    return logEntryRepository.findPaginated({}, page, pageSize);
  }

  private static async write(logType: LogType, params: LogParams) {
    try {
      await connectDB();
      await logEntryRepository.create({
        logType,
        category: params.category,
        message: params.message,
        userId: params.userId ? new mongoose.Types.ObjectId(params.userId) : null,
        realtorId: params.realtorId ? new mongoose.Types.ObjectId(params.realtorId) : null,
        dataFrom: params.dataFrom ?? null,
        dataTo: params.dataTo ?? null,
      });
    } catch (error) {
      console.error("Failed to write log entry", error);
    }
  }

  static info(params: LogParams) {
    return this.write("Information", params);
  }

  static warning(params: LogParams) {
    return this.write("Warning", params);
  }

  static error(params: LogParams) {
    return this.write("Error", params);
  }
}
