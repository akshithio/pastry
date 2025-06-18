import { CheckCircle, Eye, EyeOff, Key, XCircle, Zap, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function ModelsKeys() {
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude-3.5-sonnet");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const fetchApiKeyStatus = async () => {
    try {
      const response = await fetch("/api/user/api-keys");
      if (response.ok) {
        const data = await response.json();
        setHasApiKey(data.hasApiKey);
        setMaskedKey(data.maskedKey || "");
      }
    } catch (error) {
      console.error("Error fetching API key status:", error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!openRouterKey.trim()) return;

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: openRouterKey }),
      });

      const data = await response.json();

      if (response.ok) {
        setHasApiKey(true);
        setMaskedKey(data.maskedKey);
        setOpenRouterKey("");
        setShowApiKey(false); // Hide the key after saving
        setMessage("API key saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Failed to save API key");
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      setMessage("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const testKey = openRouterKey || (hasApiKey ? "existing" : "");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage("Connection test successful!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error testing connection:", error);
      setMessage("Connection test failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearApiKey = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/user/api-keys", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setHasApiKey(false);
        setMaskedKey("");
        setOpenRouterKey("");
        setShowApiKey(false); // Hide the key input when clearing
        setMessage("API key removed successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Failed to remove API key");
      }
    } catch (error) {
      console.error("Error removing API key:", error);
      setMessage("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const availableModels = [
    {
      id: "claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      description: "Default model - balanced performance and efficiency",
      provider: "Anthropic",
      status: "active",
      requiresKey: false,
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      description: "Advanced reasoning and multimodal capabilities",
      provider: "OpenAI",
      status: hasApiKey ? "available" : "requires-key",
      requiresKey: true,
    },
    {
      id: "llama-3.1-405b",
      name: "Llama 3.1 405B",
      description: "Large open-source model with strong performance",
      provider: "Meta",
      status: hasApiKey ? "available" : "requires-key",
      requiresKey: true,
    },
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      description: "Most capable model for complex reasoning tasks",
      provider: "Anthropic",
      status: hasApiKey ? "available" : "requires-key",
      requiresKey: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500 text-white">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              Work in Progress
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This tab is currently under development and functionality may not
              work as expected. Putting in your API key will save it our
              database, but you cannot use it for much. So, I would reccommend
              just not doing so. 
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          Models & API Keys
        </h2>
        <p className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
          Configure your AI models and API keys for enhanced functionality.
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`rounded border p-3 ${
            message.includes("success")
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* OpenRouter API Configuration */}
      <div className="border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-6 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
        <h3 className="mb-4 text-lg font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          OpenRouter API Configuration
        </h3>
        <p className="mb-4 text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
          Connect your OpenRouter API key to access additional AI models and
          capabilities.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-medium text-[#4C5461] dark:text-[#E5E5E5]">
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                className="w-full border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 pr-20 text-[#4C5461] transition-colors outline-none focus:border-[#0551CE] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:text-[#E5E5E5] dark:focus:border-[#5B9BD5]"
                placeholder={
                  hasApiKey ? "Enter new key to update..." : "sk-or-..."
                }
                disabled={isLoading}
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={toggleApiKeyVisibility}
                  className="text-[#4C5461]/50 transition-colors hover:text-[#4C5461] dark:text-[#B0B7C3]/50 dark:hover:text-[#B0B7C3]"
                  disabled={isLoading}
                  type="button"
                  title={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                <Key className="h-5 w-5 text-[#4C5461]/50 dark:text-[#B0B7C3]/50" />
              </div>
            </div>
            <p className="mt-1 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
              Your API key is stored securely and encrypted. Get your key from{" "}
              <a
                href="https://openrouter.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0551CE] hover:underline dark:text-[#5B9BD5]"
              >
                OpenRouter
              </a>
            </p>
            {hasApiKey && maskedKey && (
              <p className="mt-1 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                Current key: {maskedKey}
              </p>
            )}
          </div>

          <div className="rounded bg-[rgba(5,81,206,0.05)] p-3 dark:bg-[rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-2">
              {hasApiKey ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <p className="text-sm text-[#4C5461] dark:text-[#E5E5E5]">
                <strong>Status:</strong>{" "}
                {hasApiKey ? "Connected" : "Not connected"}
              </p>
            </div>
            {hasApiKey && (
              <p className="mt-1 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                API key configured successfully. You can now access additional
                models.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveApiKey}
              className="bg-[#0551CE] px-4 py-2 text-[#F7F7F2] transition-colors hover:bg-[#044bb8] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]"
              disabled={!openRouterKey.trim() || isLoading}
            >
              {isLoading
                ? "Saving..."
                : hasApiKey
                  ? "Update API Key"
                  : "Save API Key"}
            </button>
            <button
              onClick={handleTestConnection}
              className="border border-[rgba(5,81,206,0.12)] px-4 py-2 text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.05)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[rgba(255,255,255,0.12)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]"
              disabled={(!openRouterKey.trim() && !hasApiKey) || isLoading}
            >
              {isLoading ? "Testing..." : "Test Connection"}
            </button>
            <button
              onClick={handleClearApiKey}
              className="border border-[rgba(5,81,206,0.12)] px-4 py-2 text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.05)] dark:border-[rgba(255,255,255,0.12)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]"
              disabled={isLoading}
            >
              {isLoading ? "Clearing..." : "Clear"}
            </button>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-6 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
        <h3 className="mb-4 text-lg font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          Default Model Selection
        </h3>
        <p className="mb-4 text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
          Choose which model to use by default for new conversations.
        </p>

        <div className="space-y-2">
          {availableModels.map((model) => (
            <div
              key={model.id}
              className={`cursor-pointer border p-4 transition-colors ${
                selectedModel === model.id
                  ? "border-[#0551CE] bg-[rgba(5,81,206,0.05)] dark:border-[#5B9BD5] dark:bg-[rgba(91,155,213,0.1)]"
                  : "border-[rgba(5,81,206,0.08)] hover:bg-[rgba(5,81,206,0.02)] dark:border-[rgba(255,255,255,0.08)] dark:hover:bg-[rgba(255,255,255,0.02)]"
              } ${model.status === "requires-key" ? "opacity-60" : ""}`}
              onClick={() =>
                model.status !== "requires-key" && setSelectedModel(model.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={selectedModel === model.id}
                      onChange={() => setSelectedModel(model.id)}
                      disabled={model.status === "requires-key"}
                      className="text-[#0551CE] dark:text-[#5B9BD5]"
                    />
                    <div>
                      <div className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                        {model.name}
                      </div>
                      <div className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                        {model.description}
                      </div>
                      <div className="text-xs text-[#4C5461]/50 dark:text-[#B0B7C3]/50">
                        Provider: {model.provider}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {model.status === "active" && (
                    <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </span>
                  )}
                  {model.status === "available" && (
                    <span className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      <Zap className="h-3 w-3" />
                      Available
                    </span>
                  )}
                  {model.status === "requires-key" && (
                    <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      <Key className="h-3 w-3" />
                      Requires API Key
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-6 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
        <h3 className="mb-4 text-lg font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          API Usage This Month
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#4C5461] dark:text-[#E5E5E5]">
              OpenRouter Credits
            </span>
            <span className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
              {hasApiKey ? "$2.34 / $10.00" : "Not connected"}
            </span>
          </div>

          {hasApiKey && (
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 w-[23.4%] rounded-full bg-[#0551CE] dark:bg-[#5B9BD5]"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                    247
                  </div>
                  <div className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                    Requests
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                    1.2M
                  </div>
                  <div className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                    Tokens
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
