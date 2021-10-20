import React, { ReactElement } from 'react';
import { DocumentSnapshot } from '@firebase/firestore';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { ActivityDetail } from '../components/activity';
import { GroupContext } from '../contexts/group';
import { GroupTemplate } from '../templates/group';
import { activity, work, getActivitySnapshot } from '../utils/group';
import { Member, getMember } from '../utils/member';
export const SingleActivity = (): ReactElement => {
  const { activityId } = useParams<{ activityId: string }>();
  const [activitySnapshot, setActivitySnapshot] = useState<DocumentSnapshot<
    activity<work>
  > | null>(null);
  const { currentId } = useContext(GroupContext);
  useEffect(() => {
    if (activityId && currentId) {
      getActivitySnapshot(activityId, currentId).then((e) =>
        setActivitySnapshot(e)
      );
    }
  }, [activityId, currentId]);
  const [member, setMember] = useState<DocumentSnapshot<Member> | null>();
  useMemo(() => {
    const activityData = activitySnapshot?.data() ?? null;
    if (activitySnapshot && activityData && currentId)
      getMember(activityData.memberId, currentId).then((e) =>
        setMember(e ?? null)
      );
  }, [activitySnapshot, currentId]);
  return (
    <>
      {member && (
        <GroupTemplate
          displayGoBackButton
          title={`${member.data()?.name}のアクティビティー`}>
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
