import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  HStack,
  Skeleton,
  SkeletonCircle,
  Spacer,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useClipboard,
  Link,
} from '@chakra-ui/react';
import { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { activity, getMember, Member, work } from '../utils/group';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import {
  IoCheckmarkOutline,
  IoClipboardOutline,
  IoPencilOutline,
  IoShareOutline,
} from 'react-icons/io5';
import { dateToJapaneseTime, relativeTimeText } from '../utils/time';
import { ActivityStatus } from './activity';
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
  useMemo(() => {
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
    <Box w="full" minW="lg" border="1px" borderColor="gray.200" rounded="base">
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
                    isDisabled={!activityData.content?.memo}
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
                      <ActivityMemo
                        content={activityData.content?.memo ?? ''}
                      />
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
              <>
                {relativeTimeText(activityData.updated?.toDate() ?? null) ??
                  null}
                に更新
              </>
            </Tooltip>
          </HStack>
        </>
      )}
    </Box>
  );
};
export default ActivityCard;
