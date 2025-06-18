"use client";

import { Globe, Plus, Send, StopCircle } from "lucide-react";
import React, { useRef, useState } from "react";
import AttachmentDropZone from "~/components/chat/AttachmentDropZone";
import AttachmentPreview from "~/components/chat/AttachmentPreview";
import ModelSelector from "~/components/chat/ModelSelector";
import { useAttachmentProcessor } from "~/hooks/useAttachmentProcessor";
import { MODEL_CONFIG, type ModelName } from "~/model_config";
import type { Attachment } from "~/types/chat";
import { convertToAISDKAttachments } from "~/utils/attachmentUtils";
import { saans } from "~/utils/fonts";

interface ChatInputProps {
  message: string;
  onMessageChange: (
    message: string | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onSendMessage: (
    e?: React.FormEvent,
    options?: {
      experimental_attachments?: Attachment[];
    },
  ) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  selectedModel?: ModelName;
  onModelSelect?: (model: ModelName) => void;
  showModelSelector?: boolean;
  onStopGeneration?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxAttachments?: number;
  maxTotalFileSize?: number;
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  (
    {
      message,
      onMessageChange,
      onSendMessage,
      onKeyPress,
      isLoading,
      selectedModel = "Pixtral 12B",
      onModelSelect,
      showModelSelector = true,
      onStopGeneration,
      placeholder = "Type your message here...",
      disabled = false,
      maxAttachments = 5,
      maxTotalFileSize = 5,
    },
    ref,
  ) => {
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
      attachmentFiles,
      processFiles,
      removeAttachment,
      clearAttachments,
      getTotalSize,
    } = useAttachmentProcessor({
      maxAttachments,
      maxTotalFileSize,
    });

    const handleDrag = (e: React.DragEvent, over: boolean) => {
      e.preventDefault();
      setDragOver(over);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length > 0)
        void processFiles(e.dataTransfer.files);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoading) return;

      const processingPDF = attachmentFiles.some(
        (file) => file.type === "pdf" && file.isProcessing,
      );

      if (processingPDF) {
        alert("Please wait for PDFs to finish processing");
        return;
      }

      const failedPDFs = attachmentFiles.filter(
        (file) => file.type === "pdf" && file.error,
      );

      if (failedPDFs.length > 0) {
        alert(
          `Please fix or remove ${failedPDFs.length} failed PDF(s) before submitting`,
        );
        return;
      }

      if (message.trim() === "" && attachmentFiles.length === 0) return;

      try {
        const attachments = convertToAISDKAttachments(attachmentFiles);
        onSendMessage(e, { experimental_attachments: attachments });
        clearAttachments();

        if (typeof onMessageChange === "function") {
          onMessageChange("");
        }
      } catch (error) {
        console.error("Error submitting message:", error);
        alert("Failed to send message. Please try again.");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        if (!message.trim() && attachmentFiles.length === 0) {
          return;
        }

        const processingPDFs = attachmentFiles.filter((f) => f.isProcessing);
        if (processingPDFs.length > 0) {
          alert("Please wait for PDF files to finish processing.");
          return;
        }

        const aiSdkAttachments = convertToAISDKAttachments(attachmentFiles);

        console.log("ChatInput keydown submitting with:", {
          message,
          attachments: aiSdkAttachments,
          attachmentCount: aiSdkAttachments.length,
        });

        onSendMessage(undefined, {
          experimental_attachments:
            aiSdkAttachments.length > 0 ? aiSdkAttachments : undefined,
        });

        clearAttachments();

        if (typeof onMessageChange === "function") {
          onMessageChange("");
        }
      } else if (onKeyPress) {
        onKeyPress(e);
      }
    };

    const modelConfig = MODEL_CONFIG[selectedModel];
    const hasImages = attachmentFiles.some((f) => f.type === "image");
    const hasPDFs = attachmentFiles.some((f) => f.type === "pdf");
    const modelSupportsAttachments =
      (!hasImages || modelConfig.capabilities.vision) &&
      (!hasPDFs || modelConfig.capabilities.documents);
    const attachmentWarning =
      hasImages && !modelConfig.capabilities.vision
        ? "Selected model doesn't support image analysis."
        : hasPDFs && !modelConfig.capabilities.documents
          ? "Selected model doesn't support PDF analysis."
          : null;

    const totalSize = getTotalSize();
    const remainingMB = maxTotalFileSize - totalSize / (1024 * 1024);

    const inputClasses = `auth-clean-shadow border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] 
    transition-all duration-200 focus-within:border-[#0551CE] focus-within:shadow-[0_4px_8px_rgba(5,81,206,0.15)] 
    dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:focus-within:border-[#5B9BD5] 
    dark:focus-within:shadow-[0_4px_8px_rgba(91,155,213,0.15)] ${
      dragOver
        ? "border-[#0551CE] bg-[rgba(5,81,206,0.05)] dark:border-[#5B9BD5] dark:bg-[rgba(91,155,213,0.05)]"
        : ""
    }`;

    const buttonBase =
      "cursor-pointer p-2 transition-all duration-200 disabled:opacity-50";
    const primaryButton = `${buttonBase} border border-[#0551CE] bg-[#0551CE] text-[#F7F7F2] 
    shadow-[0_1px_3px_rgba(5,81,206,0.2)] hover:bg-[#044bb8] hover:shadow-[0_4px_8px_rgba(5,81,206,0.3)]
    dark:border-[#5B9BD5] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]`;
    const secondaryButton = `${buttonBase} border border-[rgba(5,81,206,0.3)] bg-transparent text-[#0551CE] 
    shadow-[0_1px_3px_rgba(5,81,206,0.1)] hover:bg-[rgba(5,81,206,0.05)]
    dark:border-[rgba(255,255,255,0.3)] dark:text-[#5B9BD5] dark:hover:bg-[rgba(255,255,255,0.05)]`;

    return (
      <div
        className={`p-0 ${saans.className} bg-[#F7F7F2]/80 font-medium backdrop-blur-sm dark:bg-[#1a1a1a]/80`}
        onDragOver={(e) => handleDrag(e, true)}
        onDragLeave={(e) => handleDrag(e, false)}
        onDrop={handleDrop}
      >
        <div className="mx-auto max-w-3xl p-4">
          {attachmentWarning && (
            <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
              ⚠️ {attachmentWarning}
            </div>
          )}

          <AttachmentPreview
            attachments={attachmentFiles}
            onRemove={removeAttachment}
            maxAttachments={maxAttachments}
            maxTotalFileSize={maxTotalFileSize}
          />

          <form onSubmit={handleSubmit} className="relative">
            <div className={inputClasses}>
              <div className="relative">
                <textarea
                  ref={ref}
                  value={message}
                  onChange={(e) =>
                    typeof onMessageChange === "function" && onMessageChange(e)
                  }
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className={`w-full resize-none bg-transparent p-3 pr-20 text-[#4C5461] transition-opacity duration-200 outline-none placeholder:text-[#4C5461]/40 dark:text-[#E5E5E5] dark:placeholder:text-[#B0B7C3]/40 ${dragOver ? "opacity-30" : "opacity-100"}`}
                  rows={Math.min(message.split("\n").length, 4)}
                  disabled={isLoading || disabled}
                />

                <div
                  className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${dragOver ? "pointer-events-none opacity-0" : "opacity-100"}`}
                >
                  {isLoading && onStopGeneration ? (
                    <button
                      type="button"
                      onClick={onStopGeneration}
                      className={primaryButton}
                    >
                      <StopCircle className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className={primaryButton}
                      disabled={
                        (!message.trim() && !attachmentFiles.length) ||
                        isLoading ||
                        disabled ||
                        !modelSupportsAttachments ||
                        attachmentFiles.some((f) => f.isProcessing)
                      }
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`flex items-center justify-between border-t border-[rgba(5,81,206,0.08)] px-3 py-3 text-xs text-[#4C5461]/70 transition-opacity duration-200 dark:border-[rgba(255,255,255,0.08)] dark:text-[#B0B7C3]/70 ${dragOver ? "opacity-0" : "opacity-100"}`}
              >
                <div className="flex items-center gap-4">
                  {showModelSelector && (
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelSelect={onModelSelect}
                    />
                  )}

                  <span className="flex items-center gap-1 text-[#0551CE] dark:text-[#5B9BD5]">
                    <Globe className="h-3 w-3" />
                    Web search enabled
                  </span>

                  {attachmentFiles.length > 0 && (
                    <span className="text-[#0551CE] dark:text-[#5B9BD5]">
                      {attachmentFiles.length} file
                      {attachmentFiles.length !== 1 ? "s" : ""} attached
                      {attachmentFiles.some((f) => f.isProcessing) &&
                        " (processing...)"}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer p-1 text-[#4C5461]/70 transition-colors hover:bg-[rgba(5,81,206,0.05)] hover:text-[#0551CE] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#B0B7C3]/70 dark:hover:text-[#5B9BD5]"
                  disabled={
                    isLoading ||
                    disabled ||
                    attachmentFiles.length >= maxAttachments ||
                    remainingMB <= 0
                  }
                  title={
                    remainingMB <= 0
                      ? `Total file size limit (${maxTotalFileSize}MB) reached`
                      : `Attach files (${remainingMB.toFixed(1)}MB remaining)`
                  }
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {dragOver && (
              <AttachmentDropZone
                remainingMB={remainingMB}
                maxTotalFileSize={maxTotalFileSize}
              />
            )}
          </form>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.csv,.json"
            onChange={(e) =>
              e.target.files?.length && processFiles(e.target.files)
            }
            className="hidden"
          />
        </div>
      </div>
    );
  },
);

ChatInput.displayName = "ChatInput";
export default ChatInput;
export { MODEL_CONFIG, type Attachment, type ModelName };
