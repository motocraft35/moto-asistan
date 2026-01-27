import React from 'react';
import { render } from '@testing-library/react';
import NeonButton from './NeonButton';

describe('NeonButton', () => {
  it('renders correctly', () => {
    const { getByText } = render(<NeonButton>Map</NeonButton>);
    expect(getByText('Map')).toBeInTheDocument();
  });

  it('changes on hover', () => {
    const { getByText } = render(<NeonButton>Map</NeonButton>);
    const button = getByText('Map');
    expect(button).toHaveStyle({
      transform: 'matrix(1, 0, 0, 1, 0, 0)',
    });
    globalThis.mouseEvents.button.dispatchEvent(new globalThis.MouseEvent('mouseover'));
    expect(button).toHaveStyle({
      transform: 'matrix(1.1, 0, 0, 1.1, 0, 0)',
    });
  });
});