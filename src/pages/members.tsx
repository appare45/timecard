import { Button } from '@chakra-ui/react';
import React, { Suspense, useContext, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { Route, useRouteMatch, Switch as RouteSwitch } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { AddMember } from '../components/member-add';
import { IoPrint } from 'react-icons/io5';
import { GroupTemplate } from '../templates/group';
import { LoadingScreen } from '../components/assets';

const Members: React.FC = () => {
  const { path } = useRouteMatch();
  const UserActivity = React.lazy(() => import('./user-activity'));
  const MembersList = React.lazy(() => import('../components/members-list'));
  const { currentGroup } = useContext(GroupContext);
  const [update, setUpdate] = useState(false);
  return (
    <>
      <RouteSwitch>
        <Route exact path={path}>
          <GroupTemplate
            title="メンバー"
            titleLeftButtons={
              <>
                {currentGroup && (
                  <>
                    <RecoilRoot>
                      <AddMember
                        groupId={currentGroup.id}
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
                      size="sm"
                    >
                      印刷
                    </Button>
                  </>
                )}
              </>
            }
          >
            <RecoilRoot>
              <Suspense fallback={<LoadingScreen />}>
                <MembersList />
              </Suspense>
            </RecoilRoot>
          </GroupTemplate>
        </Route>
        <Route path={`${path}:memberId`}>
          <Suspense fallback={<LoadingScreen />}>
            <UserActivity />
          </Suspense>
        </Route>
      </RouteSwitch>
    </>
  );
};

export default Members;
