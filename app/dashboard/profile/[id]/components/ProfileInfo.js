import React from 'react';
import { Flex, Box, Text, Image } from '@chakra-ui/react';

const ProfileInfo = () => {
  return (
    <Flex direction="column" align="center" p={4}>
      <Image src="profil-gorseli" alt="Profil Görseli" w="100px" h="100px" borderRadius="full" />
      <Text fontSize="xl" fontWeight="bold" mb={2}>
        Kullanıcı Adı
      </Text>
      <Text fontSize="lg" mb={2}>
        Kullanıcı Soyadı
      </Text>
      <Text fontSize="lg" mb={2}>
        Kullanıcı E-posta
      </Text>
    </Flex>
  );
};

export default ProfileInfo;