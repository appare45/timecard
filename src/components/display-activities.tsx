import React, {
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { activity, getAllActivities, work } from '../utils/group';
import { GroupContext } from '../contexts/group';
import { VStack } from '@chakra-ui/layout';
import { Skeleton } from '@chakra-ui/skeleton';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import ActivityCard from './activity-card';
import { useLoadMore } from '../hooks/loadmore';
import { Member } from '../utils/member';
import { LoadingScreen } from './assets';

export const DisplayActivities: React.FC<{
  data: QueryDocumentSnapshot<activity<work>>[] | null;
  memberData?: Member;
  showMemberData?: boolean;
  editable?: boolean;
}> = ({ data, memberData, showMemberData = true, editable = false }) => {
  const Card: React.FC<{ snapshot: QueryDocumentSnapshot<activity<work>> }> = ({
    snapshot,
  }) =>
    useMemo(
      () => (
        <ActivityCard
          activitySnapshot={snapshot}
          member={memberData}
          editable={editable && currentMember?.id == snapshot.data().memberId}
          showMemberData={showMemberData}
        />
      ),
      [snapshot]
    );
  const { currentMember } = useContext(GroupContext);
  return (
    <Suspense fallback={LoadingScreen}>
      <VStack spacing="3" w="max-content">
        {data?.map((activity, index) => (
          <Card key={activity.id + index} snapshot={activity} />
        ))}
      </VStack>
      {data === null && <Skeleton />}
      {data !== null && !data?.length && (
        <Alert status="info" mt="3">
          <AlertIcon />
          履歴がありません
        </Alert>
      )}
    </Suspense>
  );
};

export const AllActivity: React.FC<{ loadMore?: boolean }> = ({
  loadMore = true,
}) => {
  const { currentGroup } = useContext(GroupContext);
  const [activities, setActivities] = useState<
    QueryDocumentSnapshot<activity<work>>[] | null
  >(null);

  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot>();

  const loadMoreData = useCallback(() => {
    if (currentGroup && activities)
      getAllActivities({
        groupId: currentGroup.id,
        limitCount: 5,
        startAtDocument: lastDoc,
      }).then((_activities) => {
        setActivities((e): QueryDocumentSnapshot<activity<work>>[] => [
          ...(e ?? []),
          ..._activities,
        ]);
        setLastDoc(_activities[4]);
      });
  }, [activities, currentGroup, lastDoc]);

  useMemo(() => {
    if (currentGroup) {
      getAllActivities({ groupId: currentGroup.id, limitCount: 5 }).then(
        (activities) => {
          setActivities(activities);
          setLastDoc(activities[4]);
        }
      );
    }
  }, [currentGroup]);

  const LoadMore: React.FC = () => useLoadMore(loadMoreData);

  const DataDisplay = useCallback(
    () => <DisplayActivities data={activities} editable />,
    [activities]
  );

  return (
    <VStack>
      {activities ? <DataDisplay /> : <Skeleton />}
      {loadMore && lastDoc && <LoadMore />}
    </VStack>
  );
};

export default AllActivity;
