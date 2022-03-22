import { VStack } from '@chakra-ui/layout';
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
} from '@chakra-ui/modal';
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
import { activity, work, getUserActivities } from '../utils/group';
import { Member, getMember } from '../utils/member';
import { LoadingScreen, LoadMoreButton } from '../components/assets';
import { DisplayActivities } from '../components/display-activities';
import { BasicButton, CancelButton } from '../components/buttons';

function UserActivity(): JSX.Element {
  const [lastActivityDoc, setLastActivityDoc] = useState<
    QueryDocumentSnapshot<activity<work>> | null | undefined
  >(null);
  const { memberId } = useParams<{ memberId: string }>();
  const [user, setUser] = useState<Member | null>(null);
  const [activities, setActivities] = useState<
    QueryDocumentSnapshot<activity<work>>[] | null
  >(null);
  const [dialog, setDialog] = useState(false);
  const dialogCancel = useRef(null);
  const { currentGroup, currentMember, isAdmin } = useContext(GroupContext);
  const [isOwnMember, setIsOwnMember] = useState(false);

  useMemo(() => {
    if (currentGroup && !user) {
      if (currentMember?.id == memberId) {
        setUser(currentMember?.data() ?? null);
        setIsOwnMember(currentMember?.id == memberId);
      } else if (currentMember?.id && memberId) {
        getMember(memberId, currentGroup.id).then((member) => {
          setUser(member?.data() ?? null);
        });
      }
    }
  }, [currentGroup, currentMember, memberId, user]);

  const loadMoreData = useCallback(() => {
    if (currentGroup)
      if (lastActivityDoc && memberId) {
        getUserActivities(currentGroup.id, memberId, 5, lastActivityDoc).then(
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
  }, [activities, currentGroup, lastActivityDoc, memberId]);

  useEffect(() => {
    if (currentGroup && memberId)
      getUserActivities(currentGroup.id, memberId, 5).then((activities) => {
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
  }, [currentGroup, memberId]);

  const Card = React.lazy(() => import('../components/createCard'));

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
      {user && (
        <GroupTemplate
          title={`${user.name ?? 'ユーザー'}の履歴`}
          displayGoBackButton
          sideWidget={
            <>
              {(isAdmin || isOwnMember) && (
                <BasicButton
                  leftIcon={<IoQrCode />}
                  onClick={() => setDialog(true)}
                  variant="secondary"
                >
                  QRコード表示
                </BasicButton>
              )}
              {isOwnMember && (
                <BasicButton
                  leftIcon={<IoPersonCircleOutline />}
                  variant="secondary"
                  as={Link}
                  to={`/setting`}
                >
                  プロフィールを編集
                </BasicButton>
              )}
            </>
          }
        >
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
              leastDestructiveRef={dialogCancel}
            >
              <AlertDialogOverlay />
              <AlertDialogContent>
                <AlertDialogHeader>
                  {user?.name}のカード
                  <AlertDialogCloseButton />
                </AlertDialogHeader>
                <AlertDialogBody>
                  {user && currentGroup && memberId && (
                    <Suspense fallback={<LoadingScreen />}>
                      <Card
                        member={{ data: user, id: memberId }}
                        group={currentGroup}
                      />
                    </Suspense>
                  )}
                  <CancelButton
                    variant="primary"
                    onClick={() => setDialog(false)}
                    mx="5"
                  >
                    閉じる
                  </CancelButton>
                </AlertDialogBody>
              </AlertDialogContent>
            </AlertDialog>
          </>
        </GroupTemplate>
      )}
    </>
  );
}

export default UserActivity;
