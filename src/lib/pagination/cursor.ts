/**
 * Cursor-Based Pagination Utilities
 *
 * Provides utilities for implementing efficient cursor-based pagination
 * instead of offset-based pagination for better performance at scale.
 */

export interface Cursor {
  createdAt: string;
  id: string;
}

/**
 * Encodes a cursor to a base64 string for URL safety
 */
export function encodeCursor(cursor: Cursor): string {
  const data = JSON.stringify({ createdAt: cursor.createdAt, id: cursor.id });
  return Buffer.from(data).toString('base64url');
}

/**
 * Decodes a base64 cursor string back to a Cursor object
 */
export function decodeCursor(cursorString: string): Cursor | null {
  try {
    const data = Buffer.from(cursorString, 'base64url').toString('utf-8');
    const parsed = JSON.parse(data);
    if (typeof parsed.createdAt === 'string' && typeof parsed.id === 'string') {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts cursor from the last item in a list
 */
export function extractCursor<T extends { created_at: string | null; id: string }>(
  items: T[],
): Cursor | null {
  if (items.length === 0) {
    return null;
  }

  const lastItem = items[items.length - 1];
  if (!lastItem || !lastItem.created_at || !lastItem.id) {
    return null;
  }

  return {
    createdAt: lastItem.created_at,
    id: lastItem.id,
  };
}

/**
 * Creates a cursor-based query filter for Supabase
 * Returns a filter function that can be chained on a query builder
 */
export function createCursorFilter(cursor: Cursor | null) {
  if (!cursor) {
    return (query: {
      lt: (column: string, value: unknown) => unknown;
      and: (filter: string) => unknown;
    }) => query;
  }

  return (query: {
    lt: (column: string, value: unknown) => unknown;
    or: (filter: string) => unknown;
    and: (filter: string) => unknown;
  }) => {
    // For descending order (newest first):
    // created_at < cursor.createdAt OR (created_at = cursor.createdAt AND id < cursor.id)
    const filter = `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
    return query.or(filter);
  };
}

/**
 * Pagination result with cursor information
 */
export interface CursorPaginationResult<T> {
  items: T[];
  hasNext: boolean;
  nextCursor: string | null;
  // For backward compatibility, provide approximate count
  // (cursor pagination doesn't provide exact counts efficiently)
  estimatedTotal?: number | null;
}


