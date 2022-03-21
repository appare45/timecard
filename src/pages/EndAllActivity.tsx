import { HStack, Spacer, VStack } from '@chakra-ui/layout';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/modal';
import { QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { useDisclosure } from '@chakra-ui/hooks';
import { IoCheckmarkDone } from 'react-icons/io5';
import ActivityCard from '../components/activity-card';
import { BasicButton, CancelButton } from '../components/buttons';
import { GroupContext } from '../contexts/group';
import { activity, getAllActivities, setWork, work } from '../utils/group';
import { Progress } from '@chakra-ui/progress';

export const EndAllActivity = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currentGroup } = useContext(GroupContext);
  const [AllRunningActivities, setAllRunningActivities] = useState<
    QueryDocumentSnapshot<activity<work>>[] | null
  >(null);
  useEffect(() => {
    if (!!currentGroup && isOpen)
      getAllActivities({ groupId: currentGroup.id, onlyRunning: true }).then(
        (e) => {
          setAllRunningActivities(e);
        }
      );
  }, [currentGroup, isOpen]);
  const [endingCount, setEndingCount] = useState(0);
  return (
    <>
      <BasicButton
        variant="secondary"
        leftIcon={<IoCheckmarkDone />}
        onClick={onOpen}
      >
        進行中のアクティビティーをすべて終了
      </BasicButton>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>進行中のアクティビティーをすべて終了</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!!AllRunningActivities?.length && (
              <>
                <HStack>
                  {AllRunningActivities.length}個の進行中のアクティビティー
                  <Spacer />
                  <CancelButton
                    variant="primary"
                    onClick={async () => {
                      Promise.all(
                        AllRunningActivities.map(async (e, i) => {
                          const _runningActivity = e.data();
                          _runningActivity.content.endTime = Timestamp.now();
                          _runningActivity.content.status = 'done';
                          _runningActivity.updated = Timestamp.now();
                          if (currentGroup)
                            await setWork(
                              currentGroup.id,
                              e.id,
                              _runningActivity,
                              {}
                            );
                          setEndingCount(i);
                        })
                      ).then(() => setAllRunningActivities([]));
                    }}
                  >
                    終了
                  </CancelButton>
                </HStack>
                <Progress
                  value={(endingCount / AllRunningActivities.length) * 100}
                  colorScheme="green"
                />
                <VStack>
                  {AllRunningActivities?.map((e) => (
                    <ActivityCard key={e.id} activitySnapshot={e} />
                  ))}
                </VStack>
              </>
            )}
            {AllRunningActivities?.length === 0 && (
              <Alert status="success">
                <AlertIcon /> 進行中のアクティビティーが存在しません。
              </Alert>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
