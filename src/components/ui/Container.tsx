'use client';

import * as React from 'react';

export type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Container type */
  type?: 'inline-size' | 'block-size' | 'size' | 'normal';
  /** Container name for named container queries */
  name?: string;
  /** Children */
  children: React.ReactNode;
};

/**
 * Container component for container queries
 *
 * Wraps content in a container context that enables container queries.
 * Container queries allow components to respond to their container's size
 * rather than the viewport size.
 *
 * @example
 * ```tsx
 * <Container type="inline-size" name="card">
 *   <div className="container-responsive">
 *     Content that adapts to container size
 *   </div>
 * </Container>
 * ```
 */
export function Container({
  type = 'inline-size',
  name,
  className = '',
  children,
  style,
  ...props
}: ContainerProps) {
  const containerStyle: React.CSSProperties = {
    containerType: type,
    ...(name && { containerName: name }),
    ...style,
  };

  const cls = ['container', className].filter(Boolean).join(' ');

  return (
    <div className={cls} style={containerStyle} {...props}>
      {children}
    </div>
  );
}
