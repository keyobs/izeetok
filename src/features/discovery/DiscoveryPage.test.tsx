import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../testing/renderWithProviders.tsx';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import DiscoveryPage from './DiscoveryPage.tsx';

describe('DiscoveryPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders without crashing and shows families and the null-hypothesis comparison once loaded', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<DiscoveryPage />);

    expect(screen.getByRole('heading', { name: 'Discovery Engine' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('family-card').length).toBeGreaterThan(0), { timeout: 10000 });
    expect(screen.getByTestId('null-hypothesis')).toBeInTheDocument();
    expect(screen.getAllByTestId('stability-badge').length).toBeGreaterThan(0);
  });
});
