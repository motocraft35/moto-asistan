import React from 'react';
import { render } from '@testing-library/react';
import Hologram from './Hologram';

describe('Hologram', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Hologram />);
    expect(getByText('')).toBeInTheDocument();
  });
});