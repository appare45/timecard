import React, { Suspense } from 'react';
import { Route, useRouteMatch, Switch as RouteSwitch } from 'react-router-dom';

const Members: React.FC = () => {
  const { path } = useRouteMatch();
  const UserActivity = React.lazy(() => import('./user-activity'));
  const MembersList = React.lazy(() => import('./members-list'));
  return (
    <>
      <RouteSwitch>
        <Route exact path={path}>
          <MembersList />
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
