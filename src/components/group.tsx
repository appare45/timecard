import {
  Box,
  Button,
  Center,
  Circle,
  Heading,
  HStack,
  Icon,
  List,
  ListItem,
  Select,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { DocumentSnapshot } from 'firebase/firestore';
import React, { Suspense, useContext, useEffect, useState } from 'react';
import { useMemo } from 'react';
import { IoAnalytics, IoEasel, IoHome, IoPeople } from 'react-icons/io5';
import { Link as routerLink, Route, Switch } from 'react-router-dom';
import { GroupContext } from '../contexts/group';
import { AuthContext } from '../contexts/user';
import { getAccount, getGroup, getMember, Group, Member } from '../utils/group';
import { Activities, AllActivity } from './activity';

type groupProps = {
  groupIds: string[];
};

const GroupSelector: React.FC<{
  ids: string[];
  groups: Group[];
  update: (e: string) => void;
}> = ({ ids, groups, update }) => {
  return (
    <>
      <Select
        onChange={(e) => update(e.target.value)}
        colorScheme="gray"
        isFullWidth={false}
        width="50">
        {groups.map((group, key) => (
          <option key={ids[key]} value={ids[key]}>
            {group.name}
          </option>
        ))}
      </Select>
    </>
  );
};

const ScanButton: React.FC<{ setFrontMode: () => void }> = ({
  setFrontMode,
}) => {
  return (
    <>
      <Button
        mt="5"
        mb="3"
        colorScheme="cyan"
        leftIcon={<Icon as={IoEasel} />}
        onClick={() => setFrontMode()}>
        フロントモードに切り替える
      </Button>
    </>
  );
};

const MenuLink: React.FC<{
  children: string;
  to: string;
  leftIcon: React.ReactElement;
}> = ({ children, to, leftIcon }) => {
  return (
    <Button
      leftIcon={leftIcon}
      variant="link"
      color="black"
      size="lg"
      p="1.5"
      as={routerLink}
      to={to}
      wordBreak="keep-all">
      {children}
    </Button>
  );
};

const GroupUI: React.FC<groupProps> = ({ groupIds }) => {
  const [groups, updateGroups] = useState<Group[]>([]);
  const [currentId, updateCurrentId] = useState<string>();
  const [frontMode, setFrontMode] = useState<boolean>();
  const { account } = useContext(AuthContext);
  const [currentMemberData, setCurrentMemberData] =
    useState<DocumentSnapshot<Member> | null>(null);
  // フロントモードの切り替え
  useEffect(() => {
    const dbName = 'Group';
    if (window.indexedDB) {
      const DbOpenRequest = indexedDB.open(dbName);
      DbOpenRequest.onupgradeneeded = () => {
        const Db = DbOpenRequest.result;
        try {
          Db.createObjectStore(dbName).add(frontMode, 'frontMode');
        } catch (error) {
          console.error(error);
        }
      };
      DbOpenRequest.onsuccess = () => {
        const Db = DbOpenRequest.result;
        try {
          const transaction = Db.transaction(dbName, 'readwrite');
          const request = transaction.objectStore(dbName).get('frontMode');
          request.onsuccess = () => {
            if (request.result === undefined) {
              transaction.objectStore(dbName).put(false, 'frontMode');
              setFrontMode(false);
            } else if (frontMode === undefined) {
              setFrontMode(request.result);
            } else {
              transaction.objectStore(dbName).put(frontMode, 'frontMode');
            }
          };
        } catch (error) {
          console.error(error);
        }
      };
    }
  }, [frontMode]);

  useMemo(() => {
    const _groups: Group[] = [];
    groupIds.forEach((groupId) => {
      getGroup(groupId).then((group) => {
        if (group) {
          updateGroups([..._groups, group]);
          updateCurrentId(groupIds[0]);
        }
      });
    });
  }, [groupIds]);

  useMemo(() => {
    if (account && currentId)
      getAccount(account.uid, currentId).then((e) => {
        const memberId = e.data()?.memberId;
        if (memberId)
          getMember(memberId, currentId).then((e) =>
            setCurrentMemberData(e ?? null)
          );
      });
  }, [account, currentId]);
  const Members = React.lazy(() => import('./members'));
  const Front = React.lazy(() => import('./front'));
  const CreateGroup = React.lazy(() => import('./create-group'));
  const MembersList = React.lazy(() => import('./members-list'));
  return (
    <>
      {!!groupIds.length && currentId && (
        <GroupContext.Provider
          value={{
            currentId: currentId,
            ids: groupIds,
            setFrontMode: setFrontMode,
            currentMember: currentMemberData,
            updateCurrentMember: setCurrentMemberData,
          }}>
          {frontMode ? (
            <Suspense fallback={<Spinner />}>
              <Front />
            </Suspense>
          ) : (
            <HStack align="start" h="100vh" py="10" px="5" spacing="10">
              <Box pos="sticky" top="10">
                <GroupSelector
                  ids={groupIds}
                  groups={groups}
                  update={updateCurrentId}
                />
                <ScanButton
                  setFrontMode={() => {
                    setFrontMode(true);
                    if (document.fullscreenEnabled)
                      document.body.requestFullscreen();
                  }}
                />
                <List spacing="1.5" my="2">
                  <ListItem>
                    <MenuLink leftIcon={<IoHome />} to="/">
                      トップ
                    </MenuLink>
                  </ListItem>
                  <ListItem>
                    <MenuLink leftIcon={<IoAnalytics />} to="/activity">
                      タイムライン
                    </MenuLink>
                  </ListItem>
                  <ListItem>
                    <MenuLink leftIcon={<IoPeople />} to="/member">
                      メンバー
                    </MenuLink>
                  </ListItem>
                </List>
              </Box>
              <Box w="full">
                <Suspense fallback={null}>
                  <Switch>
                    <Route exact path="/">
                      <VStack spacing="5" align="flex-start" w="full">
                        <Heading>オンラインのメンバー</Heading>
                        <MembersList onlyOnline />
                        <Heading>最近のアクティビティー</Heading>
                        <AllActivity />
                      </VStack>
                    </Route>
                    <Route path={`/activity/`}>
                      <Activities />
                    </Route>
                    <Route path={`/member/`}>
                      <Members />
                    </Route>
                  </Switch>
                </Suspense>
              </Box>
            </HStack>
          )}
        </GroupContext.Provider>
      )}
      {!currentId && <Circle />}
      {!groupIds.length && (
        <Center h="100vh">
          <VStack p="10" rounded="2xl" shadow="lg">
            <Heading>グループの作成</Heading>
            <section>
              <Text>現在では既存のグループに参加することはできません。</Text>
              <Text>将来的に対応予定なのでしばらくお待ちください</Text>
            </section>
            <CreateGroup />
          </VStack>
        </Center>
      )}
    </>
  );
};

export default GroupUI;
