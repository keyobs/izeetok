import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testing/renderWithProviders.tsx';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import LaboratoryPage from './LaboratoryPage.tsx';

describe('LaboratoryPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders without crashing', () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    renderWithProviders(<LaboratoryPage />);

    expect(screen.getByRole('heading', { name: 'Laboratoire de stratégies' })).toBeInTheDocument();
  });

  it('runs a backtest and shows results with baselines and Monte Carlo', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    const user = userEvent.setup();

    renderWithProviders(<LaboratoryPage />);

    await user.click(screen.getByTestId('run-experiment-button'));

    await waitFor(() => expect(screen.getByTestId('experiment-results')).toBeInTheDocument(), { timeout: 10000 });
    expect(screen.getByTestId('baseline-comparison').querySelectorAll('tbody tr')).toHaveLength(5);
    expect(screen.getByTestId('monte-carlo')).toBeInTheDocument();
    expect(screen.getAllByTestId('experiment-row')).toHaveLength(1);
  });
});
