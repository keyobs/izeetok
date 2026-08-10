import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../shared/renderWithProviders.tsx';
import { REAL_CSV_TEXT } from '../../shared/testCsvFixture.ts';
import GeometryPage from './GeometryPage.tsx';

describe('GeometryPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders without crashing and shows the gap map and nearest neighbors once loaded', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<GeometryPage />);

    expect(screen.getByRole('heading', { name: 'Géométrie', level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('neighbor-row')).toHaveLength(10));
    expect(screen.getByTestId('gap-map')).toBeInTheDocument();
  });
});
