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
      backgroundColor: isActive ? "#d4c4a8" : "#ebe0d0",
      borderColor: "#d4c4a8",
      color: "#5a4a37",
      cursor: "pointer",
    };
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1
          className={`${family.className} mb-4 text-4xl font-medium`}
          style={{ color: "#5a4a37" }}
        >
          How can I help you, {userName?.split(" ")[0]}?
        </h1>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => handleCategoryClick("create")}
            className="flex items-center gap-2 rounded border px-4 py-2 transition-colors hover:bg-[#d4c4a8]"
            style={getCategoryStyle("create")}
          >
            <Sparkles className="h-4 w-4" />
            Create
          </button>
          <button
            onClick={() => handleCategoryClick("explore")}
            className="flex items-center gap-2 rounded border px-4 py-2 transition-colors hover:bg-[#d4c4a8]"
            style={getCategoryStyle("explore")}
          >
            <BookOpen className="h-4 w-4" />
            Explore
          </button>
          <button
            onClick={() => handleCategoryClick("code")}
            className={`flex items-center gap-2 rounded border px-4 py-2 transition-colors hover:bg-[#d4c4a8] ${saans.className} font-medium text-[16px]`}
            style={getCategoryStyle("code")}
          >
            <Code className="h-4 w-4" />
            Code
          </button>
          <button
            onClick={() => handleCategoryClick("learn")}
            className="flex items-center gap-2 rounded border px-4 py-2 transition-colors hover:bg-[#d4c4a8]"
            style={getCategoryStyle("learn")}
          >
            <Lightbulb className="h-4 w-4" />
            Learn
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
          {currentPrompts.map((prompt, index) => (
            <button
              key={`${activeCategory || "default"}-${index}`}
              onClick={() => onSendMessage(prompt)}
              disabled={isLoading}
              className="cursor-pointer rounded border p-3 text-left transition-colors hover:bg-[#e8dcc6] disabled:opacity-50"
              style={{
                backgroundColor: "#ebe0d0",
                borderColor: "#d4c4a8",
                color: "#5a4a37",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
