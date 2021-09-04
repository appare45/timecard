import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  ButtonGroup,
  Circle,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Skeleton,
  Spacer,
  Spinner,
  Text,
  Textarea,
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
  IoCreate,
  IoPencilSharp,
  IoQrCode,
  IoScan,
} from 'react-icons/io5';
import { MemberAction } from './qrcodeScan';
import { useRef } from 'react';
import { useMemo } from 'react';
import { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import DisplayActivities from './display-activities';

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

function UserActivity(): JSX.Element {
  const { memberId } = useParams<{ memberId: string }>();
  const [user, setUser] = useState<Member | null>(null);
  const [activities, setActivities] = useState<
    QueryDocumentSnapshot<activity<work>>[] | null
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
        setUser(currentMember.data() ?? null);
      } else if (currentMember?.id) {
        getMember(memberId, currentId).then((member) => {
          setUser(member?.data() ?? null);
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
  const Card = React.lazy(() => import('./createCard'));
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
              <Suspense fallback={<Skeleton />}>
                <Card member={{ data: user, id: memberId }} group={group} />
              </Suspense>
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
  const DisplayActivities = React.lazy(() => import('./display-activities'));
  return (
    <Suspense fallback={<Skeleton />}>
      <DisplayActivities data={activities} />
    </Suspense>
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
      getMember(activityData.memberId, currentId).then((e) =>
        setMember(e ?? null)
      );
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
