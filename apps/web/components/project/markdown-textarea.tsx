'use client';

import { Button } from '@workspace/ui/components/button';
import { MarkdownContent } from './markdown-content';
import { Eye, Edit, Split } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { useState } from 'react';
import * as React from 'react';

interface MarkdownTextareaProps extends Omit<React.ComponentProps<'textarea'>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export function MarkdownTextarea({
  value = '',
  onChange,
  placeholder = 'Write your markdown here...',
  className,
  ...props
}: MarkdownTextareaProps) {
  const [content, setContent] = useState(value);
  const [mode, setMode] = useState<'write' | 'preview' | 'split'>('write');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange?.(newValue);
  };

  React.useEffect(() => {
    setContent(value);
  }, [value]);

  return (
    <div className={cn('rounded-md border', className)}>
      <div className="bg-muted/30 flex items-center justify-between border-b p-2">
        <div className="flex items-center gap-1">
          <Button
            variant={mode === 'write' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setMode('write')}
          >
            <Edit className="mr-1 h-4 w-4" />
            Write
          </Button>
          <Button
            variant={mode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setMode('preview')}
          >
            <Eye className="mr-1 h-4 w-4" />
            Preview
          </Button>
          <Button
            variant={mode === 'split' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setMode('split')}
          >
            <Split className="mr-1 h-4 w-4" />
            Split
          </Button>
        </div>
      </div>

      <div className="min-h-[200px]">
        {mode === 'write' && (
          <Textarea
            value={content}
            onChange={handleChange}
            placeholder={placeholder}
            className="min-h-[200px] resize-none rounded-none border-0"
            {...props}
          />
        )}

        {mode === 'preview' && (
          <div className="min-h-[200px] border-0">
            <MarkdownContent content={content} />
          </div>
        )}

        {mode === 'split' && (
          <div className="grid min-h-[200px] grid-cols-2">
            <div className="border-r">
              <Textarea
                value={content}
                onChange={handleChange}
                placeholder={placeholder}
                className="min-h-[200px] resize-none rounded-none border-0"
                {...props}
              />
            </div>
            <div>
              <MarkdownContent content={content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
