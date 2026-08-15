import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../testing/renderWithProviders.tsx';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import DrawsPage from './DrawsPage.tsx';

describe('DrawsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders without crashing and lists the latest draws once loaded', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<DrawsPage />);

    expect(screen.getByRole('heading', { name: 'Tirages' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('draw-row')).toHaveLength(50));
  });
});
