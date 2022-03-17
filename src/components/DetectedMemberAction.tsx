import React, { useMemo } from 'react';
import { Button, ButtonGroup, HStack, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { dataWithId } from '../utils/firebase';
import { activity, addWork, setWork, work } from '../utils/group';
import { useRef } from 'react';
import { useContext } from 'react';
import { GroupContext } from '../contexts/group';
import { Timestamp, QueryDocumentSnapshot } from 'firebase/firestore';
import { MemberAvatar } from './assets';
import { millisToText } from '../utils/time';
import { Member } from '../utils/member';
import { BasicButton } from './buttons';

interface props {
  detectedMember: dataWithId<Member>;
  latestActivity: QueryDocumentSnapshot<activity<work>> | null;
  onClose: () => unknown;
}
const DetectedMemberAction: React.FC<props> = ({
  detectedMember,
  latestActivity,
  onClose,
}) => {
  const cancelRef = useRef(null);
  const { currentMember } = useContext(GroupContext);
  const [time, setTime] = useState('');
  const { currentGroup, setFrontMode } = useContext(GroupContext);

  useMemo(() => {
    setTime(
      latestActivity?.data().content.startTime.toMillis()
        ? millisToText(
            Date.now() -
              (latestActivity?.data().content.startTime.toDate().getTime() ?? 0)
          )
        : '0'
    );
  }, [latestActivity]);
  return (
    <VStack spacing="10">
      <HStack spacing="4">
        {detectedMember && detectedMember?.data && (
          <MemberAvatar member={detectedMember.data} size="lg" />
        )}
        <Text fontSize="4xl" fontWeight="bold">
          {detectedMember?.data.name}
        </Text>
        {latestActivity?.data().content.status == 'running' && (
          <HStack alignItems="baseline">
            <Text fontSize="4xl">{time.toString()}</Text>
            <Text>経過</Text>
          </HStack>
        )}
      </HStack>
      <ButtonGroup size="lg">
        <BasicButton
          variant="primary"
          colorScheme={
            latestActivity?.data().content.status === 'running'
              ? 'red'
              : 'green'
          }
          onClick={() => {
            if (currentGroup && detectedMember) {
              if (latestActivity?.data().content.status === 'running') {
                const _latestActivity = latestActivity.data();
                _latestActivity.content.endTime = Timestamp.now();
                _latestActivity.content.status = 'done';
                setWork(currentGroup.id, latestActivity?.id, _latestActivity, {
                  merge: true,
                }).then(() => {
                  onClose();
                });
              } else {
                addWork(currentGroup.id, {
                  type: 'work',
                  content: {
                    startTime: Timestamp.now(),
                    endTime: null,
                    status: 'running',
                    memo: '',
                  },
                  memberId: detectedMember.id,
                }).then(() => {
                  onClose();
                });
              }
            }
            onClose();
          }}
        >
          {latestActivity?.data().content.status === 'running'
            ? '終了'
            : '開始'}
        </BasicButton>
        {detectedMember?.id === (currentMember?.id ?? '') && (
          <BasicButton
            variant="primary"
            onClick={() => {
              if (setFrontMode) setFrontMode(false);
              if (document.fullscreenElement) document.exitFullscreen();
            }}
          >
            管理モードに切り替え
          </BasicButton>
        )}
      </ButtonGroup>
      <Button
        variant="ghost"
        colorScheme="red"
        ref={cancelRef}
        onClick={onClose}
      >
        キャンセル
      </Button>
    </VStack>
  );
};

export default DetectedMemberAction;
