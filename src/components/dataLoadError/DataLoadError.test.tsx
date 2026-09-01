import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataLoadError from './DataLoadError.tsx';

describe('DataLoadError', () => {
  it('renders a message and calls onRetry when the retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<DataLoadError onRetry={onRetry} />);
    await user.click(screen.getByTestId('data-load-error-retry-button'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
