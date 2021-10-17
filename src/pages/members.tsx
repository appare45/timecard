import { Button, Heading, HStack, Spacer } from '@chakra-ui/react';
import React, { Suspense, useContext, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { Route, useRouteMatch, Switch as RouteSwitch } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { AddMember } from '../components/member-add';
import { IoPrint } from 'react-icons/io5';

const Members: React.FC = () => {
  const { path } = useRouteMatch();
  const UserActivity = React.lazy(() => import('../components/user-activity'));
  const MembersList = React.lazy(() => import('../components/members-list'));
  const groupContext = useContext(GroupContext);
  const [update, setUpdate] = useState(false);
  return (
    <>
      <RouteSwitch>
        <Route exact path={path}>
          <HStack w="full">
            <Heading>メンバー</Heading>
            <Spacer />
            {groupContext.currentId && (
              <>
                <RecoilRoot>
                  <AddMember
                    groupId={groupContext.currentId}
                    onUpdate={() => {
                      console.info('updated');
                      setUpdate(!update);
                    }}
                  />
                </RecoilRoot>
                <Button
                  leftIcon={<IoPrint />}
                  colorScheme="blackAlpha"
                  bg="black"
                  size="sm">
                  印刷
                </Button>
              </>
            )}
          </HStack>
          <RecoilRoot>
            <MembersList />
          </RecoilRoot>
        </Route>
        <Route path={`${path}:memberId`}>
          <Suspense fallback={null}>
            <UserActivity />
          </Suspense>
        </Route>
      </RouteSwitch>
    </>
  );
};

export default Members;
