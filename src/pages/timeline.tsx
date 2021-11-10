import { Button } from '@chakra-ui/button';
import { Text } from '@chakra-ui/layout';
import { Skeleton } from '@chakra-ui/skeleton';
import React, { Suspense, useContext, useState } from 'react';
import { IoScan } from 'react-icons/io5';
import {
  useRouteMatch,
  useHistory,
  Switch,
  Route,
  Link as RouterLink,
} from 'react-router-dom';
import { MemberAction } from '../components/qrcodeScan';
import { GroupContext } from '../contexts/group';
import { GroupTemplate } from '../templates/group';
import { dataWithId } from '../utils/firebase';
import { Member } from '../utils/member';
import { SingleActivity } from './single-activity';

const Timeline: React.FC = () => {
  const { path } = useRouteMatch();
  const { isAdmin } = useContext(GroupContext);
  const history = useHistory();
  const [detectedMember, setDetectedMember] =
    useState<dataWithId<Member> | null>(null);
  const QRCodeScan = React.lazy(() => import('./../components/qrcodeScan'));
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
                  <Button
                    leftIcon={<IoScan />}
                    as={RouterLink}
                    to="/activity/scan"
                  >
                    スキャン
                  </Button>
                )}
              </>
            }
          >
            <Text>全てのアクティビティーが時間順で並びます</Text>
            <Suspense fallback={<Skeleton />}>
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
