import {
  Alert,
  AlertIcon,
  Avatar,
  Box,
  Button,
  Circle,
  Divider,
  Heading,
  HStack,
  Skeleton,
  Spinner,
  Text,
  VStack,
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
  statusToText,
  work,
  workStatus,
} from '../utils/group';

export const ActivityStatus: React.FC<{ workStatus: workStatus }> = ({
  workStatus,
}) => {
  return (
    <HStack spacing="1">
      <Circle bg={workStatus === 'done' ? 'gray.400' : 'green.400'} size="3" />
      <Text> {statusToText(workStatus ?? '')}</Text>
    </HStack>
  );
};

export const ActivityCard: React.FC<{ data: activity<work>; member?: Member }> =
  ({ data, member }) => {
    const [memberInfo, setMemberInfo] = useState<Member | null>();
    const { currentId } = useContext(GroupContext);
    useEffect(() => {
      if (member) {
        setMemberInfo(member);
      } else if (currentId) {
        getMember(data.memberId, currentId).then((e) => setMemberInfo(e));
      }
    }, [currentId, data.memberId, member]);
    return (
      <Box p="3" w="lg">
        {memberInfo ? (
          <Button
            size="sm"
            my="1"
            variant="link"
            as={RouterLink}
            to={`/activity/${data.memberId}`}
            leftIcon={
              <Avatar
                src={memberInfo?.photoUrl}
                name={memberInfo?.name}
                size="sm"
              />
            }>
            {memberInfo?.name}
          </Button>
        ) : (
          <Skeleton>
            <Button
              size="sm"
              my="1"
              variant="link"
              leftIcon={<Avatar src="" name="読み込み中" size="sm" />}>
              読み込み中
            </Button>
          </Skeleton>
        )}
        <HStack my="2" spacing="3">
          <ActivityStatus workStatus={data.content.status} />
          <Text>{data.content.startTime.toDate().toLocaleTimeString()}~</Text>
        </HStack>
        <Text fontSize="xs" mt="2">
          最終更新:{data?.updated?.toDate().toLocaleString() ?? ''}
        </Text>
      </Box>
    );
  };

const DisplayActivities: React.FC<{
  data: dataWithId<activity<work>>[] | null;
}> = ({ data }) => {
  return (
    <>
      <VStack spacing="1" w="max-content" divider={<Divider />}>
        {data?.map((activity) => (
          <ActivityCard data={activity.data} key={activity.id} />
        ))}
      </VStack>
      {data === null && <Spinner />}
      {data !== null && !data?.length && (
        <Alert status="info" mt="3">
          <AlertIcon />
          履歴が存在しません
        </Alert>
      )}
    </>
  );
};

function UserActivity(): JSX.Element {
  const { memberId } = useParams<{ memberId: string }>();
  const [user, setUser] = useState<Member | null>(null);
  const [activities, setActivities] = useState<
    dataWithId<activity<work>>[] | null
  >(null);
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
      <DisplayActivities data={activities} />
    </>
  );
}

const AllActivity: React.FC = () => {
  const { currentId } = useContext(GroupContext);
  const [activities, setActivities] = useState<
    dataWithId<activity<work>>[] | null
  >(null);
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
      <Box mb="3">
        <Heading>タイムライン</Heading>
        <Text>全てのアクティビティーが時間順で並びます</Text>
      </Box>
      <DisplayActivities data={activities} />
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
