import { MessageForm, type IMessageForm } from "@/models/MessageForm";
import { BaseRepository } from "./BaseRepository";

class MessageFormRepository extends BaseRepository<IMessageForm> {
  constructor() {
    super(MessageForm);
  }

  findByRealtorId(realtorId: string) {
    return this.model.find({ realtorId }).sort({ createdAt: -1 }).exec();
  }

  findByGuid(guid: string) {
    return this.model.findOne({ guid }).exec();
  }
}

export const messageFormRepository = new MessageFormRepository();
