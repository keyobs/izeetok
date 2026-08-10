import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../shared/renderWithProviders.tsx';
import { REAL_CSV_TEXT } from '../../shared/testCsvFixture.ts';
import EvaluationPage from './EvaluationPage.tsx';

describe('EvaluationPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders without crashing', () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<EvaluationPage />);

    expect(screen.getByRole('heading', { name: "Évaluation d'une grille" })).toBeInTheDocument();
  });

  it('evaluates a filled-in grid into four scores and three variations', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    const user = userEvent.setup();

    renderWithProviders(<EvaluationPage />);

    const numbers = [3, 7, 19, 31, 42];
    const stars = [2, 9];
    for (const [index, value] of numbers.entries()) {
      await user.type(screen.getByTestId(`number-input-${index}`), String(value));
    }
    for (const [index, value] of stars.entries()) {
      await user.type(screen.getByTestId(`star-input-${index}`), String(value));
    }
    await user.click(screen.getByTestId('evaluate-button'));

    await waitFor(() => expect(screen.getAllByTestId('score-card')).toHaveLength(4));
    expect(screen.getByTestId('variations').querySelectorAll('li')).toHaveLength(3);
  });
});
