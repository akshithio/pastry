import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import CodeBlock from "./CodeBlock";
import "katex/dist/katex.min.css";

export const latexStyles = `
  .katex-display {
    overflow-x: auto !important;
    overflow-y: hidden !important;
    max-width: 100% !important;
    margin: 1rem 0 !important;
    padding: 0.5rem 0;
  }
  
  .katex {
    font-size: 0.9em !important;
  }
  
  .katex-display > .katex {
    white-space: nowrap !important;
    max-width: none !important;
  }
  
  .katex-display::-webkit-scrollbar {
    height: 4px;
  }
  
  .katex-display::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
  }
  
  .katex-display::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }
  
  .markdown-content {
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
  }
 
  .code-block-container::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }
  
  .code-block-container::-webkit-scrollbar-track {
    background: #2d3748;
    border-radius: 3px;
  }
  
  .code-block-container::-webkit-scrollbar-thumb {
    background: #4a5568;
    border-radius: 3px;
  }
`;

export const hasLatex = (text: string): boolean => {
  const inlineMath = /\$[^$\n]+\$/g;
  const displayMath = /\$\$[\s\S]+?\$\$/g;
  const latexCommands = /\\[a-zA-Z]+/g;

  return (
    inlineMath.test(text) || displayMath.test(text) || latexCommands.test(text)
  );
};

export default function MarkdownRenderer({ children }: { children: string }) {
  const messageHasLatex = hasLatex(children);

  return (
    <ReactMarkdown
      remarkPlugins={messageHasLatex ? [remarkMath] : []}
      rehypePlugins={messageHasLatex ? [rehypeKatex] : []}
      components={{
        code: CodeBlock,
        pre: ({ children, ...props }) => <pre {...props}>{children}</pre>,
        span: ({ node: _node, className, children, ...props }) => {
          if (className?.includes("katex")) {
            return (
              <span
                className={`${className} text-sm`}
                style={{ fontSize: "1em" }}
                {...props}
              >
                {children}
              </span>
            );
          }
          return (
            <span className={className} {...props}>
              {children}
            </span>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
