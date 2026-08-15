import { Message, type IMessage } from "@/models/Message";
import { BaseRepository } from "./BaseRepository";

class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
    super(Message);
  }
}

export const messageRepository = new MessageRepository();
