import { BookOpen, Code, Lightbulb, Sparkles } from "lucide-react";
import { useState } from "react";
import { family, saans } from "~/utils/fonts";

type LandingContentProps = {
  userName?: string;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
};

type Category = "create" | "explore" | "code" | "learn";

export default function LandingContent({
  userName,
  onSendMessage,
  isLoading,
}: LandingContentProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const categoryPrompts = {
    create: [
      "Write a short story about a time traveler",
      "Design a logo concept for a coffee shop",
      "Create a workout routine for beginners",
      "Write a poem about the ocean",
    ],
    explore: [
      "What are the latest trends in renewable energy?",
      "Tell me about the history of jazz music",
      "Explore the mysteries of deep ocean creatures",
      "What's happening in space exploration right now?",
    ],
    code: [
      "Help me build a React todo app",
      "Debug this JavaScript function",
      "Explain how APIs work with examples",
      "Create a Python script for data analysis",
    ],
    learn: [
      "Explain quantum physics in simple terms",
      "How does machine learning actually work?",
      "What is the difference between Buddhism and Hinduism?",
      "Teach me the basics of personal finance",
    ],
  };

  const defaultPrompts = [
    "How does AI work?",
    "Are black holes real?",
    'How many Rs are in the word "strawberry"?',
    "What is the meaning of life?",
  ];

  const currentPrompts = activeCategory
    ? categoryPrompts[activeCategory]
    : defaultPrompts;

  const handleCategoryClick = (category: Category) => {
    setActiveCategory(activeCategory === category ? null : category);
  };

  const getCategoryStyle = (category: Category) => {
    const isActive = activeCategory === category;
    return {
      backgroundColor: isActive ? "#0551CE" : undefined, // Let Tailwind handle the default
      borderColor: "rgba(5,81,206,0.12)",
      color: isActive ? "#F7F7F2" : undefined, // Let Tailwind handle the default
      cursor: "pointer",
    };
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1
          className={`${family.className} mb-4 text-4xl font-medium text-[#4C5461] dark:text-[#E5E5E5]`}
        >
          How can I help you, {userName?.split(" ")[0]}?
        </h1>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          {(["create", "explore", "code", "learn"] as Category[]).map(
            (category) => {
              const isActive = activeCategory === category;
              const Icon = {
                create: Sparkles,
                explore: BookOpen,
                code: Code,
                learn: Lightbulb,
              }[category];

              return (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`flex items-center gap-2 rounded border border-[rgba(5,81,206,0.12)] px-4 py-2 shadow-[0_1px_3px_rgba(5,81,206,0.1)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(5,81,206,0.2)] dark:border-[rgba(255,255,255,0.12)] dark:shadow-[0_1px_3px_rgba(91,155,213,0.1)] dark:hover:shadow-[0_4px_8px_rgba(91,155,213,0.2)] ${
                    isActive
                      ? "bg-[#0551CE] text-[#F7F7F2] dark:bg-[#5B9BD5] dark:text-[#1a1a1a]"
                      : "bg-[#F7F7F2] text-[#4C5461] dark:bg-[#2a2a2a] dark:text-[#E5E5E5]"
                  } ${
                    category === "code" ? saans.className + " font-medium" : ""
                  }`}
                  style={getCategoryStyle(category)}
                >
                  <Icon className="h-4 w-4" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              );
            },
          )}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
          {currentPrompts.map((prompt, index) => (
            <button
              key={`${activeCategory || "default"}-${index}`}
              onClick={() => onSendMessage(prompt)}
              disabled={isLoading}
              className="cursor-pointer rounded border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 text-left text-[#4C5461] shadow-[0_1px_3px_rgba(5,81,206,0.08)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(5,81,206,0.15)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:text-[#E5E5E5] dark:shadow-[0_1px_3px_rgba(91,155,213,0.08)] dark:hover:shadow-[0_4px_8px_rgba(91,155,213,0.15)]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}