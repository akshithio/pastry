import { CheckCircle, Globe, Search, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface WebSearchStatus {
  status: "searching" | "completed" | "error";
  query?: string;
  resultsCount?: number;
  error?: string;
}

interface WebSearchIndicatorProps {
  searchStatus: WebSearchStatus | null;
}

export function WebSearchIndicator({ searchStatus }: WebSearchIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log("🎯 WebSearchIndicator received status:", searchStatus);

    if (searchStatus) {
      console.log(
        "✨ Setting indicator visible with status:",
        searchStatus.status,
      );
      setIsVisible(true);

      if (
        searchStatus.status === "completed" ||
        searchStatus.status === "error"
      ) {
        const timer = setTimeout(() => {
          console.log("🕒 Auto-hiding indicator");
          setIsVisible(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      console.log("👻 No search status, hiding indicator");
      setIsVisible(false);
    }
  }, [searchStatus]);

  if (!searchStatus || !isVisible) {
    console.log(
      "🚫 WebSearchIndicator not rendering - no status or not visible",
    );
    return null;
  }

  console.log("🎯 Displaying WebSearchIndicator with status:", searchStatus);

  const getStatusConfig = () => {
    switch (searchStatus.status) {
      case "searching":
        return {
          icon: <Search className="h-4 w-4 animate-spin" />,
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-700",
          textColor: "text-blue-700 dark:text-blue-300",
          title: (
            <div className="flex items-center gap-2">
              <span>Searching the web</span>
              <div className="flex gap-1">
                <div className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
                <div className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
                <div className="h-1 w-1 animate-bounce rounded-full bg-current"></div>
              </div>
            </div>
          ),
          description: searchStatus.query
            ? `Query: "${searchStatus.query}"`
            : "",
        };
      case "completed":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-700",
          textColor: "text-green-700 dark:text-green-300",
          title: "Web search completed",
          description: `Found ${searchStatus.resultsCount ?? 0} results for "${searchStatus.query}"`,
        };
      case "error":
        return {
          icon: <XCircle className="h-4 w-4 text-red-600" />,
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-700",
          textColor: "text-red-700 dark:text-red-300",
          title: "Search failed",
          description: searchStatus.error ?? "Unable to search the web",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div
      className={`mx-auto mb-4 max-w-4xl transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-lg border p-3 ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-medium ${config.textColor}`}>
            {config.title}
          </div>
          {config.description && (
            <div className={`mt-1 text-xs ${config.textColor} opacity-80`}>
              {config.description}
            </div>
          )}
        </div>
        <Globe className="h-4 w-4 opacity-50" />
      </div>
    </div>
  );
}

interface WebSearchStatus {
  status: "searching" | "completed" | "error";
  query?: string;
  resultsCount?: number;
  error?: string;
}

export function useWebSearchStatus() {
  const [searchStatus, setSearchStatus] = useState<WebSearchStatus | null>(
    null,
  );

  const handleStreamData = (data: any) => {
    console.log("🔍 Stream data received:", JSON.stringify(data, null, 2));

    if (!data || typeof data !== "object") return;

    if (data.steps && Array.isArray(data.steps)) {
      console.log("📊 Processing steps array:", data.steps);

      data.steps.forEach((step: any, index: number) => {
        console.log(`🔧 Processing step ${index}:`, step);

        if (step.toolCalls && Array.isArray(step.toolCalls)) {
          step.toolCalls.forEach((toolCall: any) => {
            console.log("🛠️ Found tool call:", toolCall);

            if (
              toolCall.toolName === "webSearch" ||
              toolCall.type === "webSearch"
            ) {
              const query =
                toolCall.args?.query ||
                toolCall.parameters?.query ||
                "Searching...";
              console.log(
                "🚀 Setting search status to searching with query:",
                query,
              );

              setSearchStatus({
                status: "searching",
                query: query,
              });
            }
          });
        }

        if (step.toolResults && Array.isArray(step.toolResults)) {
          step.toolResults.forEach((result: any) => {
            console.log("📈 Found tool result:", result);

            if (
              result.toolName === "webSearch" ||
              result.type === "webSearch"
            ) {
              const resultData = result.result || result.content;
              const query =
                result.args?.query ||
                step.toolCalls?.[0]?.args?.query ||
                "Unknown query";

              if (
                resultData &&
                (Array.isArray(resultData) ||
                  (resultData.content && Array.isArray(resultData.content)))
              ) {
                const count = Array.isArray(resultData)
                  ? resultData.length
                  : resultData.content.length;
                console.log(
                  "✅ Setting search status to completed with count:",
                  count,
                );

                setSearchStatus({
                  status: "completed",
                  query: query,
                  resultsCount: count,
                });
              } else {
                console.log("❌ Setting search status to error");
                setSearchStatus({
                  status: "error",
                  query: query,
                  error: "Search failed",
                });
              }
            }
          });
        }
      });
    }

    if (data.toolCalls && Array.isArray(data.toolCalls)) {
      console.log("🔧 Processing direct tool calls:", data.toolCalls);

      data.toolCalls.forEach((toolCall: any) => {
        if (toolCall.toolName === "webSearch") {
          const query = toolCall.args?.query || "Searching...";
          console.log("🚀 Setting search status to searching (direct):", query);

          setSearchStatus({
            status: "searching",
            query: query,
          });
        }
      });
    }

    if (data.toolResults && Array.isArray(data.toolResults)) {
      console.log("📈 Processing direct tool results:", data.toolResults);

      data.toolResults.forEach((result: any) => {
        if (result.toolName === "webSearch") {
          const resultData = result.result;
          const query = result.args?.query || "Unknown query";

          if (resultData && Array.isArray(resultData)) {
            console.log(
              "✅ Setting search status to completed (direct):",
              resultData.length,
            );

            setSearchStatus({
              status: "completed",
              query: query,
              resultsCount: resultData.length,
            });
          }
        }
      });
    }
  };

  const resetSearchStatus = () => {
    console.log("🔄 Resetting search status");
    setSearchStatus(null);
  };

  return {
    searchStatus,
    handleStreamData,
    resetSearchStatus,
  };
}
