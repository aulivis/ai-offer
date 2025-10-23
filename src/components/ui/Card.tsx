import * as React from 'react';

interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  header?: React.ReactNode;
  as?: React.ElementType;
}

export function Card({ header, className, children, as: Component = 'div', ...props }: CardProps) {
  const cls = [
    'rounded-3xl border border-border bg-bg-muted/70 p-6 shadow-card backdrop-blur',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={cls} {...props}>
      {header}
      {children}
    </Component>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cls = ['mb-4 flex flex-col gap-1', className]
    .filter(Boolean)
    .join(' ');

  return <div className={cls} {...props} />;
}
