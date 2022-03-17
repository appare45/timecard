import { Text } from '@chakra-ui/react';
import React from 'react';
import { useContext } from 'react';
import { GroupContext } from '../contexts/group';
import { activity, work } from '../utils/group';
import { DocumentSnapshot } from 'firebase/firestore';
import { millisToText } from '../utils/time';
import { Member } from '../utils/member';
import { ActivityStatus, ActivityMemo } from '../components/activity';

export const ActivityDetail: React.FC<{
  activity: DocumentSnapshot<activity<work>>;
  member: DocumentSnapshot<Member>;
}> = ({ activity, member }) => {
  const activityData = activity.data();
  const { currentMember } = useContext(GroupContext);
  return (
    <>
      {activityData && (
        <>
          {activityData?.content.status === 'done' &&
          activityData.content.endTime ? (
            <Text>
              {/* ToDo: m秒表示を日本語に変換する */}
              {millisToText(
                activityData.content.endTime.toMillis() -
                  activityData.content.startTime.toMillis()
              )}
            </Text>
          ) : (
            <ActivityStatus workStatus={activityData.content.status} />
          )}
          <ActivityMemo
            editable={currentMember?.id == member.id}
            activity={activity}
          />
        </>
      )}
    </>
  );
};
