import React, { useContext, useMemo, useState } from 'react';
import { GroupTemplate } from '../templates/group';
import { BasicButton } from '../components/buttons';
import {
  IoEaselOutline,
  IoPause,
  IoPersonCircleOutline,
  IoPlay,
} from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { Link as RouterLink } from 'react-router-dom';
import {
  activity,
  addWork,
  getLatestActivity,
  setWork,
  work,
} from '../utils/group';
import { QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
const ScanButton: React.FC<{ setFrontMode: () => void }> = ({
  setFrontMode,
}) => {
  return (
    <>
      <BasicButton
        variant="primary"
        leftIcon={<IoEaselOutline />}
        onClick={() => setFrontMode()}
      >
        フロントモードに切り替える
      </BasicButton>
    </>
  );
};

const Top: React.FC<{
  setFrontMode: (e: boolean) => unknown;
}> = ({ setFrontMode }) => {
  const AllActivity = React.lazy(
    () => import('../components/display-activities')
  );
  const {
    isAdmin,
    currentMember: currentMemberData,
    currentGroup,
  } = useContext(GroupContext);
  const [latestActivity, setLatestActivity] =
    useState<QueryDocumentSnapshot<activity<work>>>();
  useMemo(() => {
    if (currentGroup && currentMemberData) {
      getLatestActivity(currentGroup.id, currentMemberData.id).then(
        setLatestActivity
      );
    }
  }, [currentGroup, currentMemberData]);
  return (
    <GroupTemplate
      title="最新のアクティビティー"
      sideWidget={
        <>
          {isAdmin && (
            <ScanButton
              setFrontMode={() => {
                setFrontMode(true);
                document.body.requestFullscreen();
              }}
            />
          )}
          {latestActivity?.data().content.status === 'running' ? (
            <BasicButton
              variant="secondary"
              leftIcon={<IoPause />}
              onClick={() => {
                {
                  const _activityData = latestActivity.data();
                  _activityData.content.endTime = Timestamp.now();
                  _activityData.content.status = 'done';
                  if (currentGroup)
                    setWork(currentGroup.id, latestActivity.id, _activityData, {
                      merge: true,
                    }).then(async () => {
                      setLatestActivity(
                        await getLatestActivity(
                          currentGroup.id,
                          currentMemberData?.id ?? ''
                        )
                      );
                    });
                }
              }}
            >
              アクティビティーを終了
            </BasicButton>
          ) : (
            <BasicButton
              variant="primary"
              leftIcon={<IoPlay />}
              onClick={() => {
                if (currentGroup && currentMemberData) {
                  addWork(currentGroup.id, {
                    type: 'work',
                    content: {
                      startTime: Timestamp.now(),
                      endTime: null,
                      status: 'running',
                      memo: '',
                    },
                    memberId: currentMemberData.id,
                  }).then(() => {
                    getLatestActivity(
                      currentGroup.id,
                      currentMemberData.id
                    ).then(setLatestActivity);
                  });
                }
              }}
            >
              アクティビティーを開始
            </BasicButton>
          )}
          <BasicButton
            as={RouterLink}
            leftIcon={<IoPersonCircleOutline />}
            to={`/member/${currentMemberData?.id}`}
            variant="secondary"
          >
            自分のアクティビティーを確認
          </BasicButton>
        </>
      }
    >
      <AllActivity loadMore={false} />
    </GroupTemplate>
  );
};

export default Top;
