import { Button } from '@chakra-ui/button';
import { VStack } from '@chakra-ui/layout';
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
  useCallback,
} from 'react';
import { IoPersonCircleOutline, IoQrCode } from 'react-icons/io5';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { GroupContext } from '../contexts/group';
import { GroupTemplate } from '../templates/group';
import {
  activity,
  work,
  Group,
  getGroup,
  getUserActivities,
} from '../utils/group';
import { Member, getMember } from '../utils/member';
import { LoadMoreButton } from './assets';
import { DisplayActivities } from './display-activities';

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
  const { currentId, currentMember, isAdmin } = useContext(GroupContext);
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

  const loadMoreData = useCallback(() => {
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
  }, [activities, currentId, lastActivityDoc, memberId]);

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
      () => (
        <>
          {user && (
            <DisplayActivities
              data={data}
              showMemberData
              editable
              memberData={user}
            />
          )}
        </>
      ),
      [data]
    );

  const LoadMore: React.FC = () =>
    useMemo(() => <LoadMoreButton loadMore={loadMoreData} />, []);
  return (
    <>
      <GroupTemplate
        title={`${user?.name ?? 'ユーザー'}の履歴`}
        displayGoBackButton
        sideWidget={
          <>
            {(isAdmin || isOwnMember) && (
              <Button leftIcon={<IoQrCode />} onClick={() => setDialog(true)}>
                QRコード表示
              </Button>
            )}
            {isOwnMember && (
              <Button
                leftIcon={<IoPersonCircleOutline />}
                as={Link}
                to={`/setting`}>
                プロフィールを編集
              </Button>
            )}
          </>
        }>
        <>
          <VStack w="full" spacing="4" pb="2">
            {activities && <Activities data={activities} />}
            {lastActivityDoc && <LoadMore />}
          </VStack>
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
                <Button
                  ref={dialogCancel}
                  onClick={() => setDialog(false)}
                  mx="5">
                  閉じる
                </Button>
              </AlertDialogBody>
            </AlertDialogContent>
          </AlertDialog>
        </>
      </GroupTemplate>
    </>
  );
}

export default UserActivity;
