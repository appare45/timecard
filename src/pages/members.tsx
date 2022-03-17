import React, { Suspense, useContext, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { Route, useRouteMatch, Switch as RouteSwitch } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { AddMember } from '../components/member-add';
import { IoPrint } from 'react-icons/io5';
import { GroupTemplate } from '../templates/group';
import { LoadingScreen } from '../components/assets';
import { BasicButton } from '../components/buttons';

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
                    <BasicButton
                      leftIcon={<IoPrint />}
                      bg="black"
                      variant="secondary"
                      onClick={window.print}
                      size="sm"
                    >
                      印刷
                    </BasicButton>
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
