import { HStack, Spacer, Text, VStack } from '@chakra-ui/layout';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/modal';
import { QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import React, { Suspense, useContext, useEffect, useState } from 'react';
import { useDisclosure } from '@chakra-ui/hooks';
import { IoCheckmarkDone, IoScan } from 'react-icons/io5';
import {
  useRouteMatch,
  useHistory,
  Switch,
  Route,
  Link as RouterLink,
} from 'react-router-dom';
import ActivityCard from '../components/activity-card';
import { LoadingScreen } from '../components/assets';
import { BasicButton, CancelButton } from '../components/buttons';
import { GroupContext } from '../contexts/group';
import { GroupTemplate } from '../templates/group';
import { dataWithId } from '../utils/firebase';
import { activity, getAllActivities, setWork, work } from '../utils/group';
import { Member } from '../utils/member';
import { Progress } from '@chakra-ui/react';

const EndAllActivity = () => {
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
          <ModalBody>
            {AllRunningActivities?.length && (
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

const Timeline: React.FC = () => {
  const { path } = useRouteMatch();
  const { isAdmin } = useContext(GroupContext);
  const history = useHistory();
  const [detectedMember, setDetectedMember] =
    useState<dataWithId<Member> | null>(null);
  const QRCodeScan = React.lazy(() => import('./../components/qrcodeScan'));
  const MemberAction = React.lazy(() => import('./../components/MemberAction'));
  const SingleActivity = React.lazy(() => import('./../pages/single-activity'));
  const Activities = React.lazy(
    () => import('./../components/display-activities')
  );
  return (
    <>
      <Switch>
        <Route exact path={path}>
          <GroupTemplate
            title="タイムライン"
            sideWidget={
              <>
                {isAdmin && (
                  <>
                    <BasicButton
                      variant="secondary"
                      leftIcon={<IoScan />}
                      as={RouterLink}
                      to="/activity/scan"
                    >
                      スキャン
                    </BasicButton>
                    <EndAllActivity />
                  </>
                )}
              </>
            }
          >
            <Text>全てのアクティビティーが時間順で並びます</Text>
            <Suspense fallback={<LoadingScreen />}>
              <Activities />
            </Suspense>
          </GroupTemplate>
        </Route>
        <Route exact path={`${path}scan`}>
          {!detectedMember ? (
            <QRCodeScan onDetect={(e) => setDetectedMember(e)} />
          ) : (
            <MemberAction
              member={detectedMember}
              onClose={() => {
                history.push(path);
                setDetectedMember(null);
              }}
            />
          )}
        </Route>
        <Route path={`${path}:activityId`}>
          <SingleActivity />
        </Route>
      </Switch>
    </>
  );
};

export default Timeline;
