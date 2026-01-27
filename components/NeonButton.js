import React from 'react';
import styled from 'styled-components';

const NeonButton = styled.button`
  position: relative;
  width: 100px;
  height: 50px;
  background-color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 10px #fff;
  }
`;

export default NeonButton;