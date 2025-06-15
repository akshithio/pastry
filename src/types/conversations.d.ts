import { type Message } from "ai";

export type Conversation = {
  messages: Message[];
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isBranched?: boolean;
  isPublic?: boolean;
  model: string;
};

// this type is wrong hehe
export type Message = {
  experimental_attachments: any;
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
};
