import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import CodeBlock from "./CodeBlock";

export const latexStyles = `
  .katex-display {
    overflow-x: auto !important;
    overflow-y: hidden !important;
    max-width: 100% !important;
    margin: 1.5rem 0 !important;
    padding: 0.75rem 0;
  }
  
  .katex {
    font-size: 1rem !important;
  }
  
  .katex-display > .katex {
    white-space: nowrap !important;
    max-width: none !important;
  }
  
  .katex-display::-webkit-scrollbar {
    height: 6px;
  }
  
  .katex-display::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 3px;
  }
  
  .katex-display::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
  
  .katex-display::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  /* Dark mode scrollbars for katex */
  .dark .katex-display::-webkit-scrollbar-track {
    background: #374151;
  }
  
  .dark .katex-display::-webkit-scrollbar-thumb {
    background: #6b7280;
  }
  
  .dark .katex-display::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
  
  .markdown-content {
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    line-height: 1.7;
    font-size: 15px;
    color: #374151;
  }

  .dark .markdown-content {
    color: #e5e5e5;
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

  .enhanced-markdown {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    line-height: 1.7;
    color: #1f2937;
    max-width: none;
  }

  .dark .enhanced-markdown {
    color: #e5e5e5;
  }

  .enhanced-markdown h1 {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.25;
    margin: 2rem 0 1rem 0;
    color: #111827;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 0.5rem;
  }

  .dark .enhanced-markdown h1 {
    color: #f9fafb;
    border-bottom-color: rgba(255, 255, 255, 0.12);
  }

  .enhanced-markdown h2 {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
    margin: 1.75rem 0 0.75rem 0;
    color: #1f2937;
  }

  .dark .enhanced-markdown h2 {
    color: #f3f4f6;
  }

  .enhanced-markdown h3 {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.4;
    margin: 1.5rem 0 0.5rem 0;
    color: #374151;
  }

  .dark .enhanced-markdown h3 {
    color: #e5e7eb;
  }

  .enhanced-markdown h4 {
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.4;
    margin: 1.25rem 0 0.5rem 0;
    color: #4b5563;
  }

  .dark .enhanced-markdown h4 {
    color: #d1d5db;
  }

  .enhanced-markdown h5, .enhanced-markdown h6 {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    margin: 1rem 0 0.5rem 0;
    color: #6b7280;
  }

  .dark .enhanced-markdown h5, .dark .enhanced-markdown h6 {
    color: #9ca3af;
  }

  .enhanced-markdown p {
    margin: 0 0 1.25rem 0;
    line-height: 1.7;
    font-size: 15px;
  }

  .enhanced-markdown ul, .enhanced-markdown ol {
    margin: 1rem 0 1.25rem 0;
    padding-left: 1.5rem;
  }

  .enhanced-markdown li {
    margin: 0.5rem 0;
    line-height: 1.6;
  }

  .enhanced-markdown li > ul, .enhanced-markdown li > ol {
    margin: 0.5rem 0;
  }

  .enhanced-markdown blockquote {
    margin: 1.5rem 0;
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-left: 4px solid #3b82f6;
    border-radius: 0 0.375rem 0.375rem 0;
    font-style: italic;
    color: #374151;
  }

  .dark .enhanced-markdown blockquote {
    background: #374151;
    border-left-color: #5b9bd5;
    color: #e5e7eb;
  }

  .enhanced-markdown blockquote p {
    margin: 0;
  }

  .enhanced-markdown strong {
    font-weight: 600;
    color: #111827;
  }

  .dark .enhanced-markdown strong {
    color: #f9fafb;
  }

  .enhanced-markdown em {
    font-style: italic;
    color: #374151;
  }

  .dark .enhanced-markdown em {
    color: #d1d5db;
  }

  .enhanced-markdown code:not(pre code) {
    background: #f3f4f6;
    color: #dc2626;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    border: 1px solid #e5e7eb;
  }

  .dark .enhanced-markdown code:not(pre code) {
    background: #4b5563;
    color: #fca5a5;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .enhanced-markdown pre {
    margin: 1.5rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  }

  .dark .enhanced-markdown pre {
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.2);
  }

  .enhanced-markdown table {
    width: 100%;
    margin: 1.5rem 0;
    border-collapse: collapse;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  }

  .dark .enhanced-markdown table {
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3);
  }

  .enhanced-markdown th {
    background: #f9fafb;
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
  }

  .dark .enhanced-markdown th {
    background: #4b5563;
    color: #f3f4f6;
    border-bottom-color: rgba(255, 255, 255, 0.12);
  }

  .enhanced-markdown td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .dark .enhanced-markdown td {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .enhanced-markdown tr:last-child td {
    border-bottom: none;
  }

  .enhanced-markdown hr {
    margin: 2rem 0;
    border: none;
    height: 1px;
    background: linear-gradient(to right, transparent, #e5e7eb, transparent);
  }

  .dark .enhanced-markdown hr {
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.12), transparent);
  }

  .enhanced-markdown a {
    color: #3b82f6;
    text-decoration: underline;
    text-decoration-color: #93c5fd;
    text-underline-offset: 2px;
    transition: all 0.2s ease;
  }

  .enhanced-markdown a:hover {
    color: #1d4ed8;
    text-decoration-color: #3b82f6;
  }

  .dark .enhanced-markdown a {
    color: #5b9bd5;
    text-decoration-color: #93c5fd;
  }

  .dark .enhanced-markdown a:hover {
    color: #4a8bc7;
    text-decoration-color: #5b9bd5;
  }

  /* Better spacing for consecutive elements */
  .enhanced-markdown h1 + p,
  .enhanced-markdown h2 + p,
  .enhanced-markdown h3 + p,
  .enhanced-markdown h4 + p,
  .enhanced-markdown h5 + p,  
  .enhanced-markdown h6 + p {
    margin-top: 0.5rem;
  }

  .enhanced-markdown p + h2,
  .enhanced-markdown p + h3,
  .enhanced-markdown p + h4 {
    margin-top: 2rem;
  }

  .enhanced-markdown ul + h2,
  .enhanced-markdown ul + h3,
  .enhanced-markdown ol + h2,
  .enhanced-markdown ol + h3 {
    margin-top: 2rem;
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
    <div className="enhanced-markdown markdown-content">
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
                  className={`${className}`}
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
          p: ({ children, ...props }) => <p {...props}>{children}</p>,
          h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
          h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
          h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
          ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
          ol: ({ children, ...props }) => <ol {...props}>{children}</ol>,
          li: ({ children, ...props }) => <li {...props}>{children}</li>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}