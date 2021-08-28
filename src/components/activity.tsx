import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Circle,
  Heading,
  HStack,
  Skeleton,
  SkeletonCircle,
  Spacer,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { useParams } from 'react-router';
import {
  Link,
  Route,
  Switch,
  useHistory,
  useRouteMatch,
} from 'react-router-dom';
import { GroupContext } from '../contexts/group';
import { dataWithId } from '../utils/firebase';
import { Link as RouterLink } from 'react-router-dom';
import {
  activity,
  getAllActivities,
  getGroup,
  getMember,
  getUserActivities,
  Group,
  Member,
  statusToText,
  work,
  workStatus,
} from '../utils/group';
import {
  IoArrowBack,
  IoPencil,
  IoQrCode,
  IoScan,
  IoSettings,
} from 'react-icons/io5';
import { MemberAction, QRCodeScan } from './qrcodeScan';
import { dateToJapaneseTime } from '../utils/time';
import { useRef } from 'react';
import { Card } from './createCard';

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
      <Box w="lg" border="1px" borderColor="gray.200" rounded="base">
        <Box px="5" py="3">
          {memberInfo ? (
            <Button
              size="sm"
              my="1"
              ml="-1"
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
            <HStack>
              <SkeletonCircle />
              <Skeleton>
                7
                <Button size="sm" my="1" variant="link">
                  読み込み中
                </Button>
              </Skeleton>
            </HStack>
          )}
          <HStack my="2" spacing="3">
            <ActivityStatus workStatus={data.content.status} />
            <Text>
              {data.content.startTime &&
                `00${data.content.startTime.toDate().getHours()}`.slice(-2) +
                  ':' +
                  `${data.content.startTime.toDate().getMinutes()}`.slice(-2)}
              ~
              {data.content.endTime &&
                `00${data.content.endTime.toDate().getHours()}`.slice(-2) +
                  ':' +
                  `${data.content.endTime.toDate().getMinutes()}`.slice(-2)}
            </Text>
          </HStack>
        </Box>
        <Box bg="gray.200" px="2" py="1.5" fontSize="xs" color="gray.600">
          最終更新 {dateToJapaneseTime(data?.updated?.toDate() ?? null)}
        </Box>
      </Box>
    );
  };

const DisplayActivities: React.FC<{
  data: dataWithId<activity<work>>[] | null;
}> = ({ data }) => {
  return (
    <>
      <VStack spacing="3" w="max-content" pt="5">
        {data?.map((activity) => (
          <ActivityCard data={activity.data} key={activity.id} />
        ))}
      </VStack>
      {data === null && <Spinner />}
      {data !== null && !data?.length && (
        <Alert status="info" mt="3">
          <AlertIcon />
          履歴がありません
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
  const [group, setGroup] = useState<Group | null>(null);
  const [dialog, setDialog] = useState(false);
  const dialogCancel = useRef(null);
  const { currentId } = useContext(GroupContext);
  useEffect(() => {
    if (currentId) {
      getGroup(currentId).then((group) => setGroup(group));
    }
  });
  useEffect(() => {
    if (currentId) {
      getMember(memberId, currentId).then((member) => {
        setUser(member);
      });
    }
  }, [currentId, memberId]);
  const history = useHistory();
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
      <Button
        leftIcon={<IoArrowBack />}
        onClick={() => history.goBack()}
        variant="link">
        戻る
      </Button>
      {user?.name && <Heading>{`${user?.name ?? 'ユーザー'}の履歴`}</Heading>}
      <HStack align="flex-start">
        <DisplayActivities data={activities} />
        <Spacer />
        <VStack
          mt="10"
          border="1px"
          bg="gray.50"
          borderColor="gray.200"
          p="5"
          rounded="base"
          align="flex-start">
          <Button leftIcon={<IoQrCode />} onClick={() => setDialog(true)}>
            QRコード表示
          </Button>
        </VStack>
      </HStack>
      <AlertDialog
        isOpen={dialog}
        onClose={() => setDialog(false)}
        leastDestructiveRef={dialogCancel}>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>
            {user?.name}のカード
            <AlertDialogCloseButton />
          </AlertDialogHeader>
          <AlertDialogBody>
            {user && group && (
              <Card member={{ data: user, id: memberId }} group={group} />
            )}
            <Button ref={dialogCancel} onClick={() => setDialog(false)} mx="5">
              閉じる
            </Button>
          </AlertDialogBody>
        </AlertDialogContent>
      </AlertDialog>
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
      <Button leftIcon={<IoScan />} as={Link} to="/activity/scan">
        スキャン
      </Button>
      <DisplayActivities data={activities} />
    </>
  );
};

const Activities: React.FC = () => {
  const { path } = useRouteMatch();
  const history = useHistory();
  const [detectedMember, setDetectedMember] =
    useState<dataWithId<Member> | null>(null);
  return (
    <>
      <Switch>
        <Route exact path={path}>
          <AllActivity />
        </Route>
        <Route exact path={`${path}scan`}>
          {!detectedMember ? (
            <QRCodeScan onDetect={(e) => setDetectedMember(e)} />
          ) : (
            <MemberAction
              member={detectedMember}
              onClose={() => {
                history.push(path);
                setDetectedMember(null);
              }}
            />
          )}
        </Route>
        <Route path={`${path}:memberId`}>
          <UserActivity />
        </Route>
      </Switch>
    </>
  );
};

export { UserActivity, Activities };
