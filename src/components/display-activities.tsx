import React, { Suspense } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { activity, Member, work } from '../utils/group';
import { Alert, AlertIcon, Spinner, VStack } from '@chakra-ui/react';

const DisplayActivities: React.FC<{
  data: QueryDocumentSnapshot<activity<work>>[] | null;
  memberData?: Member;
  showMemberData?: boolean;
}> = ({ data, memberData, showMemberData = true }) => {
  const ActivityCard = React.lazy(() => import('./activity-card'));
  return (
    <Suspense fallback={null}>
      <VStack spacing="3" w="max-content" pt="5">
        {data?.map((activity) => (
          <ActivityCard
            activitySnapshot={activity}
            key={activity.id}
            member={memberData}
            showMemberData={showMemberData}
          />
        ))}
      </VStack>
      {data === null && <Spinner />}
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
