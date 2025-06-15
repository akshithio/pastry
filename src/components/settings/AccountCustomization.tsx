import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

interface AccountCustomizationProps {
  userName: string;
  setUserName: (name: string) => void;
  userRole: string;
  setUserRole: (role: string) => void;
  traits: string[];
  setTraits: (traits: string[]) => void;
  additionalInfo: string;
  setAdditionalInfo: (info: string) => void;
  boringTheme: boolean;
  setBoringTheme: (boring: boolean) => void;
  hidePersonalInfo: boolean;
  setHidePersonalInfo: (hide: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export default function AccountCustomization({
  userName,
  setUserName,
  userRole,
  setUserRole,
  traits,
  setTraits,
  additionalInfo,
  setAdditionalInfo,
  boringTheme,
  setBoringTheme,
  hidePersonalInfo,
  setHidePersonalInfo,
  darkMode,
  setDarkMode,
}: AccountCustomizationProps) {
  const [newTrait, setNewTrait] = useState("");

  const addTrait = () => {
    if (
      newTrait.trim() &&
      traits.length < 50 &&
      !traits.includes(newTrait.trim())
    ) {
      setTraits([...traits, newTrait.trim()]);
      setNewTrait("");
    }
  };

  const removeTrait = (traitToRemove: string) => {
    setTraits(traits.filter((trait) => trait !== traitToRemove));
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      addTrait();
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[rgba(5,81,206,0.08)] pb-6 dark:border-[rgba(255,255,255,0.08)]">
        <h2 className="mb-4 text-xl font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          Account Information
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0551CE] to-[#044bb8] text-xl font-medium text-white">
            AG
          </div>
          <div>
            <p className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
              {userName}
            </p>
            <p className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
              garapatiakshith@gmail.com
            </p>
            <p className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
              Free Plan
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          Customize T3 Chat
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block font-medium text-[#4C5461] dark:text-[#E5E5E5]">
            What should T3 Chat call you?
          </label>
          <div className="relative">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 text-[#4C5461] transition-colors outline-none focus:border-[#0551CE] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:text-[#E5E5E5] dark:focus:border-[#5B9BD5]"
              placeholder="Enter your name"
              maxLength={50}
            />
            <span className="absolute top-3 right-3 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
              {userName.length}/50
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium text-[#4C5461] dark:text-[#E5E5E5]">
            What do you do?
          </label>
          <div className="relative">
            <input
              type="text"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="w-full border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 text-[#4C5461] transition-colors outline-none focus:border-[#0551CE] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:text-[#E5E5E5] dark:focus:border-[#5B9BD5]"
              placeholder="Engineer, student, etc."
              maxLength={100}
            />
            <span className="absolute top-3 right-3 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
              {userRole.length}/100
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium text-[#4C5461] dark:text-[#E5E5E5]">
            What traits should T3 Chat have?
            <span className="text-sm font-normal text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
              (up to 50, max 100 chars each)
            </span>
          </label>
          <div className="relative mb-3">
            <input
              type="text"
              value={newTrait}
              onChange={(e) => setNewTrait(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 text-[#4C5461] transition-colors outline-none focus:border-[#0551CE] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:text-[#E5E5E5] dark:focus:border-[#5B9BD5]"
              placeholder="Type a trait and press Enter or Tab..."
              maxLength={100}
            />
            <span className="absolute top-3 right-3 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
              {traits.length}/50
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {traits.map((trait, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-[rgba(5,81,206,0.1)] px-3 py-1 text-sm text-[#0551CE] dark:bg-[rgba(255,255,255,0.1)] dark:text-[#5B9BD5]"
              >
                {trait}
                <button
                  onClick={() => removeTrait(trait)}
                  className="rounded-full p-0.5 transition-colors hover:bg-[rgba(5,81,206,0.2)] dark:hover:bg-[rgba(255,255,255,0.2)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium text-[#4C5461] dark:text-[#E5E5E5]">
            Anything else T3 Chat should know about you?
          </label>
          <div className="relative">
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="w-full resize-none border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 text-[#4C5461] transition-colors outline-none focus:border-[#0551CE] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:text-[#E5E5E5] dark:focus:border-[#5B9BD5]"
              rows={4}
              placeholder="Interests, values, or preferences to keep in mind"
              maxLength={3000}
            />
            <span className="absolute right-3 bottom-3 text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
              {additionalInfo.length}/3000
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="border border-[rgba(5,81,206,0.12)] px-4 py-2 text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.05)] dark:border-[rgba(255,255,255,0.12)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]">
            Load Legacy Data
          </button>
          <button className="bg-[#0551CE] px-4 py-2 text-[#F7F7F2] transition-colors hover:bg-[#044bb8] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]">
            Save Preferences
          </button>
        </div>
      </div>

      <div className="border-t border-[rgba(5,81,206,0.08)] pt-6 dark:border-[rgba(255,255,255,0.08)]">
        <h3 className="mb-4 text-lg font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          Customization Options
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
            <div>
              <div className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                Dark Mode
              </div>
              <div className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                Switch between light and dark themes
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode
                  ? "bg-[#0551CE] dark:bg-[#5B9BD5]"
                  : "bg-[rgba(5,81,206,0.2)] dark:bg-[rgba(255,255,255,0.2)]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
            <div>
              <div className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                Disable Comments
              </div>
              <div className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                Ensure that no comments are included in any code produced.
              </div>
            </div>
            <button
              onClick={() => setBoringTheme(!boringTheme)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                boringTheme
                  ? "bg-[#0551CE] dark:bg-[#5B9BD5]"
                  : "bg-[rgba(5,81,206,0.2)] dark:bg-[rgba(255,255,255,0.2)]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  boringTheme ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
            <div>
              <div className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                Hide Personal Information
              </div>
              <div className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                Hides your name and email from the UI.
              </div>
            </div>
            <button
              onClick={() => setHidePersonalInfo(!hidePersonalInfo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hidePersonalInfo
                  ? "bg-[#0551CE] dark:bg-[#5B9BD5]"
                  : "bg-[rgba(5,81,206,0.2)] dark:bg-[rgba(255,255,255,0.2)]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hidePersonalInfo ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
