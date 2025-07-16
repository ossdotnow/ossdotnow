import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Link from '@workspace/ui/components/link';

interface MarkdownContentProps {
  content: string;
  encoding: 'base64' | 'utf8';
}

function decodeBase64Content(content: string): string {
  try {
    return atob(content);
  } catch (error) {
    console.error('Failed to decode base64 content:', error);
    return 'Error: Unable to decode content. The file may be corrupted or not properly encoded.';
  }
}

export function MarkdownContent({ content, encoding }: MarkdownContentProps) {
  const decodedContent = encoding === 'base64' ? decodeBase64Content(content) : content;

  return (
    <div className="prose prose-invert prose-neutral max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white mb-4 mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-white mb-3 mt-6">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-white mb-2 mt-5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium text-white mb-2 mt-4">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-neutral-300 mb-4 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-neutral-300 mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-neutral-300">
              {children}
            </li>
          ),
          a: ({ href, children }) => (
            <Link
              href={href || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {children}
            </Link>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg border border-neutral-800 my-4"
            />
          ),
          pre: ({ children }) => (
            <pre className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg overflow-x-auto my-4">
              {children}
            </pre>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-sm text-neutral-200 font-mono">
                {children}
              </code>
            ) : (
              <code className={className}>
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-neutral-600 pl-4 my-4 text-neutral-400 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <table className="w-full border-collapse border border-neutral-800 my-4">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="border border-neutral-800 px-4 py-2 bg-neutral-900 text-left text-white font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-neutral-800 px-4 py-2 text-neutral-300">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="border-neutral-700 my-6" />
          ),
        }}
      >
        {decodedContent}
      </ReactMarkdown>
    </div>
  );
}