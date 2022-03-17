import React, { useEffect } from 'react';
import {
  Box,
  Center,
  Heading,
  VStack,
  Grid,
  GridItem,
} from '@chakra-ui/layout';
import { Icon } from '@chakra-ui/icon';
import { IoCloudOffline } from 'react-icons/io5';
import { useHistory } from 'react-router-dom';
import { BasicButton } from '../components/buttons';
const Offline: React.FC = () => {
  const history = useHistory();
  useEffect(() => {
    window.addEventListener('offline', () => {
      history.go(0);
    });
  });
  return (
    <>
      <Box w="100vw" h="100vh" overflow="hidden" pos="fixed">
        <Grid
          w="110vw"
          h="100vh"
          templateColumns="repeat(auto-fill, 100px)"
          templateRows="repeat(auto-fill, 100px)"
          opacity="0.1"
          m="-10"
          gap="10"
        >
          {[...Array(1000)].map((index) => (
            <GridItem key={index}>
              <Icon as={IoCloudOffline} boxSize="24" />
            </GridItem>
          ))}
        </Grid>
      </Box>
      <Center h="100vh">
        <Box>
          <VStack>
            <Heading>インターネット接続がありません</Heading>
            <BasicButton variant="primary" onClick={() => history.go(0)}>
              再試行
            </BasicButton>
          </VStack>
        </Box>
      </Center>
    </>
  );
};

export default Offline;
