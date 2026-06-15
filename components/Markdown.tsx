"use client";

// Lightweight markdown renderer for assistant replies.
//
// The model streams Markdown (bold, bullet/number lists, short paragraphs,
// inline code, the occasional table). Rendering it as raw text showed literal
// `**…**` and `-` — this component renders it cleanly, styled to match the warm
// editorial theme (semantic tokens, tight spacing). react-markdown + remark-gfm
// (GitHub-flavored: tables, strikethrough, autolinks). See CLAUDE.md deps.

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Theme-matched element renderers. Tight spacing so a chat bubble doesn't feel
// like a document; uses the same semantic tokens as the rest of /dashboard.
const components: Components = {
  p: ({ children }) => <p className="leading-relaxed my-1.5 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc pl-4 my-1.5 space-y-1 marker:text-faint2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 my-1.5 space-y-1 marker:text-faint2">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
  h1: ({ children }) => <h3 className="font-serif font-bold text-base mt-3 mb-1.5 first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="font-serif font-bold text-base mt-3 mb-1.5 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="font-semibold text-sm mt-2.5 mb-1 first:mt-0">{children}</h4>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accentfg underline underline-offset-2 hover:text-ink transition-colors">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="bg-tint/[0.06] border border-subtle rounded px-1 py-0.5 text-[0.85em] tnum">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-tint/[0.04] border border-subtle rounded-xl p-3 my-2 overflow-x-auto text-[0.85em] leading-relaxed">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-accentfg/30 pl-3 my-2 text-muted italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-line" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-[0.9em] border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left font-semibold border-b border-line2 px-2 py-1.5">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-line px-2 py-1.5 tnum">{children}</td>,
};

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm text-ink2">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
