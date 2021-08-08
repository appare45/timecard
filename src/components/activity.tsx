import {
  Avatar,
  Box,
  Heading,
  Link,
  Tag,
  TagLabel,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { GroupContext } from '../contexts/group';
import { dataWithId } from '../utils/firebase';
import { Link as RouterLink } from 'react-router-dom';
import {
  activity,
  getAllActivities,
  getMember,
  getUserActivities,
  Member,
  work,
} from '../utils/group';

export const ActivityCard: React.FC<{ data: activity<work> }> = ({ data }) => {
  const [memberInfo, setMemberInfo] = useState<Member | null>();
  const { currentId } = useContext(GroupContext);
  useEffect(() => {
    if (currentId) {
      getMember(data.memberId, currentId).then((e) => setMemberInfo(e));
    }
  });
  return (
    <Box p="3" shadow="lg" w="lg">
      {data.content?.status ?? ''}
      <Link as={RouterLink} to={`/activity/${data.memberId}`}>
        <Tag py="1">
          <Avatar
            src={memberInfo?.photoUrl}
            name={memberInfo?.name}
            size="sm"
          />
          <TagLabel>{memberInfo?.name}</TagLabel>
        </Tag>
      </Link>
      <Text>
        {new Date(data.content.startTime.seconds * 1000).toLocaleTimeString()}~
      </Text>
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
  const { currentId } = useContext(GroupContext);
  const [activities, setActivities] = useState<dataWithId<activity<work>>[]>();
  useEffect(() => {
    if (currentId) {
      getAllActivities(currentId).then((activities) => {
        const data: dataWithId<activity<work>>[] = [];
        activities?.forEach((activity) => {
          data.push({
            data: activity.data(),
            id: activity.id,
          });
        });
        setActivities(data);
      });
    }
  }, [currentId]);
  return (
    <>
      <Heading>全ての履歴</Heading>
      {activities?.map((activity) => (
        <ActivityCard data={activity.data} key={activity.id} />
      ))}
      {!activities?.length && <Text>履歴が存在しません</Text>}
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
