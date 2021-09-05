import { Button } from '@chakra-ui/button';
import { Heading, HStack, Spacer, VStack } from '@chakra-ui/layout';
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
} from '@chakra-ui/modal';
import { Skeleton } from '@chakra-ui/react';
import { QueryDocumentSnapshot } from '@firebase/firestore';
import React, {
  useState,
  useRef,
  useContext,
  useEffect,
  useMemo,
  Suspense,
} from 'react';
import { IoArrowBack, IoQrCode } from 'react-icons/io5';
import { useParams, useHistory } from 'react-router';
import { GroupContext } from '../contexts/group';
import {
  Member,
  activity,
  work,
  Group,
  getGroup,
  getMember,
  getUserActivities,
} from '../utils/group';
import DisplayActivities from './display-activities';

function UserActivity(): JSX.Element {
  const { memberId } = useParams<{ memberId: string }>();
  const [user, setUser] = useState<Member | null>(null);
  const [activities, setActivities] = useState<
    QueryDocumentSnapshot<activity<work>>[] | null
  >(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [dialog, setDialog] = useState(false);
  const dialogCancel = useRef(null);
  const { currentId, currentMember } = useContext(GroupContext);
  useEffect(() => {
    if (currentId) {
      getGroup(currentId).then((group) => setGroup(group));
    }
  }, [currentId]);
  useMemo(() => {
    if (currentId && !user) {
      if (currentMember?.id == memberId) {
        setUser(currentMember.data() ?? null);
      } else if (currentMember?.id) {
        getMember(memberId, currentId).then((member) => {
          setUser(member?.data() ?? null);
        });
      }
    }
  }, [currentId, currentMember, memberId, user]);
  const history = useHistory();
  useEffect(() => {
    if (currentId) {
      getUserActivities(currentId, memberId).then((activities) => {
        setActivities(activities);
      });
    }
  }, [currentId, memberId]);
  const Card = React.lazy(() => import('./createCard'));
  return (
    <>
      {history.length > 0 && (
        <Button
          leftIcon={<IoArrowBack />}
          onClick={() => history.goBack()}
          variant="link">
          戻る
        </Button>
      )}
      {user?.name && <Heading>{`${user?.name ?? 'ユーザー'}の履歴`}</Heading>}

      <HStack align="flex-start">
        <DisplayActivities data={activities} showMemberData editable />
        <Spacer />
        <VStack
          mt="10"
          border="1px"
          bg="gray.50"
          borderColor="gray.200"
          p="5"
          rounded="base"
          align="flex-start">
          <Button leftIcon={<IoQrCode />} onClick={() => setDialog(true)}>
            QRコード表示
          </Button>
        </VStack>
      </HStack>
      <AlertDialog
        isOpen={dialog}
        onClose={() => setDialog(false)}
        leastDestructiveRef={dialogCancel}>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>
            {user?.name}のカード
            <AlertDialogCloseButton />
          </AlertDialogHeader>
          <AlertDialogBody>
            {user && group && (
              <Suspense fallback={<Skeleton />}>
                <Card member={{ data: user, id: memberId }} group={group} />
              </Suspense>
            )}
            <Button ref={dialogCancel} onClick={() => setDialog(false)} mx="5">
              閉じる
            </Button>
          </AlertDialogBody>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default UserActivity;
