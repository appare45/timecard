import React, { Suspense, useContext, useState } from 'react';
import { IoScan } from 'react-icons/io5';
import {
  useRouteMatch,
  useHistory,
  Switch,
  Route,
  Link as RouterLink,
} from 'react-router-dom';
import { LoadingScreen } from '../components/assets';
import { BasicButton } from '../components/buttons';
import { GroupContext } from '../contexts/group';
import { GroupTemplate } from '../templates/group';
import { dataWithId } from '../utils/firebase';
import { Member } from '../utils/member';
import { EndAllActivity } from './EndAllActivity';

const Timeline: React.FC = () => {
  const { path } = useRouteMatch();
  const { isAdmin } = useContext(GroupContext);
  const history = useHistory();
  const [detectedMember, setDetectedMember] =
    useState<dataWithId<Member> | null>(null);
  const QRCodeScan = React.lazy(() => import('./../components/qrcodeScan'));
  const MemberAction = React.lazy(() => import('./../components/MemberAction'));
  const SingleActivity = React.lazy(() => import('./../pages/single-activity'));
  const Activities = React.lazy(
    () => import('./../components/display-activities')
  );
  return (
    <>
      <Switch>
        <Route exact path={path}>
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
            <Suspense fallback={<LoadingScreen />}>
              <Activities />
            </Suspense>
          </GroupTemplate>
        </Route>
        <Route exact path={`${path}scan`}>
          {!detectedMember ? (
            <QRCodeScan onDetect={(e) => setDetectedMember(e)} />
          ) : (
            <MemberAction
              member={detectedMember}
              onClose={() => {
                history.push(path);
                setDetectedMember(null);
              }}
            />
          )}
        </Route>
        <Route path={`${path}:activityId`}>
          <SingleActivity />
        </Route>
      </Switch>
    </>
  );
};

export default Timeline;
