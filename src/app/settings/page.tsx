"use client";

import {
  ArrowLeft,
  Bot,
  Eye,
  EyeOff,
  History,
  Key,
  Mail,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type APIKey = {
  id: string;
  name: string;
  provider: string;
  key: string;
  createdAt: string;
};

type Settings = {
  theme: "light" | "dark";
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  autoSave: boolean;
  syncHistory: boolean;
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Account");
  const [settings, setSettings] = useState<Settings>({
    theme: "light",
    model: "GPT-4",
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: "",
    autoSave: true,
    syncHistory: true,
  });
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [newApiKey, setNewApiKey] = useState({
    name: "",
    provider: "OpenAI",
    key: "",
  });
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  const [messageUsage, setMessageUsage] = useState({ used: 1, limit: 20 });

  const tabs = [
    "Account",
    "Customization",
    "History & Sync",
    "Models",
    "API Keys",
    "Attachments",
    "Contact Us",
  ];

  useEffect(() => {
    const savedSettings = localStorage.getItem("chatSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Mock API keys data
    setApiKeys([
      {
        id: "1",
        name: "OpenAI Production",
        provider: "OpenAI",
        key: "sk-proj-abc...xyz",
        createdAt: "2024-01-15",
      },
    ]);
  }, []);

  const handleSettingsChange = (key: keyof Settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("chatSettings", JSON.stringify(newSettings));
  };

  const handleAddApiKey = () => {
    if (!newApiKey.name || !newApiKey.key) return;

    const apiKey: APIKey = {
      id: Date.now().toString(),
      name: newApiKey.name,
      provider: newApiKey.provider,
      key: newApiKey.key,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setApiKeys([...apiKeys, apiKey]);
    setNewApiKey({ name: "", provider: "OpenAI", key: "" });
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id));
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Account":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-medium"
                style={{ backgroundColor: "#8b7355", color: "#f5f1e8" }}
              >
                {session?.user?.name
                  ? session.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "?"}
              </div>
              <div>
                <h3
                  className="text-lg font-medium"
                  style={{ color: "#5a4a37" }}
                >
                  {session?.user?.name || "Unknown User"}
                </h3>
                <p className="text-sm" style={{ color: "#8b7355" }}>
                  {session?.user?.email}
                </p>
                <span
                  className="mt-1 inline-block rounded px-2 py-1 text-xs"
                  style={{ backgroundColor: "#d4c4a8", color: "#5a4a37" }}
                >
                  Free Plan
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium" style={{ color: "#5a4a37" }}>
                  Message Usage
                </h4>
                <div className="text-sm" style={{ color: "#8b7355" }}>
                  {messageUsage.used}/{messageUsage.limit} messages used
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: "#8b7355",
                      width: `${(messageUsage.used / messageUsage.limit) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: "#8b7355" }}>
                  Resets tomorrow at 5:00 PM
                </p>
              </div>

              <div className="border-t pt-4" style={{ borderColor: "#e2d5c0" }}>
                <h4 className="mb-4 font-medium" style={{ color: "#5a4a37" }}>
                  Upgrade to Pro - $8/month
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-3">
                    <Bot
                      className="mt-0.5 h-5 w-5"
                      style={{ color: "#8b7355" }}
                    />
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "#5a4a37" }}
                      >
                        Access to All Models
                      </p>
                      <p className="text-xs" style={{ color: "#8b7355" }}>
                        Claude, GPT-4, Gemini Pro, and more
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <History
                      className="mt-0.5 h-5 w-5"
                      style={{ color: "#8b7355" }}
                    />
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "#5a4a37" }}
                      >
                        Generous Limits
                      </p>
                      <p className="text-xs" style={{ color: "#8b7355" }}>
                        1500 standard credits per month
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  className="mt-4 w-full rounded px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: "#5a4a37", color: "#f5f1e8" }}
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        );

      case "Customization":
        return (
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 font-medium" style={{ color: "#5a4a37" }}>
                Theme
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSettingsChange("theme", "light")}
                  className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${
                    settings.theme === "light"
                      ? "border-[#8b7355]"
                      : "border-[#d4c4a8]"
                  }`}
                  style={{
                    backgroundColor:
                      settings.theme === "light" ? "#e8dcc6" : "#ebe0d0",
                    color: "#5a4a37",
                  }}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </button>
                <button
                  onClick={() => handleSettingsChange("theme", "dark")}
                  className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${
                    settings.theme === "dark"
                      ? "border-[#8b7355]"
                      : "border-[#d4c4a8]"
                  }`}
                  style={{
                    backgroundColor:
                      settings.theme === "dark" ? "#e8dcc6" : "#ebe0d0",
                    color: "#5a4a37",
                  }}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </button>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-medium" style={{ color: "#5a4a37" }}>
                Default Model
              </h4>
              <select
                value={settings.model}
                onChange={(e) => handleSettingsChange("model", e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                style={{
                  backgroundColor: "#ebe0d0",
                  borderColor: "#d4c4a8",
                  color: "#5a4a37",
                }}
              >
                <option value="GPT-4">GPT-4</option>
                <option value="Claude 3">Claude 3</option>
                <option value="Gemini Pro">Gemini Pro</option>
              </select>
            </div>

            <div>
              <h4 className="mb-3 font-medium" style={{ color: "#5a4a37" }}>
                Temperature: {settings.temperature}
              </h4>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) =>
                  handleSettingsChange(
                    "temperature",
                    parseFloat(e.target.value),
                  )
                }
                className="w-full"
                style={{ accentColor: "#8b7355" }}
              />
              <div
                className="mt-1 flex justify-between text-xs"
                style={{ color: "#8b7355" }}
              >
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-medium" style={{ color: "#5a4a37" }}>
                Max Tokens
              </h4>
              <input
                type="number"
                value={settings.maxTokens}
                onChange={(e) =>
                  handleSettingsChange("maxTokens", parseInt(e.target.value))
                }
                className="w-full rounded border px-3 py-2 text-sm"
                style={{
                  backgroundColor: "#ebe0d0",
                  borderColor: "#d4c4a8",
                  color: "#5a4a37",
                }}
                min="1"
                max="4096"
              />
            </div>

            <div>
              <h4 className="mb-3 font-medium" style={{ color: "#5a4a37" }}>
                System Prompt
              </h4>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) =>
                  handleSettingsChange("systemPrompt", e.target.value)
                }
                placeholder="Enter custom system prompt..."
                className="h-24 w-full resize-none rounded border px-3 py-2 text-sm"
                style={{
                  backgroundColor: "#ebe0d0",
                  borderColor: "#d4c4a8",
                  color: "#5a4a37",
                }}
              />
            </div>
          </div>
        );

      case "History & Sync":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium" style={{ color: "#5a4a37" }}>
                  Auto-save conversations
                </h4>
                <p className="text-sm" style={{ color: "#8b7355" }}>
                  Automatically save your chat history
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) =>
                    handleSettingsChange("autoSave", e.target.checked)
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-[#8b7355] peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium" style={{ color: "#5a4a37" }}>
                  Sync across devices
                </h4>
                <p className="text-sm" style={{ color: "#8b7355" }}>
                  Keep your conversations synced
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.syncHistory}
                  onChange={(e) =>
                    handleSettingsChange("syncHistory", e.target.checked)
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-[#8b7355] peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            <div className="border-t pt-4" style={{ borderColor: "#e2d5c0" }}>
              <h4 className="mb-4 font-medium" style={{ color: "#5a4a37" }}>
                Keyboard Shortcuts
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "#5a4a37" }}>Search</span>
                  <span
                    className="rounded px-2 py-1"
                    style={{ backgroundColor: "#d4c4a8", color: "#5a4a37" }}
                  >
                    ⌘ K
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#5a4a37" }}>New Chat</span>
                  <span
                    className="rounded px-2 py-1"
                    style={{ backgroundColor: "#d4c4a8", color: "#5a4a37" }}
                  >
                    ⌘ Shift O
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#5a4a37" }}>Toggle Sidebar</span>
                  <span
                    className="rounded px-2 py-1"
                    style={{ backgroundColor: "#d4c4a8", color: "#5a4a37" }}
                  >
                    ⌘ B
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "API Keys":
        return (
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 font-medium" style={{ color: "#5a4a37" }}>
                Add New API Key
              </h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Key Name"
                  value={newApiKey.name}
                  onChange={(e) =>
                    setNewApiKey({ ...newApiKey, name: e.target.value })
                  }
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "#ebe0d0",
                    borderColor: "#d4c4a8",
                    color: "#5a4a37",
                  }}
                />
                <select
                  value={newApiKey.provider}
                  onChange={(e) =>
                    setNewApiKey({ ...newApiKey, provider: e.target.value })
                  }
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "#ebe0d0",
                    borderColor: "#d4c4a8",
                    color: "#5a4a37",
                  }}
                >
                  <option value="OpenAI">OpenAI</option>
                  <option value="Anthropic">Anthropic</option>
                  <option value="Google">Google</option>
                </select>
                <input
                  type="password"
                  placeholder="API Key"
                  value={newApiKey.key}
                  onChange={(e) =>
                    setNewApiKey({ ...newApiKey, key: e.target.value })
                  }
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "#ebe0d0",
                    borderColor: "#d4c4a8",
                    color: "#5a4a37",
                  }}
                />
                <button
                  onClick={handleAddApiKey}
                  className="w-full rounded px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: "#5a4a37", color: "#f5f1e8" }}
                >
                  Add API Key
                </button>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-medium" style={{ color: "#5a4a37" }}>
                Your API Keys
              </h4>
              <div className="space-y-3">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="flex items-center justify-between rounded border p-3"
                    style={{
                      backgroundColor: "#ebe0d0",
                      borderColor: "#d4c4a8",
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" style={{ color: "#8b7355" }} />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#5a4a37" }}
                        >
                          {apiKey.name}
                        </span>
                        <span
                          className="rounded px-2 py-1 text-xs"
                          style={{
                            backgroundColor: "#d4c4a8",
                            color: "#5a4a37",
                          }}
                        >
                          {apiKey.provider}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="font-mono text-xs"
                          style={{ color: "#8b7355" }}
                        >
                          {showApiKey[apiKey.id]
                            ? apiKey.key
                            : "••••••••••••••••"}
                        </span>
                        <button
                          onClick={() => toggleApiKeyVisibility(apiKey.id)}
                          className="p-1"
                        >
                          {showApiKey[apiKey.id] ? (
                            <EyeOff
                              className="h-3 w-3"
                              style={{ color: "#8b7355" }}
                            />
                          ) : (
                            <Eye
                              className="h-3 w-3"
                              style={{ color: "#8b7355" }}
                            />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-xs" style={{ color: "#8b7355" }}>
                        Added {apiKey.createdAt}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                      className="rounded p-2 hover:bg-red-100"
                    >
                      <Trash2
                        className="h-4 w-4"
                        style={{ color: "#d32f2f" }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "Contact Us":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Mail
                className="mx-auto mb-4 h-12 w-12"
                style={{ color: "#8b7355" }}
              />
              <h4 className="mb-2 font-medium" style={{ color: "#5a4a37" }}>
                Get in Touch
              </h4>
              <p className="mb-6 text-sm" style={{ color: "#8b7355" }}>
                Have questions or feedback? We'd love to hear from you.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "#5a4a37" }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="What's this about?"
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "#ebe0d0",
                    borderColor: "#d4c4a8",
                    color: "#5a4a37",
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "#5a4a37" }}
                >
                  Message
                </label>
                <textarea
                  placeholder="Tell us more..."
                  className="h-32 w-full resize-none rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "#ebe0d0",
                    borderColor: "#d4c4a8",
                    color: "#5a4a37",
                  }}
                />
              </div>

              <button
                className="w-full rounded px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "#5a4a37", color: "#f5f1e8" }}
              >
                Send Message
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-8 text-center">
            <p style={{ color: "#8b7355" }}>
              {activeTab} settings coming soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className="flex min-h-screen font-mono"
      style={{ backgroundColor: "#f5f1e8" }}
    >
      {/* Left Sidebar */}
      <div
        className="flex w-80 flex-col border-r"
        style={{ backgroundColor: "#f5f1e8", borderColor: "#e2d5c0" }}
      >
        {/* Header */}
        <div className="border-b p-6" style={{ borderColor: "#e2d5c0" }}>
          <button
            onClick={() => router.push("/")}
            className="mb-4 flex cursor-pointer items-center gap-2 text-sm"
            style={{ color: "#6b5b47" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </button>

          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-medium"
              style={{ backgroundColor: "#8b7355", color: "#f5f1e8" }}
            >
              {session?.user?.name
                ? session.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "?"}
            </div>
            <div>
              <h2 className="font-medium" style={{ color: "#5a4a37" }}>
                {session?.user?.name || "Unknown User"}
              </h2>
              <p className="text-sm" style={{ color: "#8b7355" }}>
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 p-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`mb-1 w-full rounded px-4 py-3 text-left text-sm transition-colors ${
                activeTab === tab ? "bg-[#e8dcc6]" : "hover:bg-[#f0e6d2]"
              }`}
              style={{ color: "#5a4a37" }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="border-t p-4" style={{ borderColor: "#e2d5c0" }}>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center justify-center gap-2 rounded border px-4 py-2 text-sm"
            style={{
              backgroundColor: "#d4c4a8",
              borderColor: "#c4b49d",
              color: "#5a4a37",
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mx-auto max-w-2xl p-8">
          <div className="mb-8">
            <h1
              className="mb-2 text-2xl font-medium"
              style={{ color: "#5a4a37" }}
            >
              {activeTab}
            </h1>
            <p className="text-sm" style={{ color: "#8b7355" }}>
              {activeTab === "Account" &&
                "Manage your account and subscription"}
              {activeTab === "Customization" &&
                "Customize your chat experience"}
              {activeTab === "History & Sync" &&
                "Control your data and shortcuts"}
              {activeTab === "Models" && "Configure AI models and parameters"}
              {activeTab === "API Keys" && "Manage your API keys"}
              {activeTab === "Attachments" &&
                "File upload and attachment settings"}
              {activeTab === "Contact Us" && "Get help and send feedback"}
            </p>
          </div>

          <div
            className="rounded border p-6"
            style={{ backgroundColor: "#ebe0d0", borderColor: "#d4c4a8" }}
          >
            {renderTabContent()}
          </div>

          {activeTab === "Account" && (
            <div
              className="mt-8 rounded border p-6"
              style={{ backgroundColor: "#fdeaea", borderColor: "#f5c6cb" }}
            >
              <h3 className="mb-2 font-medium" style={{ color: "#721c24" }}>
                Danger Zone
              </h3>
              <p className="mb-4 text-sm" style={{ color: "#856404" }}>
                Permanently delete your account and all associated data.
              </p>
              <button
                className="rounded px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "#d32f2f", color: "#ffffff" }}
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to delete your account? This action cannot be undone.",
                    )
                  ) {
                    alert("Account deletion would be processed here");
                  }
                }}
              >
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
