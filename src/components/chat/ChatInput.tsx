"use client";

import {
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Send,
  StopCircle,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import {
  MODEL_CONFIG,
  type ModelName,
  getCapabilityIcons,
} from "~/model_config";
import { saans } from "~/utils/fonts";

interface Attachment {
  name: string;
  contentType: string;
  url: string;
}

interface AttachmentFile {
  id: string;
  file: File;
  type: "image" | "pdf";
  preview?: string;
  name: string;
  size: number;
}

interface ChatInputProps {
  message: string;
  onMessageChange: (
    message: string | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onSendMessage: (e?: React.FormEvent, attachments?: Attachment[]) => void;
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
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [attachmentFiles, setAttachmentFiles] = useState<AttachmentFile[]>(
      [],
    );
    const [dragOver, setDragOver] = useState(false);
    const modelDropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const convertToAISDKAttachments = (
      files: AttachmentFile[],
    ): Attachment[] => {
      return files
        .filter((file) => file.preview)
        .map((file) => ({
          name: file.name,
          contentType: file.file.type,
          url: file.preview!,
        }));
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          modelDropdownRef.current &&
          !modelDropdownRef.current.contains(event.target as Node)
        ) {
          setShowModelDropdown(false);
        }
      };

      if (showModelDropdown) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [showModelDropdown]);

    const getTotalAttachmentSize = (
      currentAttachments: AttachmentFile[] = attachmentFiles,
    ): number => {
      return currentAttachments.reduce(
        (total, attachment) => total + attachment.size,
        0,
      );
    };

    const validateFile = (
      file: File,
      currentAttachments: AttachmentFile[] = attachmentFiles,
    ): string | null => {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "text/csv",
        "application/json",
      ];

      if (!validTypes.includes(file.type)) {
        return "Only images (JPEG, PNG, GIF, WebP), PDFs, and text files are supported.";
      }

      const currentTotalSize = getTotalAttachmentSize(currentAttachments);
      const maxTotalSizeBytes = maxTotalFileSize * 1024 * 1024;

      if (currentTotalSize + file.size > maxTotalSizeBytes) {
        const remainingSize = maxTotalSizeBytes - currentTotalSize;
        const remainingSizeMB = (remainingSize / (1024 * 1024)).toFixed(1);
        return `File too large. Total size limit is ${maxTotalFileSize}MB. You have ${remainingSizeMB}MB remaining.`;
      }

      return null;
    };

    const processFiles = async (fileList: FileList) => {
      const newAttachments: AttachmentFile[] = [];
      let currentAttachmentState = [...attachmentFiles];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const error = validateFile(file, currentAttachmentState);

        if (error) {
          alert(error);
          continue;
        }

        if (
          currentAttachmentState.length + newAttachments.length >=
          maxAttachments
        ) {
          alert(`Maximum ${maxAttachments} attachments allowed.`);
          break;
        }

        const attachment: AttachmentFile = {
          id: Date.now() + i + "",
          file: file!,
          type: file!.type.startsWith("image/") ? "image" : "pdf",
          name: file!.name,
          size: file!.size,
        };

        try {
          const preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file!);
          });
          attachment.preview = preview;
        } catch (error) {
          console.error("Error generating file preview:", error);
        }

        newAttachments.push(attachment);
        currentAttachmentState = [...currentAttachmentState, attachment];
      }

      setAttachmentFiles((prev) => [...prev, ...newAttachments]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        void processFiles(files);
      }
      e.target.value = "";
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        void processFiles(files);
      }
    };

    const removeAttachment = (id: string) => {
      setAttachmentFiles((prev) => prev.filter((att) => att.id !== id));
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const handleModelSelect = (model: ModelName) => {
      onModelSelect?.(model);
      setShowModelDropdown(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const aiSDKAttachments = convertToAISDKAttachments(attachmentFiles);
      onSendMessage(e, aiSDKAttachments);
      setAttachmentFiles([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (onKeyPress) {
        onKeyPress(e);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const aiSDKAttachments = convertToAISDKAttachments(attachmentFiles);
        onSendMessage(undefined, aiSDKAttachments);
        setAttachmentFiles([]);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (typeof onMessageChange === "function") {
        onMessageChange(e);
      }
    };

    const handleAttachClick = () => {
      fileInputRef.current?.click();
    };

    const modelSupportsAttachments = () => {
      if (attachmentFiles.length === 0) return true;

      const hasImages = attachmentFiles.some((att) => att.type === "image");
      const hasPDFs = attachmentFiles.some((att) => att.type === "pdf");

      const modelConfig = MODEL_CONFIG[selectedModel];

      if (hasImages && !modelConfig.capabilities.vision) return false;
      if (hasPDFs && !modelConfig.capabilities.documents) return false;

      return true;
    };

    const getAttachmentWarning = () => {
      if (attachmentFiles.length === 0) return null;

      const hasImages = attachmentFiles.some((att) => att.type === "image");
      const hasPDFs = attachmentFiles.some((att) => att.type === "pdf");

      const modelConfig = MODEL_CONFIG[selectedModel];

      if (hasImages && !modelConfig.capabilities.vision) {
        return "Selected model doesn't support image analysis. Images will not be sent to model.";
      }
      if (hasPDFs && !modelConfig.capabilities.documents) {
        return "Selected model doesn't support PDF analysis. Documents will not be sent to model.";
      }

      return null;
    };

    const totalSize = getTotalAttachmentSize();
    const totalSizeMB = totalSize / (1024 * 1024);
    const remainingMB = maxTotalFileSize - totalSizeMB;

    return (
      <div
        className={`p-0 ${saans.className} bg-[#F7F7F2]/80 font-medium backdrop-blur-sm dark:bg-[#1a1a1a]/80`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mx-auto max-w-3xl p-4">
          {getAttachmentWarning() && (
            <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
              ⚠️ {getAttachmentWarning()}
            </div>
          )}

          {attachmentFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                <span>
                  Attachments ({attachmentFiles.length}/{maxAttachments})
                </span>
                <span
                  className={`${totalSizeMB > maxTotalFileSize * 0.8 ? "text-yellow-600 dark:text-yellow-400" : ""}`}
                >
                  {formatFileSize(totalSize)} / {maxTotalFileSize}MB
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {attachmentFiles.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative flex items-center gap-2 border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-2 text-xs dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]"
                  >
                    {attachment.type === "image" ? (
                      <div className="flex items-center gap-2">
                        {attachment.preview && (
                          <Image
                            src={attachment.preview}
                            alt={attachment.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 object-cover"
                          />
                        )}
                        <ImageIcon className="h-4 w-4 text-[#0551CE] dark:text-[#5B9BD5]" />
                      </div>
                    ) : (
                      <FileText className="h-4 w-4 text-[#dc2626] dark:text-[#ef4444]" />
                    )}
                    <div className="flex flex-col">
                      <span className="max-w-[120px] truncate text-[#4C5461] dark:text-[#E5E5E5]">
                        {attachment.name}
                      </span>
                      <span className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                        {formatFileSize(attachment.size)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-1 -right-1 cursor-pointer bg-[#dc2626] p-1 text-white hover:bg-[#b91c1c] dark:bg-[#ef4444] dark:hover:bg-[#dc2626]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div
              className={`auth-clean-shadow border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] transition-all duration-200 focus-within:border-[#0551CE] focus-within:shadow-[0_4px_8px_rgba(5,81,206,0.15)] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:focus-within:border-[#5B9BD5] dark:focus-within:shadow-[0_4px_8px_rgba(91,155,213,0.15)] ${
                dragOver
                  ? "border-[#0551CE] bg-[rgba(5,81,206,0.05)] dark:border-[#5B9BD5] dark:bg-[rgba(91,155,213,0.05)]"
                  : ""
              }`}
            >
              <div className="relative">
                <textarea
                  ref={ref}
                  value={message}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className={`w-full resize-none bg-transparent p-3 pr-20 text-[#4C5461] transition-opacity duration-200 outline-none placeholder:text-[#4C5461]/40 dark:text-[#E5E5E5] dark:placeholder:text-[#B0B7C3]/40 ${
                    dragOver ? "opacity-30" : "opacity-100"
                  }`}
                  rows={Math.min(message.split("\n").length, 4)}
                  disabled={isLoading || disabled}
                />

                <div
                  className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${
                    dragOver ? "pointer-events-none opacity-0" : "opacity-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleAttachClick}
                    className="cursor-pointer border border-[rgba(5,81,206,0.3)] bg-transparent p-2 text-[#0551CE] shadow-[0_1px_3px_rgba(5,81,206,0.1)] transition-all duration-200 hover:bg-[rgba(5,81,206,0.05)] hover:shadow-[0_4px_8px_rgba(5,81,206,0.2)] disabled:opacity-50 dark:border-[rgba(255,255,255,0.3)] dark:text-[#5B9BD5] dark:shadow-[0_1px_3px_rgba(91,155,213,0.1)] dark:hover:bg-[rgba(255,255,255,0.05)] dark:hover:shadow-[0_4px_8px_rgba(91,155,213,0.2)]"
                    disabled={
                      isLoading ||
                      disabled ||
                      attachmentFiles.length >= maxAttachments ||
                      remainingMB <= 0
                    }
                    title={
                      remainingMB <= 0
                        ? `Total file size limit (${maxTotalFileSize}MB) reached`
                        : attachmentFiles.length >= maxAttachments
                          ? `Maximum ${maxAttachments} attachments`
                          : `Attach files (${remainingMB.toFixed(1)}MB remaining)`
                    }
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  {isLoading && onStopGeneration ? (
                    <button
                      type="button"
                      onClick={onStopGeneration}
                      className="cursor-pointer border border-[#0551CE] bg-[#0551CE] p-2 text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)] transition-all duration-200 hover:bg-[#044bb8] hover:shadow-[0_4px_8px_rgba(5,81,206,0.3)] disabled:opacity-50 dark:border-[#5B9BD5] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:shadow-[0_1px_3px_rgba(91,155,213,0.2)] dark:hover:bg-[#4A8BC7] dark:hover:shadow-[0_4px_8px_rgba(91,155,213,0.3)]"
                    >
                      <StopCircle className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        (!message.trim() && attachmentFiles.length === 0) ||
                        isLoading ||
                        disabled ||
                        !modelSupportsAttachments()
                      }
                      className="cursor-pointer border border-[#0551CE] bg-[#0551CE] p-2 text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)] transition-all duration-200 hover:bg-[#044bb8] hover:shadow-[0_4px_8px_rgba(5,81,206,0.3)] disabled:opacity-50 disabled:hover:bg-[#0551CE] disabled:hover:shadow-[0_1px_3px_rgba(5,81,206,0.2)] dark:border-[#5B9BD5] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:shadow-[0_1px_3px_rgba(91,155,213,0.2)] dark:hover:bg-[#4A8BC7] dark:hover:shadow-[0_4px_8px_rgba(91,155,213,0.3)] dark:disabled:hover:bg-[#5B9BD5] dark:disabled:hover:shadow-[0_1px_3px_rgba(91,155,213,0.2)]"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`flex items-center justify-between border-t border-[rgba(5,81,206,0.08)] px-3 py-3 text-xs text-[#4C5461]/70 transition-opacity duration-200 dark:border-[rgba(255,255,255,0.08)] dark:text-[#B0B7C3]/70 ${
                  dragOver ? "opacity-0" : "opacity-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  {showModelSelector && (
                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center gap-2 px-2 py-1 text-[#4C5461]/70 transition-colors hover:bg-[rgba(5,81,206,0.05)] hover:text-[#0551CE] dark:text-[#B0B7C3]/70 dark:hover:bg-[rgba(255,255,255,0.05)] dark:hover:text-[#5B9BD5]"
                      >
                        <span>{selectedModel}</span>
                        <div className="flex gap-1">
                          {getCapabilityIcons(selectedModel).map(
                            (icon, index) => (
                              <span key={index} className="text-xs">
                                {icon}
                              </span>
                            ),
                          )}
                        </div>
                        <ChevronDown className="h-3 w-3" />
                      </button>

                      {showModelDropdown && (
                        <div className="auth-clean-shadow absolute bottom-full left-0 mb-2 min-w-[200px] border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
                          {Object.keys(MODEL_CONFIG).map((model) => {
                            const modelConfig =
                              MODEL_CONFIG[model as ModelName];
                            const capabilities = modelConfig.capabilities;

                            return (
                              <button
                                key={model}
                                type="button"
                                onClick={() =>
                                  handleModelSelect(model as ModelName)
                                }
                                className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[rgba(5,81,206,0.12)] dark:hover:bg-[rgba(255,255,255,0.12)] ${
                                  selectedModel === model ? "font-medium" : ""
                                }`}
                                style={{
                                  color:
                                    selectedModel === model
                                      ? "var(--selected-color)"
                                      : "var(--text-color)",
                                  backgroundColor:
                                    selectedModel === model
                                      ? "var(--selected-bg)"
                                      : "transparent",
                                }}
                              >
                                <div
                                  style={
                                    {
                                      "--selected-color": "#0551CE",
                                      "--text-color": "#4C5461",
                                      "--selected-bg": "rgba(5,81,206,0.05)",
                                    } as React.CSSProperties & {
                                      "--selected-color": string;
                                      "--text-color": string;
                                      "--selected-bg": string;
                                    }
                                  }
                                  className="dark:[--selected-bg:rgba(91,155,213,0.05)] dark:[--selected-color:#5B9BD5] dark:[--text-color:#E5E5E5]"
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{model}</span>
                                    <div className="flex gap-1">
                                      {capabilities.reasoning && (
                                        <span title="Advanced Reasoning">
                                          🧠
                                        </span>
                                      )}
                                      {capabilities.vision && (
                                        <span title="Vision Capabilities">
                                          👁️
                                        </span>
                                      )}
                                      {capabilities.documents && (
                                        <span title="Document Analysis">
                                          📄
                                        </span>
                                      )}
                                      {capabilities.webSearch && (
                                        <span title="Web Search">🌐</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-1 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                                    {modelConfig.provider} •{" "}
                                    {modelConfig.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {!showModelSelector && (
                    <div className="flex items-center gap-2">
                      <span>{selectedModel}</span>
                      <div className="flex gap-1">
                        {getCapabilityIcons(selectedModel).map(
                          (icon, index) => (
                            <span key={index} className="text-xs">
                              {icon}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {attachmentFiles.length > 0 && (
                    <span className="text-[#0551CE] dark:text-[#5B9BD5]">
                      {attachmentFiles.length} file
                      {attachmentFiles.length !== 1 ? "s" : ""} attached
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="cursor-pointer p-1 text-[#4C5461]/70 transition-colors hover:bg-[rgba(5,81,206,0.05)] hover:text-[#0551CE] dark:text-[#B0B7C3]/70 dark:hover:bg-[rgba(255,255,255,0.05)] dark:hover:text-[#5B9BD5]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {dragOver && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center border-2 border-dashed border-[#0551CE] bg-[rgba(5,81,206,0.08)] backdrop-blur-sm dark:border-[#5B9BD5] dark:bg-[rgba(91,155,213,0.08)]">
                <div className="flex items-center justify-center text-[#0551CE] dark:text-[#5B9BD5]">
                  <Paperclip className="h-4 w-4" />
                  <span className="ml-2 text-base font-medium">
                    Drop files here
                  </span>
                </div>
                <span className="ml-2 text-[12px] font-medium">
                  [Images and PDFs Supported - {remainingMB.toFixed(1)}MB
                  remaining]
                </span>
              </div>
            )}
          </form>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.csv,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    );
  },
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
export { MODEL_CONFIG, type Attachment, type AttachmentFile, type ModelName };
