'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

/**
 * RAGAnswer Component
 * Renders grounded executive responses with full GitHub-Flavored Markdown (GFM)
 * and HTML entity support via rehype-raw. Features responsive table wrappers
 * with horizontal scrolling and sleek cyber-dark styling.
 */
export default function RAGAnswer({ content, className = '' }) {
    if (!content) return null;

    return (
        <div className={`rag-answer-container text-xs text-slate-200 leading-relaxed font-sans ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    // Custom responsive table wrapper preventing layout clipping
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto max-w-full my-4 rounded-xl border border-indigo-500/30 bg-slate-950/80 shadow-md shadow-indigo-950/20">
                            <table className="w-full text-left border-collapse text-xs text-slate-200 min-w-[500px]" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className="bg-gradient-to-r from-indigo-950/90 to-slate-900 border-b border-indigo-500/30 text-indigo-200 uppercase tracking-wider text-[11px] font-semibold" {...props} />
                    ),
                    tbody: ({ node, ...props }) => (
                        <tbody className="divide-y divide-indigo-950/50" {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                        <tr className="hover:bg-indigo-900/15 transition-colors" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="px-4 py-2.5 font-bold text-slate-100 border-r border-indigo-500/20 last:border-r-0 whitespace-nowrap" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-4 py-2 text-slate-300 border-r border-indigo-500/10 last:border-r-0 align-top" {...props} />
                    ),
                    // Typography elements
                    h1: ({ node, ...props }) => (
                        <h1 className="text-base font-extrabold text-white mt-4 mb-2 tracking-tight flex items-center gap-2 border-b border-indigo-500/20 pb-1" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="text-sm font-bold text-indigo-200 mt-3.5 mb-1.5 tracking-tight flex items-center gap-1.5" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-xs font-bold text-indigo-300 mt-3 mb-1 uppercase tracking-wider" {...props} />
                    ),
                    h4: ({ node, ...props }) => (
                        <h4 className="text-xs font-semibold text-violet-300 mt-2 mb-1" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                        <p className="my-2 leading-relaxed text-slate-300" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul className="my-2.5 ml-4 space-y-1.5 list-disc list-outside marker:text-indigo-400 text-slate-300" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className="my-2.5 ml-4 space-y-1.5 list-decimal list-outside marker:text-indigo-400 font-medium text-slate-300" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                        <li className="leading-relaxed pl-1" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                        <strong className="font-bold text-white bg-indigo-950/40 px-1 py-0.5 rounded border border-indigo-500/20" {...props} />
                    ),
                    em: ({ node, ...props }) => (
                        <em className="text-slate-200 italic" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="my-3 pl-3 py-1.5 border-l-2 border-indigo-500 bg-indigo-950/30 rounded-r-lg text-slate-300 italic text-[11px]" {...props} />
                    ),
                    code: ({ node, inline, ...props }) => (
                        <code className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-medium" {...props} />
                    ),
                    hr: ({ node, ...props }) => (
                        <hr className="my-3 border-indigo-500/20" {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
