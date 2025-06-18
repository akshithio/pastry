"use client";

import { ArrowLeft, History, Layers, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AccountCustomization from "~/components/settings/AccountCustomization";
import HistoryTab from "~/components/settings/HistoryTab";
import ModelsKeys from "~/components/settings/ModelsKeys";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account-customization");

  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const tabs = [
    {
      id: "account-customization",
      label: "Account & Customization",
      icon: User,
    },
    { id: "history", label: "History", icon: History },
    { id: "models-keys", label: "Models & Keys", icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F2]/80 font-medium backdrop-blur-sm dark:bg-[#1a1a1a]/80">
      <div className="mx-auto max-w-6xl">
        <div className="border-b border-[rgba(5,81,206,0.08)] bg-[#F7F7F2] px-6 py-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="cursor-pointer rounded p-2 transition-colors hover:bg-[rgba(5,81,206,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)]"
              >
                <ArrowLeft className="h-5 w-5 text-[#4C5461] dark:text-[#E5E5E5]" />
              </button>
              <h1 className="text-xl font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                Settings
              </h1>
            </div>
            <button className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.05)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]">
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
                      Akshith Garapati
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
                    className={`mb-1 flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors ${
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
                <AccountCustomization theme={theme} setTheme={setTheme} />
              )}
              {activeTab === "history" && <HistoryTab />}
              {activeTab === "models-keys" && <ModelsKeys />}
              {activeTab === "account-customization"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
