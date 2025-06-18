import { AlertTriangle, Check, Plus } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";

interface AccountCustomizationProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

interface UserPreferences {
  userName: string;
  userRole: string;
  traits: string[];
  additionalInfo: string;
  disableComments: boolean;
}

export default function AccountCustomization({
  theme,
  setTheme,
}: AccountCustomizationProps) {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [disableComments, setDisableComments] = useState(false);
  const [hidePersonalInfo, setHidePersonalInfo] = useState(false);
  const [newTrait, setNewTrait] = useState("");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [originalValues, setOriginalValues] = useState<UserPreferences>({
    userName: "",
    userRole: "",
    traits: [],
    additionalInfo: "",
    disableComments: false,
  });

  const suggestedTraits = [
    "friendly",
    "witty",
    "concise",
    "curious",
    "empathetic",
    "creative",
    "patient",
    "analytical",
    "supportive",
    "direct",
  ];

  useEffect(() => {
    setMounted(true);
    fetchUserPreferences();
  }, []);

  const hasChanges = () => {
    return (
      userName.trim() !== originalValues.userName ||
      userRole.trim() !== originalValues.userRole ||
      JSON.stringify(traits) !== JSON.stringify(originalValues.traits) ||
      additionalInfo.trim() !== originalValues.additionalInfo ||
      disableComments !== originalValues.disableComments
    );
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch("/api/user/preferences");
      if (response.ok) {
        const preferences: UserPreferences = await response.json();
        const cleanPrefs = {
          userName: preferences.userName || "",
          userRole: preferences.userRole || "",
          traits: preferences.traits || [],
          additionalInfo: preferences.additionalInfo || "",
          disableComments: preferences.disableComments || false,
        };

        setUserName(cleanPrefs.userName);
        setUserRole(cleanPrefs.userRole);
        setTraits(cleanPrefs.traits);
        setAdditionalInfo(cleanPrefs.additionalInfo);
        setDisableComments(cleanPrefs.disableComments);
        setOriginalValues(cleanPrefs);
      } else {
        console.error("Failed to fetch user preferences");
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserPreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: userName.trim() || null,
          userRole: userRole.trim() || null,
          traits: traits.length > 0 ? traits : [],
          additionalInfo: additionalInfo.trim() || null,
          disableComments,
        }),
      });

      if (response.ok) {
        console.log("Preferences saved successfully");

        const newOriginalValues = {
          userName: userName.trim(),
          userRole: userRole.trim(),
          traits: [...traits],
          additionalInfo: additionalInfo.trim(),
          disableComments,
        };
        setOriginalValues(newOriginalValues);

        setJustSaved(true);
        setTimeout(() => {
          setJustSaved(false);
        }, 2000);
      } else {
        const error = await response.json();
        console.error("Failed to save preferences:", error.error);
      }
    } catch (error) {
      console.error("Error saving user preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        const error = await response.json();
        console.error("Failed to delete account:", error.error);
        alert("Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting your account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

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

  const addSuggestedTrait = (traitToAdd: string) => {
    if (traits.length < 50 && !traits.includes(traitToAdd)) {
      setTraits([...traits, traitToAdd]);
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

  const isDark = mounted ? theme === "dark" : false;
  const changesExist = hasChanges();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-[#4C5461] dark:text-[#E5E5E5]">
          Loading preferences...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-[rgba(5,81,206,0.08)] pb-6 dark:border-[rgba(255,255,255,0.08)]">
        <h2 className="mb-4 text-xl font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          Account Information
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0551CE] to-[#044bb8] text-xl font-medium text-white">
            {hidePersonalInfo
              ? "AG"
              : "Akshith Garapati"
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
              {hidePersonalInfo ? "User" : "Akshith Garapati"}
            </p>
            {!hidePersonalInfo && (
              <>
                <p className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                  garapatiakshith@gmail.com
                </p>
                <p className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                  Free Plan
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          Customize Pastry
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block font-medium text-[#4C5461] dark:text-[#E5E5E5]">
            What should Pastry call you?
          </label>
          <div className="relative">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 text-[#4C5461] transition-colors outline-none focus:border-[#0551CE] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:text-[#E5E5E5] dark:focus:border-[#5B9BD5]"
              placeholder="Your name"
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
            What traits should Pastry have?
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

          {traits.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-sm font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                Selected traits:
              </p>
              <div className="flex flex-wrap gap-2">
                {traits.map((trait, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-[rgba(5,81,206,0.1)] px-3 py-1 text-sm text-[#0551CE] dark:bg-[rgba(255,255,255,0.1)] dark:text-[#5B9BD5]"
                  >
                    {trait}
                    <button
                      onClick={() => removeTrait(trait)}
                      className="cursor-pointer rounded-full p-0.5 transition-colors hover:bg-[rgba(5,81,206,0.2)] dark:hover:bg-[rgba(255,255,255,0.2)]"
                    >
                      <Plus className="h-3 w-3 rotate-45" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-[#4C5461] dark:text-[#E5E5E5]">
              Suggested traits:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedTraits
                .filter((trait) => !traits.includes(trait))
                .map((trait, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full border border-[rgba(5,81,206,0.1)] bg-[rgba(5,81,206,0.05)] px-3 py-1 text-sm text-[#4C5461]/70 dark:border-[rgba(255,255,255,0.1)] dark:bg-[rgba(255,255,255,0.05)] dark:text-[#B0B7C3]/70"
                  >
                    {trait}
                    <button
                      onClick={() => addSuggestedTrait(trait)}
                      className="cursor-pointer rounded-full p-0.5 transition-colors hover:bg-[rgba(5,81,206,0.2)] dark:hover:bg-[rgba(255,255,255,0.2)]"
                      disabled={traits.length >= 50}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </span>
                ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium text-[#4C5461] dark:text-[#E5E5E5]">
            Anything else Pastry should know about you?
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
          {justSaved ? (
            <button
              disabled
              className="flex items-center gap-2 bg-green-600 px-4 py-2 text-white transition-colors"
            >
              <Check className="h-4 w-4" />
              Changes saved
            </button>
          ) : (
            <button
              onClick={saveUserPreferences}
              disabled={saving || !changesExist}
              className={`cursor-pointer px-4 py-2 transition-colors ${
                changesExist && !saving
                  ? "bg-[#0551CE] text-[#F7F7F2] hover:bg-[#044bb8] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]"
                  : "cursor-not-allowed bg-[rgba(5,81,206,0.3)] text-[#4C5461]/50 dark:bg-[rgba(255,255,255,0.1)] dark:text-[#B0B7C3]/50"
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
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
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
                isDark
                  ? "bg-[#0551CE] dark:bg-[#5B9BD5]"
                  : "bg-[rgba(5,81,206,0.2)] dark:bg-[rgba(255,255,255,0.2)]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDark ? "translate-x-6" : "translate-x-1"
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
              onClick={() => setDisableComments(!disableComments)}
              className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
                disableComments
                  ? "bg-[#0551CE] dark:bg-[#5B9BD5]"
                  : "bg-[rgba(5,81,206,0.2)] dark:bg-[rgba(255,255,255,0.2)]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  disableComments ? "translate-x-6" : "translate-x-1"
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
              className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
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

      <div className="border-t border-red-200 pt-6 dark:border-red-800">
        <h3 className="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
          Danger Zone
        </h3>
        <p className="mb-4 text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
          Permanently delete your account and all associated data.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="cursor-pointer rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-4 rounded border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Are you absolutely sure?</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300">
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </p>
            <div>
              <label className="mb-2 block text-sm font-medium text-red-700 dark:text-red-400">
                Type "DELETE MY ACCOUNT" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full border border-red-300 bg-white p-2 text-red-900 dark:border-red-600 dark:bg-red-900/50 dark:text-red-100"
                placeholder="DELETE MY ACCOUNT"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={deleteAccount}
                disabled={deleteConfirmText !== "DELETE MY ACCOUNT" || deleting}
                className={`px-4 py-2 text-white transition-colors ${
                  deleteConfirmText === "DELETE MY ACCOUNT" && !deleting
                    ? "cursor-pointer bg-red-600 hover:bg-red-700"
                    : "cursor-not-allowed bg-red-400"
                }`}
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="cursor-pointer bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
