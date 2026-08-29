import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridInputForm from './GridInputForm.tsx';

describe('GridInputForm', () => {
  it('renders 5 number inputs, 2 star inputs and the submit button', () => {
    render(<GridInputForm onSubmit={vi.fn()} submitLabel="Évaluer" />);

    for (let index = 0; index < 5; index += 1) {
      expect(screen.getByTestId(`number-input-${index}`)).toBeInTheDocument();
    }
    for (let index = 0; index < 2; index += 1) {
      expect(screen.getByTestId(`star-input-${index}`)).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Évaluer' })).toBeInTheDocument();
  });

  it('submits the parsed grid when the submit button is clicked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<GridInputForm onSubmit={onSubmit} submitLabel="Évaluer" />);

    const numbers = [3, 7, 19, 31, 42];
    const stars = [2, 9];
    for (const [index, value] of numbers.entries()) {
      await user.type(screen.getByTestId(`number-input-${index}`), String(value));
    }
    for (const [index, value] of stars.entries()) {
      await user.type(screen.getByTestId(`star-input-${index}`), String(value));
    }
    await user.click(screen.getByRole('button', { name: 'Évaluer' }));

    expect(onSubmit).toHaveBeenCalledWith({ numbers, stars });
  });

  it('submits when pressing Enter instead of clicking the button', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<GridInputForm onSubmit={onSubmit} submitLabel="Évaluer" />);

    const numbers = [3, 7, 19, 31, 42];
    const stars = [2, 9];
    for (const [index, value] of numbers.entries()) {
      await user.type(screen.getByTestId(`number-input-${index}`), String(value));
    }
    for (const [index, value] of stars.entries()) {
      await user.type(screen.getByTestId(`star-input-${index}`), String(value));
    }
    await user.keyboard('{Enter}');

    expect(onSubmit).toHaveBeenCalledWith({ numbers, stars });
  });

  it('shows an error instead of submitting when the grid is incomplete', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<GridInputForm onSubmit={onSubmit} submitLabel="Évaluer" />);

    await user.click(screen.getByRole('button', { name: 'Évaluer' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('grid-input-error')).toBeInTheDocument();
  });

  it('seeds the fields from initialGrid', () => {
    render(
      <GridInputForm onSubmit={vi.fn()} submitLabel="Évaluer" initialGrid={{ numbers: [3, 7, 19, 31, 42], stars: [2, 9] }} />,
    );

    expect(screen.getByTestId('number-input-0')).toHaveValue('3');
    expect(screen.getByTestId('star-input-0')).toHaveValue('2');
  });
});
