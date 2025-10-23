import * as React from 'react';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cls = [
    'rounded-3xl border border-border bg-bg-muted/70 backdrop-blur shadow-card',
    className,
  ].filter(Boolean).join(' ');
  return <div className={cls} {...props} />;
}
