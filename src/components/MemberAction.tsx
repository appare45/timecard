import React, { Suspense, useEffect, useRef, useState } from 'react';
import {
  Box,
  ButtonGroup,
  FormControl,
  FormLabel,
  Heading,
  Skeleton,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useContext } from 'react';
import { GroupContext } from '../contexts/group';
import {
  activity,
  addWork,
  getLatestActivity,
  setWork,
  work,
} from '../utils/group';
import { dataWithId } from '../utils/firebase';
import { useMemo } from 'react';
import { QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { Member } from '../utils/member';
import { BasicButton, CancelButton } from './buttons';

const MemberAction: React.FC<{
  member: dataWithId<Member>;
  onClose: () => void;
}> = ({ member, onClose }) => {
  const [latestActivity, setLatestActivity] = useState<QueryDocumentSnapshot<
    activity<work>
  > | null>(null);
  const notificationAudio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    notificationAudio.current?.play();
  }, []);
  const audioPath = new URL(
    '../../public/audio/notification_simple-01.wav',
    import.meta.url
  ).href;
  const { currentGroup } = useContext(GroupContext);
  const toast = useToast();
  const [memo, setMemo] = useState('');
  const ActivityCard = React.lazy(() => import('./activity-card'));
  const LatestActivityCard = useMemo(() => {
    return latestActivity?.data() ? (
      <ActivityCard activitySnapshot={latestActivity} member={member.data} />
    ) : (
      <Skeleton h="28" w="60" />
    );
  }, [ActivityCard, latestActivity, member.data]);

  useMemo(() => {
    if (currentGroup) {
      getLatestActivity(currentGroup.id, member.id).then((activity) => {
        setLatestActivity(activity);
        if (activity.data().content.status == 'running') {
          setMemo(activity.data().content.memo);
        }
      });
    }
  }, [currentGroup, member.id]);
  return (
    <>
      <audio src={audioPath} ref={notificationAudio} />
      <Box mb="5">
        {member.data.name ? (
          <Heading fontSize="2xl">前回のアクティビティー</Heading>
        ) : (
          <Skeleton>
            <Heading fontSize="2xl">読み込み中</Heading>
          </Skeleton>
        )}
        {latestActivity?.data().content.status == 'running' && (
          <Suspense fallback={<Skeleton />}>{LatestActivityCard}</Suspense>
        )}
      </Box>
      <FormControl>
        <FormLabel>メモ</FormLabel>
        <Textarea
          mb="5"
          placeholder="活動の記録（組織内に公開されます）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </FormControl>
      <ButtonGroup>
        <BasicButton
          colorScheme={
            latestActivity?.data().content.status === 'running'
              ? 'red'
              : 'green'
          }
          variant="primary"
          onClick={() => {
            if (currentGroup && member) {
              if (latestActivity?.data().content.status === 'done') {
                addWork(currentGroup.id, {
                  type: 'work',
                  content: {
                    startTime: Timestamp.now(),
                    endTime: null,
                    status: 'running',
                    memo: memo.replace(/\n/g, '\\n'),
                  },
                  memberId: member.id,
                }).then(() => {
                  onClose();
                  toast({
                    title: '開始しました',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                });
              } else if (latestActivity?.id) {
                const _latestActivity = latestActivity.data();
                _latestActivity.content.endTime = Timestamp.now();
                _latestActivity.content.status = 'done';
                _latestActivity.content.memo = memo;
                setWork(currentGroup.id, latestActivity?.id, _latestActivity, {
                  merge: true,
                }).then(() => {
                  onClose();
                  toast({
                    title: '終了しました',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                });
              }
            }
          }}
        >
          {latestActivity?.data().content.status === 'running'
            ? '終了'
            : '開始'}
        </BasicButton>
        <CancelButton
          variant="secondary"
          colorScheme="red"
          onClick={() => onClose()}
        >
          キャンセル
        </CancelButton>
      </ButtonGroup>
    </>
  );
};

export default MemberAction;
