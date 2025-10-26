import React, { type ReactNode } from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AnalyticsScriptGate from '@/components/consent/AnalyticsScriptGate';
import CookieBar from '../CookieBar';
import { ManageCookiesButton } from '../ManageCookiesButton';
import { PreferencesModal } from '../PreferencesModal';

vi.mock('next/script', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => (
    <script {...props}>{children}</script>
  ),
}));


function ConsentSuite() {
  return (
    <>
      <CookieBar />
      <PreferencesModal />
      <ManageCookiesButton label="Manage cookies" />
      <AnalyticsScriptGate />
    </>
  );
}

describe('cookie consent flow', () => {
  beforeEach(() => {
    document.cookie = `${encodeURIComponent('consent')}=; Max-Age=0; path=/`;
  });

  afterEach(() => {
    cleanup();
    document.cookie = `${encodeURIComponent('consent')}=; Max-Age=0; path=/`;
  });

  it('shows the banner on first visit and loads Google Analytics when accepting all cookies', async () => {
    render(<ConsentSuite />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accept all' })).toBeInTheDocument();
    });

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Accept all' }));

    await waitFor(() => {
      expect(document.querySelector('script[src*="googletagmanager.com"]')).not.toBeNull();
      expect(document.querySelector('script#ga')).not.toBeNull();
    });
  });

  it('allows rejecting analytics cookies and keeps Google Analytics blocked', async () => {
    render(<ConsentSuite />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reject non-essential' })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Reject non-essential' }));

    await waitFor(() => {
      expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();
      expect(document.querySelector('script#ga')).toBeNull();
    });
  });

  it('opens preferences from the manage cookies link and toggles analytics scripts on the fly', async () => {
    const user = userEvent.setup();

    render(<ConsentSuite />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accept all' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Accept all' }));

    await waitFor(() => {
      expect(document.querySelector('script[src*="googletagmanager.com"]')).not.toBeNull();
    });

    await user.click(screen.getByRole('button', { name: 'Manage cookies' }));

    const modal = await screen.findByRole('dialog', { name: 'Sütibeállítások' });
    const switches = within(modal).getAllByRole('switch');
    const analyticsSwitch = switches[1];

    await user.click(analyticsSwitch);
    await user.click(within(modal).getByRole('button', { name: 'Mentés' }));

    await waitFor(() => {
      expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();
      expect(document.querySelector('script#ga')).toBeNull();
    });

    await user.click(screen.getByRole('button', { name: 'Manage cookies' }));

    const reopenedModal = await screen.findByRole('dialog', { name: 'Sütibeállítások' });
    const reopenedSwitches = within(reopenedModal).getAllByRole('switch');
    const reopenedAnalyticsSwitch = reopenedSwitches[1];

    await user.click(reopenedAnalyticsSwitch);
    await user.click(within(reopenedModal).getByRole('button', { name: 'Mentés' }));

    await waitFor(() => {
      expect(document.querySelector('script[src*="googletagmanager.com"]')).not.toBeNull();
      expect(document.querySelector('script#ga')).not.toBeNull();
    });
  });
});

describe('accessibility regressions', () => {
  beforeEach(() => {
    document.cookie = `${encodeURIComponent('consent')}=; Max-Age=0; path=/`;
  });

  afterEach(() => {
    cleanup();
    document.cookie = `${encodeURIComponent('consent')}=; Max-Age=0; path=/`;
  });

  it('allows navigating the banner actions with the keyboard', async () => {
    const user = userEvent.setup();

    render(<ConsentSuite />);

    const customize = await screen.findByRole('button', { name: 'Customize' });
    const reject = screen.getByRole('button', { name: 'Reject non-essential' });
    const accept = screen.getByRole('button', { name: 'Accept all' });

    await user.tab();
    expect(customize).toHaveFocus();

    await user.tab();
    expect(reject).toHaveFocus();

    await user.tab();
    expect(accept).toHaveFocus();
  });

  it('focus-traps the preferences modal and exposes proper ARIA relationships', async () => {
    const user = userEvent.setup();

    render(<ConsentSuite />);

    await user.click(await screen.findByRole('button', { name: 'Manage cookies' }));

    const modal = await screen.findByRole('dialog', { name: 'Sütibeállítások' });
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal.getAttribute('aria-describedby')).toBeTruthy();

    const switches = within(modal).getAllByRole('switch');
    const analyticsSwitch = switches[1];
    const marketingSwitch = switches[2];
    const cancelButton = within(modal).getByRole('button', { name: 'Mégse' });
    const saveButton = within(modal).getByRole('button', { name: 'Mentés' });

    await waitFor(() => {
      expect(analyticsSwitch).toHaveFocus();
    });

    await user.tab();
    expect(marketingSwitch).toHaveFocus();

    await user.tab();
    expect(cancelButton).toHaveFocus();

    await user.tab();
    expect(saveButton).toHaveFocus();

    await user.tab();
    expect(analyticsSwitch).toHaveFocus();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Sütibeállítások' })).toBeNull();
    });
  });
});
