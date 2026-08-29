import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testing/renderWithProviders.tsx';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import DrawsPage from './DrawsPage.tsx';

const STORAGE_KEY = 'izeetok:evaluated-grid';

describe('DrawsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('renders without crashing and lists the latest draws once loaded', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<DrawsPage />);

    expect(screen.getByRole('heading', { name: 'Tirages' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('draw-row')).toHaveLength(50));
  });

  it('disables the highlight toggle when no grid has been evaluated yet', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<DrawsPage />);

    await waitFor(() => expect(screen.getByTestId('highlight-toggle')).toBeDisabled());
  });

  it('lets the user toggle highlighting once a grid has been evaluated', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] }));
    const user = userEvent.setup();

    renderWithProviders(<DrawsPage />);

    const toggle = await screen.findByTestId('highlight-toggle');
    expect(toggle).toBeEnabled();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });
});
