import { Button } from '@chakra-ui/react';
import React, { Suspense, useContext, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { Route, useRouteMatch, Switch as RouteSwitch } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { AddMember } from '../components/member-add';
import { IoPrint } from 'react-icons/io5';
import { GroupTemplate } from '../templates/group';

const Members: React.FC = () => {
  const { path } = useRouteMatch();
  const UserActivity = React.lazy(() => import('./user-activity'));
  const MembersList = React.lazy(() => import('../components/members-list'));
  const groupContext = useContext(GroupContext);
  const [update, setUpdate] = useState(false);
  return (
    <>
      <RouteSwitch>
        <Route exact path={path}>
          <GroupTemplate
            title="メンバー"
            titleLeftButtons={
              <>
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
                      onClick={window.print}
                      size="sm">
                      印刷
                    </Button>
                  </>
                )}
              </>
            }>
            <RecoilRoot>
              <MembersList />
            </RecoilRoot>
          </GroupTemplate>
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
