import React, { useContext, useMemo, useState } from 'react';
import { IoScan } from 'react-icons/io5';
import {
  useNavigate,
  Route,
  Link as RouterLink,
  Routes,
} from 'react-router-dom';
import { BasicButton } from '../components/buttons';
import AllActivity from '../components/display-activities';
import { GroupContext } from '../contexts/group';
import { GroupTemplate } from '../templates/group';
import { dataWithId } from '../utils/firebase';
import { Member } from '../utils/member';
import { EndAllActivity } from './EndAllActivity';

const Timeline: React.FC = () => {
  const { isAdmin } = useContext(GroupContext);
  const history = useNavigate();
  const [detectedMember, setDetectedMember] =
    useState<dataWithId<Member> | null>(null);
  const QRCodeScan = React.lazy(() => import('./../components/qrcodeScan'));
  const MemberAction = React.lazy(() => import('./../components/MemberAction'));
  const SingleActivity = React.lazy(() => import('./../pages/single-activity'));
  const Activities = () => useMemo(() => <AllActivity />, []);
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <GroupTemplate
              title="タイムライン"
              sideWidget={
                <>
                  {isAdmin && (
                    <>
                      <BasicButton
                        variant="secondary"
                        leftIcon={<IoScan />}
                        as={RouterLink}
                        to="/activity/scan"
                      >
                        スキャン
                      </BasicButton>
                    </>
                  )}
                </>
              }
              titleLeftButtons={isAdmin ? <EndAllActivity /> : undefined}
              description="全てのアクティビティーが時間順で並びます"
            >
              <Activities />
            </GroupTemplate>
          }
        />
        <Route
          path={`scan`}
          element={
            !detectedMember ? (
              <QRCodeScan onDetect={(e) => setDetectedMember(e)} />
            ) : (
              <MemberAction
                member={detectedMember}
                onClose={() => {
                  history('/');
                  setDetectedMember(null);
                }}
              />
            )
          }
        ></Route>
        <Route path={`:activityId`} element={<SingleActivity />} />
      </Routes>
    </>
  );
};

export default Timeline;
