import React, { useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
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
  VStack,
} from '@chakra-ui/react';
import { QRCodeScan } from './qrcodeScan';
import { useState } from 'react';
import { dataWithId, firebase } from '../utils/firebase';
import {
  activity,
  addWork,
  getAccount,
  getLatestActivity,
  Member,
  setWork,
  work,
} from '../utils/group';
import { useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../contexts/user';
import { GroupContext } from '../contexts/group';
import { ActivityCard } from './activity';
import { cardHeight, cardWidth } from './createCard';

const Time: React.FC = () => {
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setDate(new Date()), 1000);
    console.info('updated');
    return () => clearInterval(interval);
  }, [date]);

  const dayToJP = (e: number): string => {
    switch (e) {
      case 0:
        return '月';
      case 1:
        return '火';
      case 2:
        return '水';
      case 3:
        return '木';
      case 4:
        return '金';
      case 5:
        return '土';
      default:
        return '日';
    }
  };
  return (
    <VStack>
      <Text fontSize="lg" fontFamily="mono">
        {date.getFullYear()}年{`00${date.getMonth() + 1}`.slice(-2)}月
        {`00${date.getDate() + 1}`.slice(-2)}日（{dayToJP(date.getDay())}）
      </Text>
      <Text fontSize="3xl">
        {`00${date.getHours()}`.slice(-2)}:{`00${date.getMinutes()}`.slice(-2)}:
        {`00${date.getSeconds()}`.slice(-2)}
      </Text>
    </VStack>
  );
};

export const Front: React.FC = () => {
  const [detectedMember, setDetectedMember] =
    useState<dataWithId<Member> | null>(null);
  const cancelRef = useRef(null);
  const [latestActivity, setLatestActivity] =
    useState<firebase.firestore.QueryDocumentSnapshot<activity<work>> | null>(
      null
    );
  const userContext = useContext(AuthContext);
  const { currentId, setFrontMode } = useContext(GroupContext);
  const toast = useToast();
  const [ownerAccount, setOwnerAccount] = useState<string>();

  useEffect(() => {
    getAccount(userContext.account?.uid ?? '', currentId ?? '').then(
      (account) => setOwnerAccount(account.data()?.memberId)
    );
  });

  // メンバーの最終活動を表示する
  useEffect(() => {
    if (currentId && detectedMember) {
      getLatestActivity(currentId, detectedMember.id).then((activity) => {
        setLatestActivity(activity);
      });
    }
  }, [currentId, detectedMember]);

  return (
    <Box p="10">
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
        <Time />
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
        size="xl">
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>
            {detectedMember?.data.name ? (
              <>{detectedMember?.data.name}さん</>
            ) : (
              <Skeleton>読み込み中</Skeleton>
            )}
          </AlertDialogHeader>
          <AlertDialogBody>
            <Box mb="5">
              {latestActivity?.data() && (
                <ActivityCard
                  data={latestActivity.data()}
                  member={detectedMember?.data}
                />
              )}
            </Box>
            <ButtonGroup>
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
                      _latestActivity.content.endTime =
                        firebase.firestore.Timestamp.now();
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
                          startTime: firebase.firestore.Timestamp.now(),
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
              {detectedMember?.id === ownerAccount && (
                <Button onClick={() => setFrontMode(false)}>
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
          </AlertDialogBody>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
};