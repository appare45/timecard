import React, {
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { activity, getAllActivities, Member, work } from '../utils/group';
import { Alert, AlertIcon, Skeleton, VStack } from '@chakra-ui/react';
import { GroupContext } from '../contexts/group';
import { LoadMoreButton } from './assets';
import ActivityCard from './activity-card';

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
    <Suspense fallback={null}>
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
  const { currentId } = useContext(GroupContext);
  const [activities, setActivities] = useState<
    QueryDocumentSnapshot<activity<work>>[] | null
  >(null);

  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot>();

  const loadMoreData = () => {
    if (currentId && activities)
      getAllActivities(currentId, 5, lastDoc).then((_activities) => {
        setActivities([...activities, ..._activities]);
        setLastDoc(_activities[4]);
      });
  };

  useEffect(() => {
    if (currentId) {
      getAllActivities(currentId, 5).then((activities) => {
        setActivities(activities);
        setLastDoc(activities[4]);
      });
    }
  }, [currentId]);

  const LoadMore: React.FC = () =>
    useMemo(() => <LoadMoreButton loadMore={loadMoreData} />, []);

  return (
    <Suspense fallback={null}>
      <VStack>
        <DisplayActivities data={activities} editable />
        {loadMore && lastDoc && <LoadMore />}
      </VStack>
    </Suspense>
  );
};

export default AllActivity;
