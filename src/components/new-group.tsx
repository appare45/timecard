import React, { Suspense } from 'react';
import { Button } from '@chakra-ui/button';
import { useBoolean } from '@chakra-ui/hooks';
import { Box, Heading, VStack } from '@chakra-ui/layout';
import { LoadingScreen } from './assets';

const NewGroup = (): JSX.Element => {
  const [createGroupMode, setCreateGroupMode] = useBoolean(false);
  const CreateGroup = React.lazy(() => import('./create-group'));
  const JoinGroup = React.lazy(() => import('./join-group'));
  return (
    <VStack spacing="5" alignItems="center">
      <Suspense fallback={<LoadingScreen />}>
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
      </Suspense>
      <Button w="full" onClick={setCreateGroupMode.toggle} variant="outline">
        {createGroupMode ? '参加' : '新規作成'}
      </Button>
    </VStack>
  );
};

export default NewGroup;
