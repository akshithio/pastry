"use client";

import {
  ArrowLeft,
  History,
  Key,
  Layers,
  Moon,
  Paperclip,
  Sun,
  User,
} from "lucide-react";
import { useState } from "react";

import AccountCustomization from "~/components/settings/AccountCustomization";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account-customization");
  const [userName, setUserName] = useState("Akshith Garapati");
  const [userRole, setUserRole] = useState("Engineer, student, etc.");
  const [traits, setTraits] = useState([
    "friendly",
    "witty",
    "concise",
    "curious",
    "empathetic",
    "creative",
    "patient",
  ]);
  const [additionalInfo, setAdditionalInfo] = useState(
    "Interests, values, or preferences to keep in mind",
  );
  const [boringTheme, setBoringTheme] = useState(false);
  const [hidePersonalInfo, setHidePersonalInfo] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState("");

  const tabs = [
    {
      id: "account-customization",
      label: "Account & Customization",
      icon: User,
    },
    { id: "history", label: "History & Sync", icon: History },
    { id: "models-keys", label: "Models & Keys", icon: Layers },
    { id: "attachments", label: "Attachments", icon: Paperclip },
  ];

  const renderModelsKeysTab = () => (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-xl font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          Models & API Keys
        </h2>
        <p className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
          Configure your AI models and API keys for enhanced functionality.
        </p>
      </div>

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
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                className="w-full border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 text-[#4C5461] transition-colors outline-none focus:border-[#0551CE] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:text-[#E5E5E5] dark:focus:border-[#5B9BD5]"
                placeholder="sk-or-..."
              />
              <Key className="absolute top-3 right-3 h-5 w-5 text-[#4C5461]/50 dark:text-[#B0B7C3]/50" />
            </div>
            <p className="mt-1 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
              Your API key is stored securely and never shared.
            </p>
          </div>

          <div className="rounded bg-[rgba(5,81,206,0.05)] p-3 dark:bg-[rgba(255,255,255,0.05)]">
            <p className="text-sm text-[#4C5461] dark:text-[#E5E5E5]">
              <strong>Status:</strong>{" "}
              {openRouterKey ? "Connected" : "Not connected"}
            </p>
            {openRouterKey && (
              <p className="mt-1 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                API key configured successfully. You can now access additional
                models.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              className="bg-[#0551CE] px-4 py-2 text-[#F7F7F2] transition-colors hover:bg-[#044bb8] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]"
              disabled={!openRouterKey.trim()}
            >
              Save API Key
            </button>
            <button
              onClick={() => setOpenRouterKey("")}
              className="border border-[rgba(5,81,206,0.12)] px-4 py-2 text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.05)] dark:border-[rgba(255,255,255,0.12)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-6 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
        <h3 className="mb-4 text-lg font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          Available Models
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between border border-[rgba(5,81,206,0.08)] p-3 dark:border-[rgba(255,255,255,0.08)]">
            <div>
              <div className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                Claude 3.5 Sonnet
              </div>
              <div className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                Default model
              </div>
            </div>
            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
              Active
            </span>
          </div>

          {openRouterKey && (
            <>
              <div className="flex items-center justify-between border border-[rgba(5,81,206,0.08)] p-3 dark:border-[rgba(255,255,255,0.08)]">
                <div>
                  <div className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                    GPT-4 Turbo
                  </div>
                  <div className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                    Via OpenRouter
                  </div>
                </div>
                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Available
                </span>
              </div>

              <div className="flex items-center justify-between border border-[rgba(5,81,206,0.08)] p-3 dark:border-[rgba(255,255,255,0.08)]">
                <div>
                  <div className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                    Llama 3.1 405B
                  </div>
                  <div className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                    Via OpenRouter
                  </div>
                </div>
                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Available
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderDangerZone = () => (
    <div className="mt-8 border-t border-red-200 pt-6 dark:border-red-800">
      <h3 className="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
        Danger Zone
      </h3>
      <p className="mb-4 text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
        Permanently delete your account and all associated data.
      </p>
      <button className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700">
        Delete Account
      </button>
    </div>
  );

  const renderPlaceholderTab = (tabName: string) => (
    <div className="py-12 text-center">
      <div className="mb-4 text-[#4C5461]/50 dark:text-[#B0B7C3]/50">
        <Layers className="mx-auto h-12 w-12" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-[#4C5461] dark:text-[#E5E5E5]">
        {tabName} Settings
      </h3>
      <p className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
        This section is coming soon.
      </p>
    </div>
  );

  return (
    <div
      className={`min-h-screen ${darkMode ? "dark" : ""} bg-[#F7F7F2]/80 font-medium backdrop-blur-sm dark:bg-[#1a1a1a]/80`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="border-b border-[rgba(5,81,206,0.08)] bg-[#F7F7F2] px-6 py-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="rounded p-2 transition-colors hover:bg-[rgba(5,81,206,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)]">
                <ArrowLeft className="h-5 w-5 text-[#4C5461] dark:text-[#E5E5E5]" />
              </button>
              <h1 className="text-xl font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                Settings
              </h1>
            </div>
            <button className="flex items-center gap-2 rounded px-3 py-2 text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.05)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]">
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="text-sm">Sign out</span>
            </button>
          </div>
        </div>

        <div className="flex">
          <div className="min-h-screen w-80 border-r border-[rgba(5,81,206,0.08)] bg-[#F7F7F2] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#1a1a1a]">
            <div className="p-6">
              <div className="mb-8">
                <div className="mb-4 flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0551CE] to-[#044bb8] font-medium text-white">
                    AG
                  </div>
                  <div>
                    <p className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                      {userName}
                    </p>
                    <p className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                      garapatiakshith@gmail.com
                    </p>
                    <p className="text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                      Free Plan
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="mb-3 font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                      Search
                    </span>
                    <span className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                      ⌘ K
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                      New Chat
                    </span>
                    <span className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                      ⌘ Shift O
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                      Toggle Sidebar
                    </span>
                    <span className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                      ⌘ B
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <nav className="px-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`mb-1 flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-[rgba(5,81,206,0.1)] font-medium text-[#0551CE] dark:bg-[rgba(255,255,255,0.1)] dark:text-[#5B9BD5]"
                        : "text-[#4C5461] hover:bg-[rgba(5,81,206,0.05)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 p-8">
            <div className="max-w-2xl">
              {activeTab === "account-customization" && (
                <AccountCustomization
                  userName={userName}
                  setUserName={setUserName}
                  userRole={userRole}
                  setUserRole={setUserRole}
                  traits={traits}
                  setTraits={setTraits}
                  additionalInfo={additionalInfo}
                  setAdditionalInfo={setAdditionalInfo}
                  boringTheme={boringTheme}
                  setBoringTheme={setBoringTheme}
                  hidePersonalInfo={hidePersonalInfo}
                  setHidePersonalInfo={setHidePersonalInfo}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />
              )}
              {activeTab === "history" &&
                renderPlaceholderTab("History & Sync")}
              {activeTab === "models-keys" && renderModelsKeysTab()}
              {activeTab === "attachments" &&
                renderPlaceholderTab("Attachments")}

              {activeTab === "account-customization" && renderDangerZone()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
