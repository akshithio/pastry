import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function CodeBlock({
  children,
  className,
  ...props
}: React.PropsWithChildren<{ className?: string }>) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className ?? "");
  const language = match ? match[1] : "";
  const codeString =
    typeof children === "string"
      ? children.replace(/\n$/, "")
      : Array.isArray(children)
        ? children.join("").replace(/\n$/, "")
        : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  if (!match) {
    return (
      <code
        className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-sm text-gray-100"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-4">
      <div className="flex items-center justify-between rounded-t-lg bg-gray-900 px-4 py-2">
        <span className="font-mono text-sm text-gray-300">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-800"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="code-block-container overflow-x-auto">
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: "0.5rem",
            borderBottomRightRadius: "0.5rem",
            fontSize: "0.875rem",
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
