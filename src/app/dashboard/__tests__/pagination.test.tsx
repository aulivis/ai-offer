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
  it('renders numbered pagination and triggers handler for next page', () => {
    const onClick = vi.fn();
    render(<LoadMoreButton currentPage={1} hasNext onClick={onClick} />);

    const currentPageButton = screen.getByRole('button', { name: '1' });
    expect(currentPageButton).toBeDisabled();
    expect(currentPageButton).toHaveAttribute('aria-current', 'page');

    const nextPageButton = screen.getByRole('button', { name: '2' });
    expect(nextPageButton).not.toBeDisabled();

    nextPageButton.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on next button', () => {
    render(<LoadMoreButton currentPage={2} hasNext isLoading onClick={() => {}} />);

    const buttons = screen.getAllByRole('button');
    const nextPageButton = buttons[buttons.length - 1];
    expect(nextPageButton).toBeDisabled();
    expect(nextPageButton).toHaveAttribute('aria-busy', 'true');
    expect(nextPageButton).toHaveTextContent('…');
  });
});
