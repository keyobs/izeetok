import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../shared/renderWithProviders.tsx';
import { REAL_CSV_TEXT } from '../../shared/testCsvFixture.ts';
import { evaluatedGridRepository } from '../../application/evaluatedGridRepository.ts';
import GeometryPage from './GeometryPage.tsx';

describe('GeometryPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('renders without crashing and shows the gap map and nearest neighbors once loaded', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<GeometryPage />);

    expect(screen.getByRole('heading', { name: 'Géométrie', level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('neighbor-row')).toHaveLength(10));
    expect(screen.getByTestId('gap-map')).toBeInTheDocument();
  });

  it('defaults to the latest draw and disables the "evaluated" source when none was saved', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<GeometryPage />);

    await waitFor(() => expect(screen.getByTestId('reference-grid-banner')).toBeInTheDocument());
    expect(screen.getByTestId('reference-source-latest')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('reference-source-evaluated')).toBeDisabled();
  });

  it('uses the grid evaluated on /evaluation as the reference when one was saved', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    evaluatedGridRepository.save({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    renderWithProviders(<GeometryPage />);

    await waitFor(() =>
      expect(screen.getByTestId('reference-source-evaluated')).toHaveAttribute('aria-checked', 'true'),
    );
    const banner = screen.getByTestId('reference-grid-banner');
    for (const value of [3, 7, 19, 31, 42, 2, 9]) {
      expect(banner).toHaveTextContent(String(value));
    }
  });

  it('lets the user type a grid directly on the page to analyze it', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    const user = userEvent.setup();

    renderWithProviders(<GeometryPage />);
    await waitFor(() => expect(screen.getByTestId('reference-grid-banner')).toBeInTheDocument());

    await user.click(screen.getByTestId('reference-source-custom'));
    expect(screen.getByTestId('custom-grid-empty')).toBeInTheDocument();

    const numbers = [4, 8, 15, 23, 44];
    const stars = [1, 5];
    for (const [index, value] of numbers.entries()) {
      await user.type(screen.getByTestId(`number-input-${index}`), String(value));
    }
    for (const [index, value] of stars.entries()) {
      await user.type(screen.getByTestId(`star-input-${index}`), String(value));
    }
    await user.click(screen.getByTestId('custom-grid-submit'));

    const banner = screen.getByTestId('reference-grid-banner');
    for (const value of [...numbers, ...stars]) {
      expect(banner).toHaveTextContent(String(value));
    }
  });
});
