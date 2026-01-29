import React from 'react';
import { Flex, Box, Text, Stat, StatLabel, StatNumber } from '@chakra-ui/react';

const ProfileStats = () => {
  return (
    <Flex direction="column" align="center" p={4}>
      <Stat>
        <StatLabel>Toplam Puan</StatLabel>
        <StatNumber>1000</StatNumber>
      </Stat>
      <Stat>
        <StatLabel>Toplam Ödül</StatLabel>
        <StatNumber>500</StatNumber>
      </Stat>
      <Stat>
        <StatLabel>Toplam Ödül Puanı</StatLabel>
        <StatNumber>2000</StatNumber>
      </Stat>
    </Flex>
  );
};

export default ProfileStats;