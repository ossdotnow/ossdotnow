'use client';

import { default as NextLink, LinkProps } from 'next/link';
import { ComponentPropsWithoutRef } from 'react';
import { track } from '@vercel/analytics/react';
import { cn } from '@workspace/ui/lib/utils';

type Props = ComponentPropsWithoutRef<'a'> &
  LinkProps & {
    event?: string;
    // TODO: add type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventObject?: Record<string, any>;
  };

export default function Link({
  className,
  href,
  children,
  event,
  eventObject,
  onClick,
  ...props
}: Props) {
  return (
    <NextLink
      href={href}
      className={cn(className)}
      {...props}
      onClick={(e) => {
        if (event) {
          track(event, eventObject);
        }
        if (onClick) {
          onClick(e);
        }
      }}
    >
      {children}
    </NextLink>
  );
}
