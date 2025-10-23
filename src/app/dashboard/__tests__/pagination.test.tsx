import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoadMoreButton, mergeOfferPages } from '../offersPagination';

describe('mergeOfferPages', () => {
  it('keeps existing offers and appends new unique ones', () => {
    const previous: Array<{ id: string; title: string }> = [
      { id: '1', title: 'Első' },
      { id: '2', title: 'Második' },
    ];
    const incoming: Array<{ id: string; title: string }> = [
      { id: '2', title: 'Második módosítva' },
      { id: '3', title: 'Harmadik' },
    ];

    const result = mergeOfferPages(previous, incoming);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(previous[0]);
    expect(result[1]).toEqual(previous[1]);
    expect(result[2].id).toBe('3');
  });
});

describe('LoadMoreButton', () => {
  it('renders default label and triggers handler', () => {
    const onClick = vi.fn();
    render(<LoadMoreButton onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'További ajánlatok betöltése' });
    expect(button).toBeInTheDocument();

    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<LoadMoreButton onClick={() => {}} isLoading />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Betöltés…');
  });

  it('applies outline styles when requested', () => {
    render(<LoadMoreButton onClick={() => {}} appearance="outline" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('border-border');
  });
});
