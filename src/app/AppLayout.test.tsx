import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import AppLayout from './AppLayout.tsx';

describe('AppLayout', () => {
  it('renders all nav links', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Évaluation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discovery' })).toBeInTheDocument();
  });

  it('toggles the mobile menu open and closed', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

    const toggle = screen.getByTestId('nav-toggle-button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the mobile menu after clicking a nav link', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('nav-toggle-button'));
    expect(screen.getByTestId('nav-toggle-button')).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('link', { name: 'Tirages' }));
    expect(screen.getByTestId('nav-toggle-button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the mobile menu when clicking outside of it', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('nav-toggle-button'));
    expect(screen.getByTestId('nav-toggle-button')).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByTestId('app-content'));
    expect(screen.getByTestId('nav-toggle-button')).toHaveAttribute('aria-expanded', 'false');
  });
});
