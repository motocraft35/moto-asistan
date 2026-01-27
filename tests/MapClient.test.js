import React from 'react';
import { render } from '@testing-library/react';
import MapClient from './MapClient';

describe('MapClient', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MapClient />);
    expect(getByText('')).toBeInTheDocument();
  });
});