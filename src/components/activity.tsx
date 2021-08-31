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
  Link,
  Skeleton,
  SkeletonCircle,
  Spacer,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';
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
  IoClipboardOutline,
  IoPencilOutline,
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
import { useMemo } from 'react';

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

const ActivityMenu: React.FC<{ activityId: string; isEditable: boolean }> = ({
  activityId,
  isEditable,
}) => {
  const toast = useToast();
  return (
    <ButtonGroup
      variant="outline"
      size="sm"
      spacing="0.5"
      isAttached
      colorScheme="gray">
      <Tooltip label="リンクをコピー">
        <Button
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
          }}>
          <IoClipboardOutline />
        </Button>
      </Tooltip>
      {isEditable && (
        <Tooltip label="編集する">
          <Button
            onClick={() => {
              console.info('');
            }}>
            <IoPencilOutline />
          </Button>
        </Tooltip>
      )}
    </ButtonGroup>
  );
};

export const ActivityCard: React.FC<{
  activitySnapshot:
    | firebase.firestore.QueryDocumentSnapshot<activity<work>>
    | DocumentSnapshot<activity<work>>;
  member?: Member;
  editable?: boolean;
  showMemberData?: boolean;
}> = ({
  activitySnapshot,
  member,
  editable = false,
  showMemberData = true,
}) => {
  const [memberInfo, setMemberInfo] = useState<Member | null>();
  const { currentId } = useContext(GroupContext);
  const activityData: activity<work> | null = activitySnapshot.data() ?? null;
  useEffect(() => {
    const ac = new AbortController();
    if (member) {
      setMemberInfo(member);
    } else if (currentId && showMemberData) {
      getMember(activitySnapshot.data()?.memberId ?? '', currentId).then((e) =>
        setMemberInfo(e)
      );
    }
    return () => ac.abort();
  }, [member, currentId, showMemberData, activitySnapshot]);

  const MemberInfo = () =>
    useMemo(() => {
      if (memberInfo && activityData) {
        return (
          <HStack>
            <Avatar
              src={memberInfo?.photoUrl}
              name={memberInfo?.name}
              size="xs"
            />
            <Button
              p={0}
              as={RouterLink}
              to={`/member/${activityData.memberId}`}
              variant="link">
              <Text>{memberInfo?.name}</Text>
            </Button>
          </HStack>
        );
      } else {
        return (
          <>
            <SkeletonCircle />
            <Skeleton>
              <Button size="sm" my="1" variant="link">
                読み込み中
              </Button>
            </Skeleton>
          </>
        );
      }
    }, []);

  const ActivityStatusFull: React.FC<{
    activityData: activity<work>;
    height?: string;
  }> = ({ activityData, height = 'auto' }) => {
    return (
      <>
        <HStack height={height} overflow="hidden">
          <ActivityStatus
            workStatus={activityData.content.status ?? 'running'}
          />
          <Text>
            {activityData.content.startTime &&
              `00${activityData?.content.startTime.toDate().getHours()}`.slice(
                -2
              ) +
                ':' +
                `00${activityData?.content.startTime
                  .toDate()
                  .getMinutes()}`.slice(-2)}
            ~
            {activityData.content.endTime &&
              `00${activityData?.content.endTime?.toDate().getHours()}`.slice(
                -2
              ) +
                ':' +
                `00${activityData?.content.endTime
                  ?.toDate()
                  .getMinutes()}`.slice(-2)}
          </Text>
        </HStack>
      </>
    );
  };
  const ActivityMemo = (props: { content: string }) => {
    if (props.content) {
      const memoText = props.content.replace(/\\n/g, '\n');
      return (
        <Box h="12" py="1" wordBreak="break-all" fontSize="sm">
          <pre>{memoText}</pre>
        </Box>
      );
    } else return null;
  };
  return (
    <Box w="lg" border="1px" borderColor="gray.200" rounded="base">
      {activityData && (
        <>
          <HStack px="3" py="1" justify="flex-start" bg="gray.100">
            {showMemberData && <MemberInfo />}
            <Spacer />
            <ActivityMenu
              activityId={activitySnapshot.id}
              isEditable={editable}
            />
          </HStack>
          <Box px="3" py="3">
            <Tabs
              size="sm"
              isLazy
              lazyBehavior="keepMounted"
              variant="soft-rounded"
              colorScheme="gray">
              {/* ヘッダー部分 */}
              <Box>
                <TabList>
                  <Tab>情報</Tab>
                  <Tab
                    isDisabled={!activityData.content.memo}
                    _disabled={{ opacity: 0.3, cursor: 'not-allowed' }}>
                    メモ
                  </Tab>
                </TabList>
                <Link
                  to={`/activity/${activitySnapshot.id}`}
                  as={RouterLink}
                  display="block"
                  pos="relative">
                  <Box
                    w="full"
                    height="full"
                    pos="absolute"
                    top={0}
                    left={0}
                    bgGradient="linear(to-b, #ffffff00, #ffffff30, #ffffffdd)"
                  />
                  <TabPanels>
                    <TabPanel px="1" py="0.5">
                      <ActivityStatusFull
                        activityData={activityData}
                        height="12"
                      />
                    </TabPanel>
                    <TabPanel px="1" py="0.5">
                      <ActivityMemo content={activityData.content.memo} />
                    </TabPanel>
                  </TabPanels>
                </Link>
              </Box>
            </Tabs>
          </Box>
          <Box bg="gray.100" px="2" py="1.5" fontSize="xs" color="gray.600">
            <Text>
              {dateToJapaneseTime(activityData.updated?.toDate() ?? null)}
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
};

const DisplayActivities: React.FC<{
  data: firebase.firestore.QueryDocumentSnapshot<activity<work>>[] | null;
  memberData?: Member;
  showMemberData?: boolean;
}> = ({ data, memberData, showMemberData = true }) => {
  return (
    <>
      <VStack spacing="3" w="max-content" pt="5">
        {data?.map((activity) => (
          <ActivityCard
            activitySnapshot={activity}
            key={activity.id}
            member={memberData}
            showMemberData={showMemberData}
          />
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
      {history.length > 0 && (
        <Button
          leftIcon={<IoArrowBack />}
          onClick={() => history.goBack()}
          variant="link">
          戻る
        </Button>
      )}
      {user?.name && <Heading>{`${user?.name ?? 'ユーザー'}の履歴`}</Heading>}
      <HStack align="flex-start">
        <DisplayActivities data={activities} showMemberData={true} />
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
          <Button leftIcon={<IoScan />} as={RouterLink} to="/activity/scan">
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
