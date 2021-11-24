import React, { useMemo } from 'react';
import {
  Button,
  ButtonGroup,
  HStack,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
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

interface props {
  detectedMember: dataWithId<Member>;
  latestActivity: QueryDocumentSnapshot<activity<work>>;
  onClose: () => unknown;
}
const DetectedMemberAction: React.FC<props> = ({
  detectedMember,
  latestActivity,
  onClose,
}) => {
  const cancelRef = useRef(null);
  const toast = useToast();
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
        <Button
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
                  toast({
                    title: '終了しました',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
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
                  toast({
                    title: '開始しました',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                });
              }
            }
            onClose();
          }}
        >
          {latestActivity?.data().content.status === 'running'
            ? '終了'
            : '開始'}
        </Button>
        {detectedMember?.id === (currentMember?.id ?? '') && (
          <Button
            onClick={() => {
              if (setFrontMode) setFrontMode(false);
              if (document.fullscreenElement) document.exitFullscreen();
            }}
          >
            管理モードに切り替え
          </Button>
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
