import React, { useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AspectRatio,
  Box,
  Button,
  ButtonGroup,
  Heading,
  HStack,
  Skeleton,
  Spacer,
  Text,
  useToast,
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
  const { currentId, setFrontMode } = useContext(GroupContext);
  const toast = useToast();
  const { currentMember } = useContext(GroupContext);

  // メンバーの最終活動を表示する
  useEffect(() => {
    if (currentId && detectedMember) {
      getLatestActivity(currentId, detectedMember.id).then((activity) =>
        setLatestActivity(activity)
      );
    }
  }, [currentId, detectedMember]);

  return (
    <Box p="10" bg="white">
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
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={!!detectedMember}
        motionPreset="slideInBottom"
        isCentered
        onClose={() => setDetectedMember(null)}
        size="lg">
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>
            <HStack spacing="4">
              {detectedMember && (
                <MemberAvatar member={detectedMember.data} size="md" />
              )}
              <Text fontSize="2xl" fontWeight="bold">
                {detectedMember?.data.name}
              </Text>
            </HStack>
            <AlertDialogCloseButton />
          </AlertDialogHeader>
          <AlertDialogBody>
            {latestActivity?.data().content.status == 'running' && (
              <HStack alignItems="baseline">
                <Text fontSize="2xl">
                  {millisToText(
                    Date.now() -
                      latestActivity?.data().content.startTime.toMillis()
                  )}
                </Text>
                <Text>経過</Text>
              </HStack>
            )}
          </AlertDialogBody>
          <AlertDialogFooter>
            <ButtonGroup size="lg">
              <Button
                colorScheme={
                  latestActivity?.data().content.status === 'running'
                    ? 'red'
                    : 'green'
                }
                onClick={() => {
                  if (currentId && detectedMember) {
                    if (latestActivity?.data().content.status === 'running') {
                      const _latestActivity = latestActivity.data();
                      _latestActivity.content.endTime = Timestamp.now();
                      _latestActivity.content.status = 'done';
                      setWork(currentId, latestActivity?.id, _latestActivity, {
                        merge: true,
                      }).then(() => {
                        setDetectedMember(null);
                        toast({
                          title: '終了しました',
                          status: 'success',
                          duration: 3000,
                          isClosable: true,
                        });
                      });
                    } else {
                      addWork(currentId, {
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
              <Button
                variant="ghost"
                colorScheme="red"
                ref={cancelRef}
                onClick={() => setDetectedMember(null)}>
                キャンセル
              </Button>
            </ButtonGroup>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
};

export default Front;
