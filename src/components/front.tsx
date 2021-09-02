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
  Skeleton,
  Text,
  useToast,
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
import { QueryDocumentSnapshot } from '@firebase/firestore-types';

export const Front: React.FC = () => {
  const [detectedMember, setDetectedMember] =
    useState<dataWithId<Member> | null>(null);
  const cancelRef = useRef(null);
  const [latestActivity, setLatestActivity] = useState<QueryDocumentSnapshot<
    activity<work>
  > | null>(null);
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
      <Heading>QRコードをスキャンしてください</Heading>
      <Text>
        管理者モードに切り替えるには
        {userContext.account?.displayName ?? '管理者'}
        のQRコードをスキャンしてください
      </Text>
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
          <QRCodeScan onDetect={(e) => setDetectedMember(e)} />
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
