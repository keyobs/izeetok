import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import NumberChain from './NumberChain.tsx';

describe('NumberChain', () => {
  it('renders one bubble per number and one gap arrow between each pair', () => {
    render(<NumberChain numbers={[26, 29, 35, 38, 47]} />);

    expect(screen.getAllByTestId('bubble').map((el) => el.textContent)).toEqual(['26', '29', '35', '38', '47']);
  });

  it('labels each arrow with the correct gap', () => {
    const { container } = render(<NumberChain numbers={[26, 29, 35, 38, 47]} />);

    const gaps = [...container.querySelectorAll('[class*="gapValue"]')].map((el) => el.textContent);
    expect(gaps).toEqual(['3', '6', '3', '9']);
  });
});
