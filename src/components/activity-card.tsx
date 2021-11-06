import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  Skeleton,
  SkeletonCircle,
  Spacer,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useClipboard,
  Link,
  VStack,
  useToast,
} from '@chakra-ui/react';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { activity, setWork, work, workStatus } from '../utils/group';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import {
  IoCheckmarkOutline,
  IoClipboardOutline,
  IoPencilOutline,
  IoShareOutline,
} from 'react-icons/io5';
import { relativeTimeText } from '../utils/time';
import { ActivityStatus } from './activity';
import { MemberAvatar } from './assets';
import { Member, getMember } from '../utils/member';
const ActivityMenu: React.FC<{ activityId: string; isEditable: boolean }> = ({
  activityId,
  isEditable,
}) => {
  const { hasCopied, onCopy } = useClipboard(
    `${location.host}/activity/${activityId}`
  );
  const history = useHistory();
  const [shareAvailable, setShareAvailable] = useState<boolean>();
  useEffect(() => setShareAvailable(!!navigator.share), []);

  return (
    <ButtonGroup
      variant="outline"
      size="sm"
      isAttached={true}
      colorScheme="gray">
      {isEditable && (
        <Tooltip label="編集">
          <Button onClick={() => history.push(`/activity/${activityId}`)}>
            <IoPencilOutline />
          </Button>
        </Tooltip>
      )}
      {shareAvailable ? (
        <Button
          aria-label="アクティビティーを共有"
          onClick={() => {
            navigator.share({
              url: `${location.host}/activity/${activityId}`,
              text: `アクティビティー`,
            });
          }}
          colorScheme={hasCopied ? 'green' : 'gray'}
          disabled={hasCopied}>
          <IoShareOutline />
        </Button>
      ) : (
        <Tooltip label="リンクをコピー">
          <Button
            onClick={onCopy}
            colorScheme={hasCopied ? 'green' : 'gray'}
            disabled={hasCopied}
            leftIcon={hasCopied ? <IoCheckmarkOutline /> : undefined}>
            {hasCopied && <Text>コピーしました</Text>}
            {!hasCopied && <IoClipboardOutline />}
          </Button>
        </Tooltip>
      )}
    </ButtonGroup>
  );
};

const MemberInfo: React.FC<{
  memberInfo: Member;
  activityData: activity<work>;
}> =
  // eslint-disable-next-line react/display-name
  React.memo(({ memberInfo, activityData }) => {
    if (memberInfo && activityData) {
      return (
        <HStack>
          <MemberAvatar member={memberInfo} size="xs" status={false} />
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
  });

const ActivityStatusFull: React.FC<{
  activitySnapShot:
    | QueryDocumentSnapshot<activity<work>>
    | DocumentSnapshot<activity<work>>;
  height?: string;
  closeButton?: boolean;
}> = ({ activitySnapShot, height = 'auto', closeButton = true }) => {
  const toast = useToast();
  const [status, setStatus] = useState<workStatus>(
    activitySnapShot.data()?.content.status ?? 'done'
  );
  const { currentId } = useContext(GroupContext);
  const activityData = activitySnapShot.data();
  return useMemo(() => {
    return (
      <VStack
        height={height}
        overflow="hidden"
        alignItems="flex-start"
        justifyContent="center"
        spacing="0.5">
        {status == 'done' ? (
          <HStack>
            <Text color="gray.500">
              {`00${activityData?.content.endTime?.toDate().getHours()}`.slice(
                -2
              ) +
                ':' +
                `00${activityData?.content.endTime
                  ?.toDate()
                  .getMinutes()}`.slice(-2)}
            </Text>
            <Text>終了しました</Text>
          </HStack>
        ) : (
          <>
            {closeButton && activityData && (
              <Button
                size="sm"
                my="2"
                colorScheme="red"
                variant="outline"
                onClick={() => {
                  const _activityData = activityData;
                  _activityData.content.endTime = Timestamp.now();
                  _activityData.content.status = 'done';
                  if (currentId)
                    setWork(currentId, activitySnapShot.id, _activityData, {
                      merge: true,
                    })
                      .then(() => {
                        setStatus('done');

                        toast({ title: '終了しました', status: 'success' });
                      })
                      .catch(() =>
                        toast({
                          title: 'エラーが発生しました',
                          status: 'error',
                        })
                      );
                }}>
                終了する
              </Button>
            )}
          </>
        )}
        {activityData && activityData.content.startTime && (
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
      </VStack>
    );
  }, [
    activityData,
    activitySnapShot.id,
    closeButton,
    currentId,
    height,
    status,
    toast,
  ]);
};

const ActivityCard: React.FC<{
  activitySnapshot:
    | QueryDocumentSnapshot<activity<work>>
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
  const [memberInfo, setMemberInfo] = useState<Member | null>(null);
  const { currentId } = useContext(GroupContext);
  const activityData: activity<work> | null = activitySnapshot.data() ?? null;
  const { currentMember } = useContext(GroupContext);
  useEffect(() => {
    let subscription = true;
    if (member) {
      setMemberInfo(member);
    } else if (currentId && showMemberData) {
      const memberId = activitySnapshot.data()?.memberId;
      if (memberId === currentMember?.id) {
        setMemberInfo(currentMember?.data() ?? null);
      } else if (currentMember?.id && memberId && currentId) {
        getMember(memberId ?? '', currentId).then((e) => {
          if (subscription) setMemberInfo(e?.data() ?? null);
        });
      }
    }
    return () => {
      subscription = false;
    };
  }, [member, currentId, showMemberData, activitySnapshot, currentMember]);

  const ActivityMemo = (props: { content: string; height?: string }) => {
    if (props.content) {
      const memoText = props.content.replace(/\\n/g, '\n');
      return (
        <Box
          h={props.height}
          py="1"
          wordBreak="break-all"
          fontSize="sm"
          overflow="hidden">
          <pre>{memoText}</pre>
        </Box>
      );
    } else return null;
  };

  return useMemo(
    () => (
      <Box
        w="full"
        minW="lg"
        border="1px"
        borderColor="gray.200"
        rounded="base">
        {activityData && (
          <>
            <HStack px="3" py="1" justify="flex-start" bg="gray.100">
              {showMemberData && memberInfo && (
                <MemberInfo
                  memberInfo={memberInfo}
                  activityData={activityData}
                />
              )}
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
                      isDisabled={!activityData.content?.memo}
                      _disabled={{ opacity: 0.3, cursor: 'not-allowed' }}>
                      メモ
                    </Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel px="1" py="0.5">
                      {activitySnapshot && (
                        <ActivityStatusFull
                          activitySnapShot={activitySnapshot}
                          height="20"
                        />
                      )}
                    </TabPanel>
                    <TabPanel px="1" py="0.5" height="20">
                      <ActivityMemo
                        content={activityData.content?.memo ?? ''}
                      />
                    </TabPanel>
                  </TabPanels>
                </Box>
              </Tabs>
            </Box>
            <HStack
              bg="gray.100"
              px="2"
              py="1.5"
              fontSize="xs"
              color="gray.600"
              spacing="2">
              <ActivityStatus
                workStatus={activityData.content.status ?? 'running'}
                size="2"
              />
              <Text>
                <Link as={RouterLink} to={`/activity/${activitySnapshot.id}`}>
                  {relativeTimeText(activityData.updated?.toDate() ?? null) ??
                    null}
                </Link>
                に更新
              </Text>
            </HStack>
          </>
        )}
      </Box>
    ),
    [activityData, activitySnapshot, editable, memberInfo, showMemberData]
  );
};
export default ActivityCard;
