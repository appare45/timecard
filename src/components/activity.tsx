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
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Link,
  Skeleton,
  SkeletonCircle,
  Spacer,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  Tooltip,
  useClipboard,
  useToast,
  VStack,
} from '@chakra-ui/react';
import React, { Suspense } from 'react';
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
  setWork,
  statusToText,
  work,
  workStatus,
} from '../utils/group';
import {
  IoArrowBack,
  IoCheckmarkOutline,
  IoClipboardOutline,
  IoCreate,
  IoPencilOutline,
  IoPencilSharp,
  IoQrCode,
  IoScan,
} from 'react-icons/io5';
import { MemberAction } from './qrcodeScan';
import { dateToJapaneseTime, relativeTimeText } from '../utils/time';
import { useRef } from 'react';
import { Card } from './createCard';
import { firebase } from './../utils/firebase';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from '@firebase/firestore-types';
import { useMemo } from 'react';

export const ActivityStatus: React.FC<{
  workStatus: workStatus;
  size?: string | number;
}> = ({ workStatus, size = '3' }) => {
  return (
    <HStack spacing="1">
      <Circle
        bg={workStatus === 'done' ? 'gray.400' : 'green.400'}
        size={size}
      />
      <Text> {statusToText(workStatus ?? '')}</Text>
    </HStack>
  );
};

const ActivityMenu: React.FC<{ activityId: string; isEditable: boolean }> = ({
  activityId,
  isEditable,
}) => {
  const { hasCopied, onCopy } = useClipboard(
    `${location.host}/activity/${activityId}`
  );

  return (
    <ButtonGroup
      variant="outline"
      size="sm"
      spacing="0.5"
      isAttached
      colorScheme="gray">
      <Tooltip label="リンクをコピー">
        <Button onClick={onCopy}>
          {hasCopied ? <IoCheckmarkOutline /> : <IoClipboardOutline />}
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
  const [memberInfo, setMemberInfo] = useState<Member>();
  const { currentId } = useContext(GroupContext);
  const activityData: activity<work> | null = activitySnapshot.data() ?? null;
  const { currentMember } = useContext(GroupContext);
  useEffect(() => {
    const ac = new AbortController();
    if (member) {
      setMemberInfo(member);
    } else if (currentId && showMemberData) {
      const memberId = activitySnapshot.data()?.memberId;
      if (memberId === currentMember?.id) {
        setMemberInfo(currentMember?.data());
      } else if (currentMember?.id && memberId && currentId) {
        getMember(memberId ?? '', currentId).then((e) =>
          setMemberInfo(e?.data())
        );
      }
    }
    return () => ac.abort();
  }, [member, currentId, showMemberData, activitySnapshot, currentMember]);

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
        <Stack height={height} overflow="hidden" pt="2" spacing="-0.5">
          {activityData.content.endTime && (
            <HStack>
              <Text color="gray.500">
                {`00${activityData?.content.endTime
                  ?.toDate()
                  .getHours()}`.slice(-2) +
                  ':' +
                  `00${activityData?.content.endTime
                    ?.toDate()
                    .getMinutes()}`.slice(-2)}
              </Text>
              <Text>終了しました</Text>
            </HStack>
          )}
          {activityData.content.startTime && (
            <HStack>
              <Text color="gray.500">
                {`00${activityData?.content.startTime
                  ?.toDate()
                  .getHours()}`.slice(-2) +
                  ':' +
                  `00${activityData?.content.startTime
                    ?.toDate()
                    .getMinutes()}`.slice(-2)}
              </Text>
              <Text>開始しました</Text>
            </HStack>
          )}
        </Stack>
      </>
    );
  };
  const ActivityMemo = (props: { content: string }) => {
    if (props.content) {
      const memoText = props.content.replace(/\\n/g, '\n');
      return (
        <Box
          h="14"
          py="1"
          wordBreak="break-all"
          fontSize="sm"
          overflow="hidden">
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
                  <Tab>ログ</Tab>
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
                  <TabPanels>
                    <TabPanel px="1" py="0.5">
                      <ActivityStatusFull
                        activityData={activityData}
                        height="14"
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
          <HStack bg="gray.100" px="2" py="1.5" fontSize="xs" color="gray.600">
            <ActivityStatus
              workStatus={activityData.content.status ?? 'running'}
              size="2"
            />
            <Tooltip
              label={dateToJapaneseTime({
                timeObject: activityData.updated?.toDate() ?? null,
                full: true,
              })}>
              <Text>
                {relativeTimeText(activityData.updated?.toDate() ?? null) ??
                  null}
                に更新
              </Text>
            </Tooltip>
          </HStack>
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
  const [user, setUser] = useState<Member>();
  const [activities, setActivities] = useState<
    firebase.firestore.QueryDocumentSnapshot<activity<work>>[] | null
  >(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [dialog, setDialog] = useState(false);
  const dialogCancel = useRef(null);
  const { currentId, currentMember } = useContext(GroupContext);
  useEffect(() => {
    if (currentId) {
      getGroup(currentId).then((group) => setGroup(group));
    }
  }, [currentId]);
  useMemo(() => {
    if (currentId && !user) {
      if (currentMember?.id == memberId) {
        setUser(currentMember.data());
      } else if (currentMember?.id) {
        getMember(memberId, currentId).then((member) => {
          setUser(member?.data());
        });
      }
    }
  }, [currentId, currentMember, memberId, user]);
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

const ActivityMemo: React.FC<{
  editable: boolean;
  activity: DocumentSnapshot<activity<work>>;
}> = ({ editable, activity }) => {
  const { currentId } = useContext(GroupContext);
  const [draftText, setDraftText] = useState(
    activity.data()?.content.memo.replace(/\\n/g, '\n') ?? ''
  );
  const [editMode, setEditMode] = useState(false);
  const toast = useToast();
  const saveMemo = (groupId: string, workId: string) => {
    const _activity = activity.data();
    if (_activity?.content) _activity.content.memo = draftText;
    if (_activity) return setWork(groupId, workId, _activity, { merge: true });
  };
  const RenderedMemo = useMemo(() => {
    const ReactMarkdown = React.lazy(() => import('./activity-memo'));
    return (
      <Suspense fallback={<Skeleton />}>
        {draftText.length ? (
          <ReactMarkdown draftText={draftText} />
        ) : (
          <Text> メモはありません</Text>
        )}
      </Suspense>
    );
  }, [draftText]);
  return (
    <FormControl my="2">
      <FormLabel>メモ</FormLabel>
      {editMode ? (
        <>
          <Textarea
            autoFocus
            variant="filled"
            disabled={!editMode}
            placeholder="活動の記録を残しましょう（組織内に公開されます）"
            onChange={(e) => setDraftText(e.target.value)}
            maxLength={10000}
            isInvalid={draftText.length > 10000}
            h="52">
            {draftText}
          </Textarea>
          <FormHelperText>組織内に公開されます</FormHelperText>
        </>
      ) : (
        RenderedMemo
      )}
      {editable && (
        <ButtonGroup my="2">
          {!editMode ? (
            <Button
              onClick={() => setEditMode(true)}
              variant={!draftText.length ? 'solid' : 'outline'}
              leftIcon={!draftText.length ? <IoCreate /> : <IoPencilSharp />}>
              {draftText.length ? '編集' : '作成'}
            </Button>
          ) : (
            <>
              <Button
                isDisabled={
                  draftText === activity.data()?.content.memo &&
                  draftText.length < 10000
                }
                onClick={() => {
                  if (currentId)
                    saveMemo(currentId, activity.id)
                      ?.then(() => {
                        toast({
                          title: '保存しました',
                          status: 'success',
                        });
                        setEditMode(false);
                      })
                      .catch(() => {
                        toast({
                          title: '保存できませんでした',
                          status: 'error',
                        });
                      });
                }}>
                保存
              </Button>
              <Button
                variant="ghost"
                colorScheme="red"
                onClick={() => setEditMode(false)}>
                キャンセル
              </Button>
            </>
          )}
        </ButtonGroup>
      )}
    </FormControl>
  );
};

const ActivityDetail: React.FC<{
  activity: DocumentSnapshot<activity<work>>;
  member: DocumentSnapshot<Member>;
}> = ({ activity, member }) => {
  const activityData = activity.data();
  const { currentMember } = useContext(GroupContext);
  return (
    <>
      <Heading>{member.data()?.name}のアクティビティー</Heading>
      {activityData && (
        <>
          {activityData?.content.status === 'done' &&
          activityData.content.endTime ? (
            <Text>
              {/* ToDo: m秒表示を日本語に変換する */}
              {activityData.content.endTime.toMillis() -
                activityData.content.startTime.toMillis()}
            </Text>
          ) : (
            <ActivityStatus workStatus={activityData.content.status} />
          )}
          <ActivityMemo
            editable={currentMember?.id == member.id}
            activity={activity}
          />
        </>
      )}
    </>
  );
};

const SingleActivity = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const [activitySnapshot, setActivitySnapshot] = useState<DocumentSnapshot<
    activity<work>
  > | null>(null);
  const history = useHistory();
  const { currentId } = useContext(GroupContext);
  useEffect(() => {
    if (activityId && currentId) {
      getActivitySnapshot(activityId, currentId).then((e) =>
        setActivitySnapshot(e)
      );
    }
  }, [activityId, currentId]);
  const [member, setMember] = useState<DocumentSnapshot<Member> | null>();
  useMemo(() => {
    const activityData = activitySnapshot?.data() ?? null;
    if (activitySnapshot && activityData && currentId)
      getMember(activityData.memberId, currentId).then((e) => setMember(e));
  }, [activitySnapshot, currentId]);
  return (
    <>
      <Button
        leftIcon={<IoArrowBack />}
        variant="link"
        onClick={history.goBack}>
        戻る
      </Button>
      <Box my="2">
        {activitySnapshot && member ? (
          <ActivityDetail activity={activitySnapshot} member={member} />
        ) : (
          <HStack>
            <Spinner />
            <Text>読み込み中</Text>
          </HStack>
        )}
      </Box>
    </>
  );
};

const Activities: React.FC = () => {
  const { path } = useRouteMatch();
  const history = useHistory();
  const [detectedMember, setDetectedMember] =
    useState<dataWithId<Member> | null>(null);
  const QRCodeScan = React.lazy(() => import('./qrcodeScan'));
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
