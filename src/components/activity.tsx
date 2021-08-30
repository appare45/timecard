import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
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
  Circle,
  Divider,
  Heading,
  HStack,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
  SkeletonCircle,
  Spacer,
  Spinner,
  Text,
  useToast,
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
  getActivitySnapshot,
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
  IoEllipsisHorizontal,
  IoLink,
  IoPencil,
  IoQrCode,
  IoScan,
} from 'react-icons/io5';
import { MemberAction, QRCodeScan } from './qrcodeScan';
import { dateToJapaneseTime } from '../utils/time';
import { useRef } from 'react';
import { Card } from './createCard';
import { firebase } from './../utils/firebase';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from '@firebase/firestore-types';

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

const ActivityPopover: React.FC<{ activityId: string; isEditable: boolean }> =
  ({ activityId, isEditable }) => {
    const toast = useToast();
    return (
      <Popover>
        <PopoverTrigger>
          <Button variant="ghost">
            <Icon as={IoEllipsisHorizontal} />
          </Button>
        </PopoverTrigger>
        <PopoverContent w="min-content">
          <PopoverArrow />
          <PopoverBody p="0">
            <VStack spacing="0">
              <Button
                leftIcon={<IoLink />}
                onClick={() => {
                  navigator.clipboard
                    .writeText(
                      `${location.hostname}:${location.port}/activity/${activityId}`
                    )
                    .then(() => {
                      toast({
                        title: 'リンクをコピーしました',
                        isClosable: true,
                        status: 'success',
                        duration: 5000,
                      });
                    })
                    .catch(() => {
                      toast({
                        title: 'コピーできませんでした',
                        isClosable: true,
                        status: 'error',
                        duration: 5000,
                      });
                    });
                }}
                variant="ghost"
                size="sm">
                リンクをコピー
              </Button>
              {isEditable && (
                <Button
                  leftIcon={<IoPencil />}
                  onClick={() => {
                    console.info('');
                  }}
                  variant="ghost"
                  size="sm"
                  w="full">
                  編集
                </Button>
              )}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

export const ActivityCard: React.FC<{
  activitySnapshot:
    | firebase.firestore.QueryDocumentSnapshot<activity<work>>
    | DocumentSnapshot<activity<work>>;
  member?: Member;
}> = ({ activitySnapshot, member }) => {
  const [memberInfo, setMemberInfo] = useState<Member | null>();
  const { currentId } = useContext(GroupContext);
  const activityData: activity<work> | null = activitySnapshot.data() ?? null;
  useEffect(() => {
    if (member) {
      setMemberInfo(member);
    } else if (currentId) {
      getMember(activitySnapshot.data()?.memberId ?? '', currentId).then((e) =>
        setMemberInfo(e)
      );
    }
  }, [currentId, activitySnapshot, member]);
  return (
    <Box w="lg" border="1px" borderColor="gray.200" rounded="base">
      {activityData && (
        <>
          <Box px="5" py="3">
            {memberInfo ? (
              <HStack>
                <RouterLink to={`/member/${activityData.memberId}`}>
                  <HStack>
                    <Avatar
                      src={memberInfo?.photoUrl}
                      name={memberInfo?.name}
                      size="sm"
                    />
                    <Text>{memberInfo?.name}</Text>
                  </HStack>
                </RouterLink>
                <Spacer />
                <ActivityPopover
                  activityId={activitySnapshot.id}
                  isEditable={true}
                />
              </HStack>
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
              <ActivityStatus
                workStatus={activityData.content.status ?? 'running'}
              />
              <Text>
                {activityData.content.startTime &&
                  `00${activityData?.content.startTime
                    .toDate()
                    .getHours()}`.slice(-2) +
                    ':' +
                    `00${activityData?.content.startTime
                      .toDate()
                      .getMinutes()}`.slice(-2)}
                ~
                {activityData.content.endTime &&
                  `00${activityData?.content.endTime
                    ?.toDate()
                    .getHours()}`.slice(-2) +
                    ':' +
                    `00${activityData?.content.endTime
                      ?.toDate()
                      .getMinutes()}`.slice(-2)}
              </Text>
            </HStack>
            <Accordion allowToggle>
              {activityData.content.memo && (
                <AccordionItem>
                  <AccordionButton>
                    <HStack w="full">
                      <Text>メモ</Text>
                      <Spacer />
                      <AccordionIcon />
                    </HStack>
                  </AccordionButton>
                  <AccordionPanel>{activityData.content.memo}</AccordionPanel>
                </AccordionItem>
              )}
            </Accordion>
          </Box>
          <Box bg="gray.200" px="2" py="1.5" fontSize="xs" color="gray.600">
            最終更新{' '}
            {dateToJapaneseTime(activityData.updated?.toDate() ?? null)}
          </Box>
        </>
      )}
    </Box>
  );
};

const DisplayActivities: React.FC<{
  data: firebase.firestore.QueryDocumentSnapshot<activity<work>>[] | null;
}> = ({ data }) => {
  return (
    <>
      <VStack spacing="3" w="max-content" pt="5">
        {data?.map((activity) => (
          <ActivityCard activitySnapshot={activity} key={activity.id} />
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
    firebase.firestore.QueryDocumentSnapshot<activity<work>>[] | null
  >(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [dialog, setDialog] = useState(false);
  const dialogCancel = useRef(null);
  const { currentId } = useContext(GroupContext);
  useEffect(() => {
    if (currentId) {
      getGroup(currentId).then((group) => setGroup(group));
    }
  }, [currentId]);
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
        setActivities(activities);
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

export const AllActivity: React.FC = () => {
  const { currentId } = useContext(GroupContext);
  const [activities, setActivities] = useState<
    QueryDocumentSnapshot<activity<work>>[] | null
  >(null);
  useEffect(() => {
    if (currentId) {
      getAllActivities(currentId).then((activities) => {
        setActivities(activities);
      });
    }
  }, [currentId]);
  return (
    <>
      <DisplayActivities data={activities} />
    </>
  );
};

const SingleActivity = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const [activitySnapshot, setActivitySnapshot] = useState<DocumentSnapshot<
    activity<work>
  > | null>(null);

  const { currentId } = useContext(GroupContext);
  useEffect(() => {
    if (activityId && currentId) {
      getActivitySnapshot(activityId, currentId).then((e) =>
        setActivitySnapshot(e)
      );
    }
  }, [activityId, currentId]);
  return (
    <>
      {activitySnapshot && <ActivityCard activitySnapshot={activitySnapshot} />}
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
          <Box mb="3">
            <Heading>タイムライン</Heading>
            <Text>全てのアクティビティーが時間順で並びます</Text>
          </Box>
          <Button leftIcon={<IoScan />} as={Link} to="/activity/scan">
            スキャン
          </Button>
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
        <Route path={`${path}:activityId`}>
          <SingleActivity />
        </Route>
      </Switch>
    </>
  );
};

export { UserActivity, Activities };
