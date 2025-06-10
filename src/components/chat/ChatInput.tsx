"use client";

import { ChevronDown, Plus, Send, StopCircle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { saans } from "~/utils/fonts";

const MODEL_CONFIG = {
  "Gemini 2.0 Flash": { provider: "gemini" as const },
  "Pixtral 12B": { provider: "mistral" as const },
};

type ModelName = keyof typeof MODEL_CONFIG;

interface ChatInputProps {
  message: string;
  onMessageChange: (
    message: string | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  selectedModel?: ModelName;
  onModelSelect?: (model: ModelName) => void;
  showModelSelector?: boolean;
  onStopGeneration?: () => void;
  placeholder?: string;
  disabled?: boolean;
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
    },
    ref,
  ) => {
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

    // Handle model dropdown click outside
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

    const handleModelSelect = (model: ModelName) => {
      onModelSelect?.(model);
      setShowModelDropdown(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSendMessage(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (onKeyPress) {
        onKeyPress(e);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSendMessage();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Check if onMessageChange expects an event object or a string
      // For useChat's handleInputChange, pass the event object
      // For simple string handlers, pass e.target.value
      if (typeof onMessageChange === "function") {
        // Try to determine if it expects an event or string by checking the function
        // Since we can't reliably detect this, we'll pass the event object
        // and let the parent handle it appropriately
        onMessageChange(e);
      }
    };

    return (
      <div
        className={`border-t p-4 ${saans.className} bg-[#F7F7F2]/80 font-medium backdrop-blur-sm`}
        style={{ borderColor: "rgba(5,81,206,0.12)" }}
      >
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <textarea
                ref={ref}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="auth-clean-shadow w-full resize-none border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 pr-12 text-[#4C5461] transition-all duration-200 outline-none focus:border-[#0551CE] focus:shadow-[0_4px_8px_rgba(5,81,206,0.15)]"
                rows={Math.min(message.split("\n").length, 4)}
                disabled={isLoading || disabled}
              />
              <div className="absolute top-2 right-2 flex gap-1">
                {isLoading && onStopGeneration ? (
                  <button
                    type="button"
                    onClick={onStopGeneration}
                    className="-mt-[2px] border border-[#0551CE] bg-[#0551CE] p-2 text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)] transition-all duration-200 hover:bg-[#044bb8] hover:shadow-[0_4px_8px_rgba(5,81,206,0.3)] disabled:opacity-50"
                  >
                    <StopCircle className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!message.trim() || isLoading || disabled}
                    className="-mt-[2px] border border-[#0551CE] bg-[#0551CE] p-2 text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)] transition-all duration-200 hover:bg-[#044bb8] hover:shadow-[0_4px_8px_rgba(5,81,206,0.3)] disabled:opacity-50 disabled:hover:bg-[#0551CE] disabled:hover:shadow-[0_1px_3px_rgba(5,81,206,0.2)]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#4C5461]/70">
              <div className="flex items-center gap-4">
                {showModelSelector && (
                  <div className="relative" ref={modelDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      className="flex items-center gap-1 rounded p-1 text-[#4C5461]/70 transition-colors hover:text-[#0551CE]"
                    >
                      <span>{selectedModel}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    {showModelDropdown && (
                      <div className="auth-clean-shadow absolute bottom-full left-0 mb-2 min-w-[180px] rounded border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2]">
                        {Object.keys(MODEL_CONFIG).map((model) => (
                          <button
                            key={model}
                            type="button"
                            onClick={() =>
                              handleModelSelect(model as ModelName)
                            }
                            className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[rgba(5,81,206,0.12)] ${
                              selectedModel === model ? "font-medium" : ""
                            }`}
                            style={{
                              color:
                                selectedModel === model ? "#0551CE" : "#4C5461",
                              backgroundColor:
                                selectedModel === model
                                  ? "rgba(5,81,206,0.05)"
                                  : "transparent",
                            }}
                          >
                            {model}
                            <div className="text-xs text-[#4C5461]/70">
                              {MODEL_CONFIG[model as ModelName].provider}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!showModelSelector && <span>{selectedModel}</span>}
              </div>
              <button
                type="button"
                className="cursor-pointer rounded p-1 text-[#4C5461]/70 transition-colors hover:text-[#0551CE]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  },
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
export { MODEL_CONFIG, type ModelName };
