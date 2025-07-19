import ReactMarkdown, { Components } from 'react-markdown';
import Link from '@workspace/ui/components/link';
import rehypeSanitize from 'rehype-sanitize';
import { Check, Copy } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Base64 } from 'js-base64';
import { useState } from 'react';

interface MarkdownContentProps {
  content: string;
  encoding: 'base64' | 'utf8';
}

function decodeBase64Content(content: string): string {
  try {
    return Base64.decode(content);
  } catch (error) {
    console.error('Failed to decode base64 content:', error);
    return 'Error: Unable to decode content. The file may be corrupted or not properly encoded.';
  }
}

interface CopyButtonProps {
  text: string;
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-neutral-800 p-1.5 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mt-0 mb-4 text-2xl font-bold text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-6 mb-3 text-xl font-semibold text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-5 mb-2 text-lg font-medium text-white">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-4 mb-2 text-base font-medium text-white">{children}</h4>,
  p: ({ children }) => <p className="mb-4 inline leading-relaxed text-neutral-300">{children}</p>,
  ul: ({ children }) => {
    return (
      <ul className="mb-4 ml-5 list-outside list-disc space-y-1 text-neutral-300">{children}</ul>
    );
  },
  ol: ({ children }) => {
    return (
      <ol className="mb-4 ml-5 list-outside list-decimal space-y-1 text-neutral-300">{children}</ol>
    );
  },
  li: ({ children }) => {
    return <li className="pl-1 text-neutral-300">{children}</li>;
  },
  a: ({ href, children }) => (
    <Link
      href={href || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 underline hover:text-blue-300"
    >
      {children}
    </Link>
  ),
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt || ''}
      className="my-3 h-auto max-w-full rounded-lg border border-neutral-800"
    />
  ),
  pre: ({ children, node }) => {
    const extractTextFromChildren = (children: any): string => {
      if (!children) return '';
      if (typeof children === 'string') return children;
      if (Array.isArray(children)) {
        return children.map(extractTextFromChildren).join('');
      }
      if (typeof children === 'object' && children !== null) {
        if ('props' in children && children.props) {
          return extractTextFromChildren(children.props.children);
        }
      }
      return String(children);
    };
    const codeText = extractTextFromChildren(children);

    return (
      <div className="relative my-3 border border-neutral-700 bg-neutral-900 p-2">
        <div className="flex flex-row">
          <pre className="m-0 w-full overflow-x-auto pr-10 whitespace-pre">{children}</pre>
          <div className="absolute inset-y-0 right-2 flex items-center">
            <CopyButton text={codeText} />
          </div>
        </div>
      </div>
    );
  },
  code: ({ children, className }) => {
    const isInline = !className;
    return isInline ? (
      <code className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-sm text-neutral-200">
        {children}
      </code>
    ) : (
      <code className={`${className || ''} font-mono whitespace-pre`}>{children}</code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-neutral-600 pl-4 text-neutral-400 italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <table className="my-4 w-full border-collapse border border-neutral-800">{children}</table>
  ),
  th: ({ children }) => (
    <th className="border border-neutral-800 bg-neutral-900 px-4 py-2 text-left font-medium text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-neutral-800 px-4 py-2 text-neutral-300">{children}</td>
  ),
  hr: () => <hr className="my-6 border-neutral-700" />,
};

export function MarkdownContent({ content, encoding }: MarkdownContentProps) {
  const decodedContent = encoding === 'base64' ? decodeBase64Content(content) : content;

  return (
    <div className="prose prose-invert prose-neutral markdown-content max-w-none">
      <style jsx global>{`
        .markdown-content ul ul,
        .markdown-content ol ol,
        .markdown-content ul ol,
        .markdown-content ol ul {
          margin-left: 2rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .markdown-content pre {
          white-space: pre-wrap !important;
          position: relative !important;
        }
        .markdown-content pre code {
          display: block !important;
          overflow-x: auto !important;
          padding: 0.5rem !important;
          white-space: pre !important;
        }
        .markdown-content li > p {
          margin-bottom: 0.25rem !important;
          display: inline-block !important;
        }
        .markdown-content li > ul,
        .markdown-content li > ol {
          margin-top: 0.25rem !important;
        }
        .markdown-content code {
          white-space: pre !important;
        }
        .markdown-content ul {
          list-style-type: disc !important;
          list-style-position: outside !important;
        }
        .markdown-content ol {
          list-style-type: decimal !important;
          list-style-position: outside !important;
        }
        .markdown-content ul ul {
          list-style-type: circle !important;
        }
        .markdown-content ul ul ul {
          list-style-type: square !important;
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={markdownComponents}
      >
        {decodedContent}
      </ReactMarkdown>
    </div>
  );
}
