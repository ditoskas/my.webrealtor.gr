import { LogEntry, type ILogEntry } from "@/models/LogEntry";
import { BaseRepository } from "./BaseRepository";

class LogEntryRepository extends BaseRepository<ILogEntry> {
  constructor() {
    super(LogEntry);
  }

  findByRealtorId(realtorId: string) {
    return this.model.find({ realtorId }).sort({ createdAt: -1 }).exec();
  }

  findByUserId(userId: string) {
    return this.model.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}

export const logEntryRepository = new LogEntryRepository();
