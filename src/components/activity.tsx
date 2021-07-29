import { Heading } from '@chakra-ui/react';
import React from 'react';
import { useParams } from 'react-router';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

function UserActivity(): JSX.Element {
  const { userId } = useParams<{ userId: string }>();
  return (
    <>
      <Heading>{`${userId}の履歴`}</Heading>
    </>
  );
}

const AllActivity: React.FC = () => {
  return (
    <>
      <Heading>全ての履歴</Heading>
    </>
  );
};

const Activities: React.FC = () => {
  const { path } = useRouteMatch();
  return (
    <>
      <Switch>
        <Route exact path={path}>
          <AllActivity />
        </Route>
        <Route path={`${path}:userId`}>
          <UserActivity />
        </Route>
      </Switch>
    </>
  );
};

export { UserActivity, Activities };
