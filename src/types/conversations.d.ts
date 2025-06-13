export type Conversation = {
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

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
