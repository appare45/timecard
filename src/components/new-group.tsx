import React from 'react';
import { Button } from '@chakra-ui/button';
import { useBoolean } from '@chakra-ui/hooks';
import { Box, Heading, VStack } from '@chakra-ui/layout';
import CreateGroup from './create-group';
import JoinGroup from './join-group';

const NewGroup = (): JSX.Element => {
  const [createGroupMode, setCreateGroupMode] = useBoolean(false);
  return (
    <VStack spacing="5" alignItems="center">
      {createGroupMode ? (
        <Box>
          <Heading>グループの作成</Heading>
          <CreateGroup />
        </Box>
      ) : (
        <Box>
          <Heading>グループに参加</Heading>
          <JoinGroup />
        </Box>
      )}
      <Button w="full" onClick={setCreateGroupMode.toggle}>
        {createGroupMode ? 'グループに参加' : 'グループを作成'}
      </Button>
    </VStack>
  );
};

export default NewGroup;
