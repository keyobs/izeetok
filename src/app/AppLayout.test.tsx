import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import EvaluatedGridProvider from '../providers/EvaluatedGridProvider.tsx';
import AppLayout from './AppLayout.tsx';

const STORAGE_KEY = 'izeetok:evaluated-grid';

const renderLayout = () =>
  render(
    <MemoryRouter>
      <EvaluatedGridProvider>
        <AppLayout />
      </EvaluatedGridProvider>
    </MemoryRouter>,
  );

describe('AppLayout', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('renders all nav links', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: 'Évaluation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discovery' })).toBeInTheDocument();
  });

  it('toggles the mobile menu open and closed', async () => {
    const user = userEvent.setup();
    renderLayout();

    const toggle = screen.getByTestId('nav-toggle-button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the mobile menu after clicking a nav link', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByTestId('nav-toggle-button'));
    expect(screen.getByTestId('nav-toggle-button')).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('link', { name: 'Tirages' }));
    expect(screen.getByTestId('nav-toggle-button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the mobile menu when clicking outside of it', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByTestId('nav-toggle-button'));
    expect(screen.getByTestId('nav-toggle-button')).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByTestId('app-content'));
    expect(screen.getByTestId('nav-toggle-button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders the global grid form, available regardless of the current route', () => {
    renderLayout();

    expect(screen.getByTestId('global-grid-form-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('global-grid-submit')).toBeInTheDocument();
  });

  it('submitting the global grid form persists it, so it is restored on the next mount', async () => {
    const user = userEvent.setup();
    renderLayout();

    const numbers = [3, 7, 19, 31, 42];
    const stars = [2, 9];
    for (const [index, value] of numbers.entries()) {
      await user.type(screen.getByTestId(`number-input-${index}`), String(value));
    }
    for (const [index, value] of stars.entries()) {
      await user.type(screen.getByTestId(`star-input-${index}`), String(value));
    }
    await user.click(screen.getByTestId('global-grid-submit'));

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({ numbers, stars });

    renderLayout();
    expect(screen.getAllByTestId('number-input-0')[1]).toHaveValue('3');
  });
});
