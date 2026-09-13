"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CodeBlock } from "./CodeBlock";

/**
 * Renders assistant Markdown: headings, lists, tables, blockquotes, links,
 * inline code, and fenced code blocks (with syntax highlighting + copy +
 * preview via CodeBlock).
 */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-syafx">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          pre: ({ children }) => {
            // Extract the underlying <code> to render our custom block.
            const child: any = Array.isArray(children) ? children[0] : children;
            const className: string = child?.props?.className || "";
            const match = /language-(\w+)/.exec(className);
            const raw = child?.props?.children;
            const codeText = Array.isArray(raw) ? raw.join("") : String(raw ?? "");
            return (
              <CodeBlock
                language={match?.[1] || ""}
                code={codeText.replace(/\n$/, "")}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
