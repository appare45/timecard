import React, { ReactElement } from 'react';
import { DocumentSnapshot } from '@firebase/firestore';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { ActivityDetail } from './ActivityDetail';
import { GroupContext } from '../contexts/group';
import { GroupTemplate } from '../templates/group';
import { activity, work, getActivitySnapshot } from '../utils/group';
import { Member, getMember } from '../utils/member';
const SingleActivity = (): ReactElement => {
  const { activityId } = useParams<{ activityId: string }>();
  const [activitySnapshot, setActivitySnapshot] = useState<DocumentSnapshot<
    activity<work>
  > | null>(null);
  const { currentGroup } = useContext(GroupContext);
  useEffect(() => {
    if (activityId && currentGroup) {
      getActivitySnapshot(activityId, currentGroup.id).then((e) =>
        setActivitySnapshot(e)
      );
    }
  }, [activityId, currentGroup]);
  const [member, setMember] = useState<DocumentSnapshot<Member> | null>();
  useMemo(() => {
    const activityData = activitySnapshot?.data() ?? null;
    if (activitySnapshot && activityData && currentGroup)
      getMember(activityData.memberId, currentGroup.id).then((e) =>
        setMember(e ?? null)
      );
  }, [activitySnapshot, currentGroup]);
  return (
    <>
      {member && (
        <GroupTemplate
          displayGoBackButton
          title={`${member.data()?.name}のアクティビティー`}
        >
          <>
            {activitySnapshot && member && (
              <ActivityDetail activity={activitySnapshot} member={member} />
            )}
          </>
        </GroupTemplate>
      )}
    </>
  );
};

export default SingleActivity;
