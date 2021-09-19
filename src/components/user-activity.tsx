import { Button } from '@chakra-ui/button';
import { Heading, HStack, VStack } from '@chakra-ui/layout';
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
import { IoArrowBack, IoPersonCircleOutline, IoQrCode } from 'react-icons/io5';
import { useParams, useHistory } from 'react-router';
import { Link } from 'react-router-dom';
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
import { LoadMoreButton } from './assets';
import DisplayActivities from './display-activities';

function UserActivity(): JSX.Element {
  const [lastActivityDoc, setLastActivityDoc] = useState<
    QueryDocumentSnapshot<activity<work>> | null | undefined
  >(null);
  const { memberId } = useParams<{ memberId: string }>();
  const [user, setUser] = useState<Member | null>(null);
  const [activities, setActivities] = useState<
    QueryDocumentSnapshot<activity<work>>[] | null
  >(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [dialog, setDialog] = useState(false);
  const dialogCancel = useRef(null);
  const { currentId, currentMember } = useContext(GroupContext);
  const [isOwnMember, setIsOwnMember] = useState(false);

  useEffect(() => {
    if (currentId) {
      getGroup(currentId).then((group) => setGroup(group));
    }
  }, [currentId]);
  useMemo(() => {
    if (currentId && !user) {
      if (currentMember?.id == memberId) {
        setUser(currentMember.data() ?? null);
        setIsOwnMember(currentMember?.id == memberId);
      } else if (currentMember?.id) {
        getMember(memberId, currentId).then((member) => {
          setUser(member?.data() ?? null);
        });
      }
    }
  }, [currentId, currentMember, memberId, user]);
  const history = useHistory();

  const loadMoreData = () => {
    if (currentId)
      if (lastActivityDoc) {
        getUserActivities(currentId, memberId, 5, lastActivityDoc).then(
          (gotActivities) => {
            setLastActivityDoc(gotActivities.docs[4]);
            let subscription = true;
            if (subscription) {
              const dataSet: QueryDocumentSnapshot<activity<work>>[] =
                activities ?? [];
              gotActivities.forEach((data) => {
                dataSet.push(data);
              });
              setActivities([...dataSet]);
            }
            return () => (subscription = false);
          }
        );
      }
  };

  useEffect(() => {
    if (currentId)
      getUserActivities(currentId, memberId, 5).then((activities) => {
        setLastActivityDoc(activities.docs[4]);
        let subscription = true;
        if (subscription) {
          const dataSet: QueryDocumentSnapshot<activity<work>>[] = [];
          activities.forEach((data) => {
            dataSet.push(data);
          });
          setActivities(dataSet);
        }
        return () => (subscription = false);
      });
  }, [currentId, memberId]);
  const Card = React.lazy(() => import('./createCard'));
  const Activities: React.FC<{
    data: QueryDocumentSnapshot<activity<work>>[];
  }> = ({ data }) =>
    useMemo(
      () => <DisplayActivities data={data} showMemberData editable />,
      [data]
    );
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
      {user?.name && (
        <Heading mb="10">{`${user?.name ?? 'ユーザー'}の履歴`}</Heading>
      )}

      <HStack align="flex-start">
        <VStack w="full" spacing="4" pb="2">
          {activities && <Activities data={activities} />}
          {lastActivityDoc && <LoadMoreButton loadMore={loadMoreData} />}
        </VStack>
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
          {isOwnMember && (
            <Button
              leftIcon={<IoPersonCircleOutline />}
              as={Link}
              to={`/setting`}>
              プロフィールを編集
            </Button>
          )}
        </VStack>
      </HStack>
      <AlertDialog
        isOpen={dialog}
        closeOnEsc
        closeOnOverlayClick
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