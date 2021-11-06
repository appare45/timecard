import React, { useEffect } from 'react';
import {
  AspectRatio,
  Box,
  Button,
  ButtonGroup,
  Center,
  Heading,
  HStack,
  Skeleton,
  Spacer,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { QRCodeScan } from './qrcodeScan';
import { useState } from 'react';
import { dataWithId } from '../utils/firebase';
import {
  activity,
  addWork,
  getLatestActivity,
  setWork,
  work,
} from '../utils/group';
import { useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../contexts/user';
import { GroupContext } from '../contexts/group';
import { cardHeight, cardWidth } from './createCard';
import { Timestamp, QueryDocumentSnapshot } from 'firebase/firestore';
import { MemberAvatar } from './assets';
import { millisToText } from '../utils/time';
import { Member } from '../utils/member';

const Front: React.FC = () => {
  const [detectedMember, setDetectedMember] =
    useState<dataWithId<Member> | null>(null);
  const cancelRef = useRef(null);
  const [latestActivity, setLatestActivity] = useState<QueryDocumentSnapshot<
    activity<work>
  > | null>(null);
  const userContext = useContext(AuthContext);
  const { currentGroup, setFrontMode } = useContext(GroupContext);
  const toast = useToast();
  const { currentMember } = useContext(GroupContext);

  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(
      latestActivity?.data().content.startTime.toMillis()
        ? millisToText(
            Date.now() -
              (latestActivity?.data().content.startTime.toDate().getTime() ?? 0)
          )
        : '0'
    );
  }, [latestActivity]);

  const audio = useRef<HTMLAudioElement>(null);
  // メンバーの最終活動を表示する
  useEffect(() => {
    if (currentGroup && detectedMember) {
      getLatestActivity(currentGroup.id, detectedMember.id).then((activity) =>
        setLatestActivity(activity)
      );
      if (audio.current) audio.current.play();
      console.info(audio);
    }
  }, [currentGroup, detectedMember]);

  const audioPath = new URL(
    '/public/audio/notification_high-intensity.wav',
    import.meta.url
  ).href;
  console.info(audioPath);

  return (
    <Box p="10" bg="white">
      <audio src={audioPath} ref={audio} />
      {!detectedMember ? (
        <>
          <HStack>
            <Box>
              <Heading>QRコードをスキャンしてください</Heading>
              <Text>
                管理者モードに切り替えるには
                {userContext.account?.displayName ?? '管理者'}
                のQRコードをスキャンしてください
              </Text>
            </Box>
            <Spacer />
          </HStack>
          <Box m="10">
            {detectedMember ? (
              <Skeleton>
                <AspectRatio
                  maxH="100vh"
                  h="full"
                  ratio={cardWidth / cardHeight}
                  borderRadius="lg"
                  bg="gray.400"
                  overflow="hidden">
                  <Box />
                </AspectRatio>
              </Skeleton>
            ) : (
              <Box h="90vh">
                <QRCodeScan onDetect={(e) => setDetectedMember(e)} />
              </Box>
            )}
          </Box>
        </>
      ) : (
        <Center h="100vh">
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
                      setWork(
                        currentGroup.id,
                        latestActivity?.id,
                        _latestActivity,
                        {
                          merge: true,
                        }
                      ).then(() => {
                        setDetectedMember(null);
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
                        setDetectedMember(null);
                        toast({
                          title: '開始しました',
                          status: 'success',
                          duration: 3000,
                          isClosable: true,
                        });
                      });
                    }
                  }
                  setDetectedMember(null);
                }}>
                {latestActivity?.data().content.status === 'running'
                  ? '終了'
                  : '開始'}
              </Button>
              {detectedMember?.id === (currentMember?.id ?? '') && (
                <Button
                  onClick={() => {
                    if (setFrontMode) setFrontMode(false);
                    if (document.fullscreenElement) document.exitFullscreen();
                  }}>
                  管理モードに切り替え
                </Button>
              )}
            </ButtonGroup>
            <Button
              variant="ghost"
              colorScheme="red"
              ref={cancelRef}
              onClick={() => setDetectedMember(null)}>
              キャンセル
            </Button>
          </VStack>
        </Center>
      )}
    </Box>
  );
};

export default Front;
