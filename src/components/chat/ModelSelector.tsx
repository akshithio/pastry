import { ChevronDown } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  MODEL_CONFIG,
  type ModelName,
  getCapabilityIcons,
} from "~/model_config";

interface ModelSelectorProps {
  selectedModel: ModelName;
  onModelSelect: (model: ModelName) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelSelect,
}) => {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target as Node)
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

  return (
    <div className="relative" ref={modelDropdownRef}>
      <button
        type="button"
        onClick={() => setShowModelDropdown(!showModelDropdown)}
        className="flex items-center gap-2 px-2 py-1 text-[#4C5461]/70 transition-colors hover:bg-[rgba(5,81,206,0.05)] hover:text-[#0551CE] dark:text-[#B0B7C3]/70 dark:hover:bg-[rgba(255,255,255,0.05)] dark:hover:text-[#5B9BD5]"
      >
        <span>{selectedModel}</span>
        <div className="flex gap-1">
          {getCapabilityIcons(selectedModel).map((icon, i) => (
            <span key={i} className="text-xs">
              {icon}
            </span>
          ))}
        </div>
        <ChevronDown className="h-3 w-3" />
      </button>

      {showModelDropdown && (
        <div className="auth-clean-shadow absolute bottom-full left-0 mb-2 min-w-[200px] border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
          {Object.entries(MODEL_CONFIG).map(([model, config]) => (
            <button
              key={model}
              type="button"
              onClick={() => {
                onModelSelect(model as ModelName);
                setShowModelDropdown(false);
              }}
              className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[rgba(5,81,206,0.12)] dark:hover:bg-[rgba(255,255,255,0.12)] ${selectedModel === model ? "font-medium" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span>{model}</span>
                <div className="flex gap-1">
                  {config.capabilities.reasoning && (
                    <span title="Advanced Reasoning">🧠</span>
                  )}
                  {config.capabilities.vision && (
                    <span title="Vision Capabilities">👁️</span>
                  )}
                  {config.capabilities.documents && (
                    <span title="Document Analysis">📄</span>
                  )}
                  {config.capabilities.webSearch && (
                    <span title="Web Search">🌐</span>
                  )}
                </div>
              </div>
              <div className="mt-1 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                {config.provider} • {config.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
