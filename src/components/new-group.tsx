import React, { Suspense } from 'react';
import { LoadingScreen } from './assets';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/tabs';
import JoinGroup from './join-group';
const NewGroup = (): JSX.Element => {
  const CreateGroup = React.lazy(() => import('./create-group'));
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Tabs
        isFitted
        isLazy
        lazyBehavior="keepMounted"
        colorScheme="green"
        variant="soft-rounded"
      >
        <TabList bg="green.50">
          <Tab>参加</Tab>
          <Tab>作成</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <JoinGroup />
          </TabPanel>
          <TabPanel>
            <CreateGroup />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Suspense>
  );
};

export default NewGroup;
