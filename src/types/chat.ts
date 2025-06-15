import type { Message as AIMessage } from 'ai';

export interface Attachment {
  name?: string;
  contentType?: string;
  url: string;
  content?: string;  // For storing the actual text content of PDFs
  processedText?: string;
}

// Extend the AI SDK's Message type with our custom fields
export interface ExtendedMessage extends Omit<AIMessage, 'role' | 'content' | 'parts'> {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool';
  content: string;
  parts?: Array<{
                    type: 'text' | 'file' | 'tool-result' | 'tool-call' | 'data' | 'image' | 'reasoning' | 'tool-invocation' | 'source' | 'step-start';
    text?: string;
        file?: {
      url?: string;
      name?: string;
      mimeType?: string;
    };
    mimeType?: string;
    url?: string;
    name?: string;
  }>;
  attachments?: Attachment[];
  experimental_attachments?: Attachment[];
}

export function isExtendedMessage(message: unknown): message is ExtendedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'role' in message &&
    'content' in message &&
    (('attachments' in message && Array.isArray(message.attachments)) || 
     ('experimental_attachments' in message && Array.isArray(message.experimental_attachments)))
  );
}

export interface AttachmentFile {
  id: string;
  file: File;
  type: 'image' | 'pdf' | 'text' | 'other';
  preview?: string;
  name: string;
  size: number;
  isProcessing?: boolean;
  processedText?: string;
  error?: string;
}

// Helper type to safely access message content
type MessageContent = {
  content: string;
  attachments?: Attachment[];
  experimental_attachments?: Attachment[];
};

// Helper function to safely get message content
export function getMessageContent(message: AIMessage | ExtendedMessage | MessageContent | string): string {
  if (typeof message === 'string') return message;
  return message.content || '';
}

// Helper function to safely get message attachments
export function getMessageAttachments(
  message: ExtendedMessage | MessageContent
): Attachment[] {
  if ('attachments' in message && message.attachments) {
    return message.attachments;
  }
  if ('experimental_attachments' in message && message.experimental_attachments) {
    return message.experimental_attachments;
  }
  return [];
}

// Helper function to create a new ExtendedMessage
export function createExtendedMessage(
  message: Partial<ExtendedMessage> & Pick<ExtendedMessage, 'role' | 'content'>
): ExtendedMessage {
  return {
    id: message.id ?? `msg_${Date.now()}`,
    ...message,
  };
}
