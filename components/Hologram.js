import React from 'react';
import styled from 'styled-components';

const Hologram = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  background-color: #333;
  border-radius: 50%;
  animation: spin 2s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export default Hologram;