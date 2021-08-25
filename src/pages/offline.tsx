import React from 'react';
import {
  Box,
  Button,
  Center,
  Grid,
  GridItem,
  Heading,
  Icon,
  VStack,
} from '@chakra-ui/react';
import { IoCloudOffline } from 'react-icons/io5';
import { useHistory } from 'react-router-dom';

const Offline: React.FC = () => {
  const history = useHistory();
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
          gap="10">
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
            <Button variant="outline" onClick={() => history.go(0)}>
              再試行
            </Button>
          </VStack>
        </Box>
      </Center>
    </>
  );
};

export default Offline;