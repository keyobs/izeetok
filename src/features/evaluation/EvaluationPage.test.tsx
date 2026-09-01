import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../testing/renderWithProviders.tsx';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import EvaluationPage from './EvaluationPage.tsx';

const STORAGE_KEY = 'izeetok:evaluated-grid';

const seedEvaluatedGrid = (numbers: number[], stars: number[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ numbers, stars }));
};

describe('EvaluationPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<EvaluationPage />);

    expect(screen.getByRole('heading', { name: "Évaluation d'une grille" })).toBeInTheDocument();
  });

  it('shows a hint instead of results when no grid has been evaluated yet', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<EvaluationPage />);

    expect(await screen.findByTestId('no-grid-hint')).toBeInTheDocument();
    expect(screen.queryByTestId('evaluation-results')).not.toBeInTheDocument();
  });

  it('evaluates the grid already saved into four scores and three variations', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    seedEvaluatedGrid([3, 7, 19, 31, 42], [2, 9]);

    renderWithProviders(<EvaluationPage />);

    await waitFor(() => expect(screen.getAllByTestId('score-card')).toHaveLength(4));
    expect(screen.getByTestId('variations').querySelectorAll('li')).toHaveLength(3);
  });

  it('flags a grid that never appeared in the available history', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    seedEvaluatedGrid([3, 7, 19, 31, 42], [2, 9]);

    renderWithProviders(<EvaluationPage />);

    await waitFor(() =>
      expect(screen.getByTestId('exact-match-banner')).toHaveTextContent("n'est jamais sortie"),
    );
  });

  it('flags a grid that exactly matches a past draw, with its date', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    seedEvaluatedGrid([21, 23, 33, 35, 47], [6, 7]);

    renderWithProviders(<EvaluationPage />);

    await waitFor(() =>
      expect(screen.getByTestId('exact-match-banner')).toHaveTextContent('déjà sortie le 2020-02-04'),
    );
  });

  it('flags when the 5 numbers match a past draw but the stars differ', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    seedEvaluatedGrid([21, 23, 33, 35, 47], [3, 4]);

    renderWithProviders(<EvaluationPage />);

    await waitFor(() =>
      expect(screen.getByTestId('numbers-only-match-banner')).toHaveTextContent('2020-02-04'),
    );
    expect(screen.getByTestId('exact-match-banner')).toHaveTextContent("n'est jamais sortie");
  });
});
