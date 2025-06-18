export const MODEL_CONFIG = {
  "Gemini 2.0 Flash": {
    provider: "google" as const,
    modelId: "models/gemini-2.0-flash-exp",
    displayName: "Gemini 2.0 Flash Experimental",
    capabilities: {
      reasoning: false,
      vision: true,
      documents: true,
      webSearch: false,
      tools: true,
    },
    description: "Google's experimental multimodal model (via OpenRouter)",
  }, // provided free of cost via google ai studio
  "Pixtral 12B": {
    provider: "mistral" as const,
    modelId: "pixtral-12b-2409",
    displayName: "Pixtral 12B",
    capabilities: {
      reasoning: false,
      vision: true,
      documents: true,
      webSearch: false,
      tools: true,
    },
    description: "Mistral's multimodal model with vision capabilities (via Mistral)",
  }, // provided free of cost via mistral
  "Llama 3.1 8B": {
    provider: "openrouter" as const,
    modelId: "meta-llama/llama-3.1-8b-instruct:free",
    displayName: "Llama 3.1 8B",
    capabilities: {
      reasoning: false,
      vision: false,
      documents: true,
      webSearch: false,
      tools: false,
    },
    description:
      "Meta's efficient instruction-following model (via OpenRouter)",
  }, // provided free of cost via openrouter
  "DeepSeek R1": {
    provider: "openrouter" as const,
    modelId: "deepseek/deepseek-r1:free",
    displayName: "DeepSeek R1",
    capabilities: {
      reasoning: true,
      vision: false,
      documents: true,
      webSearch: false,
      tools: false,
    },
    description:
      "DeepSeek's open-source model with open reasoning tokens (via OpenRouter)",
  }, // provided free of cost via openrouter
  "Claude 3.5 Haiku": {
    provider: "openrouter" as const,
    modelId: "anthropic/claude-3.5-haiku",
    displayName: "Claude 3.5 Haiku",
    capabilities: {
      reasoning: true,
      vision: true,
      documents: true,
      webSearch: false,
      tools: true,
    },
    description: "Anthropic's fast model (via OpenRouter)",
  },
} as const;

export type ModelName = keyof typeof MODEL_CONFIG;
export type ModelProvider = (typeof MODEL_CONFIG)[ModelName]["provider"];
export type ModelCapabilities =
  (typeof MODEL_CONFIG)[ModelName]["capabilities"];

export const modelCanReason = (model: ModelName): boolean =>
  MODEL_CONFIG[model].capabilities.reasoning;

export const modelHasVision = (model: ModelName): boolean =>
  MODEL_CONFIG[model].capabilities.vision;

export const modelSupportsDocuments = (model: ModelName): boolean =>
  MODEL_CONFIG[model].capabilities.documents;

export const modelCanUseWeb = (model: ModelName): boolean =>
  MODEL_CONFIG[model].capabilities.webSearch;

export const modelSupportsTools = (model: ModelName): boolean =>
  MODEL_CONFIG[model].capabilities.tools;

export const getCapabilityIcons = (model: ModelName) => {
  const caps = MODEL_CONFIG[model].capabilities;
  const icons = [];

  if (caps.reasoning) icons.push("🧠");
  if (caps.vision) icons.push("👁️");
  if (caps.documents) icons.push("📄");
  if (caps.webSearch) icons.push("🌐");
  if (caps.tools) icons.push("🔧");

  return icons;
};

export const getModelsWithCapability = (
  capability: keyof ModelCapabilities,
): ModelName[] => {
  return Object.keys(MODEL_CONFIG).filter(
    (model) => MODEL_CONFIG[model as ModelName].capabilities[capability],
  ) as ModelName[];
};
