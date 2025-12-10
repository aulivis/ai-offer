'use client';

import * as React from 'react';
import { H2, H3, H4, type HeadingProps } from './Heading';

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  /** Add visual separator above section */
  withSeparator?: boolean;
  /** Spacing variant */
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
};

/**
 * Section component for consistent section spacing and visual breaks
 */
export function Section({
  children,
  className = '',
  withSeparator = false,
  spacing = 'lg',
}: SectionProps) {
  const spacingClasses = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
    xl: 'space-y-12',
  };

  const separatorClass = withSeparator ? 'border-t border-border pt-8 mt-8' : '';

  return (
    <section className={`${spacingClasses[spacing]} ${separatorClass} ${className}`.trim()}>
      {children}
    </section>
  );
}

type SectionHeaderProps = {
  title: string;
  description?: string;
  level?: HeadingProps['level'];
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Section header component for consistent section titles
 */
export function SectionHeader({
  title,
  description,
  level = 'h2',
  actions,
  className = '',
}: SectionHeaderProps) {
  const HeadingComponent = level === 'h2' ? H2 : level === 'h3' ? H3 : H4;

  return (
    <div
      className={`flex flex-col gap-2 md:flex-row md:items-start md:justify-between ${className}`.trim()}
    >
      <div className="flex-1">
        <HeadingComponent>{title}</HeadingComponent>
        {description && <p className="mt-2 text-sm text-fg-muted max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 mt-2 md:mt-0">{actions}</div>}
    </div>
  );
}

