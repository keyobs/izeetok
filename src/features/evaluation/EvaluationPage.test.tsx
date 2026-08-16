import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testing/renderWithProviders.tsx';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import EvaluationPage from './EvaluationPage.tsx';

const STORAGE_KEY = 'izeetok:evaluated-grid';

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

  it('evaluates the grid when pressing Enter instead of clicking the button', async () => {
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
    await user.keyboard('{Enter}');

    await waitFor(() => expect(screen.getAllByTestId('score-card')).toHaveLength(4));
  });

  it('flags a grid that never appeared in the available history', async () => {
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

    await waitFor(() =>
      expect(screen.getByTestId('exact-match-banner')).toHaveTextContent("n'est jamais sortie"),
    );
  });

  it('flags a grid that exactly matches a past draw, with its date', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    const user = userEvent.setup();

    renderWithProviders(<EvaluationPage />);

    const numbers = [21, 23, 33, 35, 47];
    const stars = [6, 7];
    for (const [index, value] of numbers.entries()) {
      await user.type(screen.getByTestId(`number-input-${index}`), String(value));
    }
    for (const [index, value] of stars.entries()) {
      await user.type(screen.getByTestId(`star-input-${index}`), String(value));
    }
    await user.click(screen.getByTestId('evaluate-button'));

    await waitFor(() =>
      expect(screen.getByTestId('exact-match-banner')).toHaveTextContent('déjà sortie le 2020-02-04'),
    );
  });

  it('flags when the 5 numbers match a past draw but the stars differ', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    const user = userEvent.setup();

    renderWithProviders(<EvaluationPage />);

    const numbers = [21, 23, 33, 35, 47];
    const stars = [3, 4];
    for (const [index, value] of numbers.entries()) {
      await user.type(screen.getByTestId(`number-input-${index}`), String(value));
    }
    for (const [index, value] of stars.entries()) {
      await user.type(screen.getByTestId(`star-input-${index}`), String(value));
    }
    await user.click(screen.getByTestId('evaluate-button'));

    await waitFor(() =>
      expect(screen.getByTestId('numbers-only-match-banner')).toHaveTextContent('2020-02-04'),
    );
    expect(screen.getByTestId('exact-match-banner')).toHaveTextContent("n'est jamais sortie");
  });

  it('restores the last evaluated grid when the page is remounted', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    const user = userEvent.setup();

    const first = renderWithProviders(<EvaluationPage />);

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

    first.unmount();
    renderWithProviders(<EvaluationPage />);

    for (const [index, value] of numbers.entries()) {
      expect(screen.getByTestId(`number-input-${index}`)).toHaveValue(String(value));
    }
    for (const [index, value] of stars.entries()) {
      expect(screen.getByTestId(`star-input-${index}`)).toHaveValue(String(value));
    }
    await waitFor(() => expect(screen.getAllByTestId('score-card')).toHaveLength(4));
  });

  it('saves the evaluated grid so /geometry can reuse it as reference', async () => {
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

    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({ numbers, stars }),
    );
  });
});
