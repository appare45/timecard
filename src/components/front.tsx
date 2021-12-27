import React, { Suspense, useEffect } from 'react';
import {
  AspectRatio,
  Box,
  Center,
  Heading,
  HStack,
  Skeleton,
  Spacer,
  Spinner,
} from '@chakra-ui/react';
import { useState } from 'react';
import { dataWithId } from '../utils/firebase';
import { activity, getLatestActivity, work } from '../utils/group';
import { useContext } from 'react';
import { GroupContext } from '../contexts/group';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { Member } from '../utils/member';
import { useUniversalColors } from '../hooks/color-mode';

const Front: React.FC = () => {
  const [detectedMember, setDetectedMember] =
    useState<dataWithId<Member> | null>(null);
  const [latestActivity, setLatestActivity] = useState<QueryDocumentSnapshot<
    activity<work>
  > | null>(null);
  const { currentGroup } = useContext(GroupContext);
  const DetectedMemberAction = React.lazy(
    () => import('./DetectedMemberAction')
  );

  // メンバーの最終活動を表示する
  useEffect(() => {
    if (currentGroup && detectedMember) {
      getLatestActivity(currentGroup.id, detectedMember.id).then((activity) =>
        setLatestActivity(activity ?? null)
      );
    }
  }, [currentGroup, detectedMember]);

  const QRCodeScan = React.lazy(() => import('./qrcodeScan'));
  const { background } = useUniversalColors();
  return (
    <Box p="10" bg={background}>
      {!detectedMember ? (
        <>
          <HStack>
            <Box>
              <Heading>QRコードをスキャンしてください</Heading>
            </Box>
            <Spacer />
          </HStack>
          <Box m="10">
            {detectedMember ? (
              <Skeleton>
                <AspectRatio
                  maxH="100vh"
                  h="full"
                  ratio={1 / 1}
                  borderRadius="lg"
                  bg="gray.400"
                  overflow="hidden"
                >
                  <Box />
                </AspectRatio>
              </Skeleton>
            ) : (
              <Box h="90vh">
                <Suspense fallback={<Spinner />}>
                  <QRCodeScan onDetect={(e) => setDetectedMember(e)} />
                </Suspense>
              </Box>
            )}
          </Box>
        </>
      ) : (
        <Center h="100vh">
          <Suspense fallback={null}>
            <DetectedMemberAction
              latestActivity={latestActivity}
              detectedMember={detectedMember}
              onClose={() => setDetectedMember(null)}
            />
          </Suspense>
        </Center>
      )}
    </Box>
  );
};

export default Front;
