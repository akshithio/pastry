export const MODEL_CONFIG = {
  "Gemini 2.0 Flash": {
    provider: "google" as const,
    modelId: "models/gemini-2.0-flash-exp",
    displayName: "Gemini 2.0 Flash",
    capabilities: {
      reasoning: true,
      vision: true,
      documents: true,
      webSearch: false,
    },
    description: "Google's fastest multimodal model with advanced reasoning",
  },
  "Pixtral 12B": {
    provider: "mistral" as const,
    modelId: "pixtral-12b-2409",
    displayName: "Pixtral 12B",
    capabilities: {
      reasoning: false,
      vision: true,
      documents: false,
      webSearch: false,
    },
    description: "Mistral's multimodal model with vision capabilities",
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

export const getCapabilityIcons = (model: ModelName) => {
  const caps = MODEL_CONFIG[model].capabilities;
  const icons = [];

  if (caps.reasoning) icons.push("🧠");
  if (caps.vision) icons.push("👁️");
  if (caps.documents) icons.push("📄");
  if (caps.webSearch) icons.push("🌐");

  return icons;
};

export const getModelsWithCapability = (
  capability: keyof ModelCapabilities,
): ModelName[] => {
  return Object.keys(MODEL_CONFIG).filter(
    (model) => MODEL_CONFIG[model as ModelName].capabilities[capability],
  ) as ModelName[];
};
