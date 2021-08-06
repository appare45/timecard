import { Box, Heading, Text } from '@chakra-ui/react';
import React from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { GroupContext } from '../contexts/group';
import { dataWithId } from '../utils/firebase';
import {
  activity,
  getMember,
  getUserActivities,
  Member,
  work,
} from '../utils/group';

const ActivityCard: React.FC<{ data: activity<work> }> = ({ data }) => {
  console.info(data.content.startTime);
  return (
    <Box>
      {data.content?.status ?? ''}{' '}
      <Text>{data.content.startTime.toString()}</Text>
    </Box>
  );
};

function UserActivity(): JSX.Element {
  const { memberId } = useParams<{ memberId: string }>();
  const [user, setUser] = useState<Member | null>(null);
  const [activities, setActivities] = useState<dataWithId<activity<work>>[]>();
  const { currentId } = useContext(GroupContext);
  useEffect(() => {
    if (currentId) {
      getMember(memberId, currentId).then((member) => {
        setUser(member);
      });
    }
  }, [currentId, memberId]);
  useEffect(() => {
    if (currentId) {
      getUserActivities(currentId, memberId).then((activities) => {
        const data: dataWithId<activity<work>>[] = [];
        activities?.forEach((activity) => {
          data.push({
            data: activity.data(),
            id: activity.id,
          });
          console.info(activity.data);
          console.info(activity.data as unknown as activity<work>);
        });
        setActivities(data);
      });
    }
  }, [currentId, memberId]);
  return (
    <>
      {user?.name && <Heading>{`${user?.name ?? 'ユーザー'}の履歴`}</Heading>}
      {activities?.map((activity) => (
        <ActivityCard data={activity.data} key={activity.id} />
      ))}
      {!activities?.length && <Text>履歴が存在しません</Text>}
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
        <Route path={`${path}:memberId`}>
          <UserActivity />
        </Route>
      </Switch>
    </>
  );
};

export { UserActivity, Activities };
