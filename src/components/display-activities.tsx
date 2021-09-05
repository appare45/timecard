import React, { Suspense, useContext } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { activity, Member, work } from '../utils/group';
import { Alert, AlertIcon, Skeleton, VStack } from '@chakra-ui/react';
import { GroupContext } from '../contexts/group';

const DisplayActivities: React.FC<{
  data: QueryDocumentSnapshot<activity<work>>[] | null;
  limit?: number;
  memberData?: Member;
  showMemberData?: boolean;
  editable?: boolean;
}> = ({ data, memberData, showMemberData = true, editable = false }) => {
  const ActivityCard = React.lazy(() => import('./activity-card'));
  const { currentMember } = useContext(GroupContext);
  return (
    <Suspense fallback={null}>
      <VStack spacing="3" w="max-content" pt="5">
        {data?.map((activity) => (
          <ActivityCard
            activitySnapshot={activity}
            key={activity.id}
            member={memberData}
            editable={editable && currentMember?.id == activity.data().memberId}
            showMemberData={showMemberData}
          />
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

export default DisplayActivities;
